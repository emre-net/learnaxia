import OpenAI from "openai";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { CATEGORIES, MAIN_CATEGORIES, MainCategory } from "@learnaxia/shared";
import { z } from "zod";

export type QuestionType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';

export interface OfficialModuleInput {
    topic: string;
    type?: QuestionType | 'AUTO';
    count?: number;
    language?: 'tr' | 'en';
}

export interface GeneratedOfficialModuleResult {
    moduleId: string;
    title: string;
    description: string;
    type: QuestionType;
    category: string;
    subCategory: string;
    itemCount: number;
    items: Array<{
        id: string;
        type: string;
        order: number;
        content: any;
    }>;
}

const DEFAULT_AI_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

export class OfficialModuleGeneratorService {
    private static getClient(): OpenAI {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY bulunamadı. Lütfen .env dosyanızı kontrol edin.");
        }
        return new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });
    }

    /**
     * Adım 1: Konuyu analiz edip başlık, açıklama, kategori, alt kategori ve en uygun soru tipini belirler.
     */
    private static async analyzeTopicAndTaxonomy(
        client: OpenAI,
        topic: string,
        requestedType?: QuestionType | 'AUTO',
        language: 'tr' | 'en' = 'tr'
    ): Promise<{
        title: string;
        description: string;
        selectedType: QuestionType;
        category: string;
        subCategory: string;
    }> {
        const categoriesJson = JSON.stringify(CATEGORIES, null, 2);

        const prompt = `
Sen LearnAxia eğitim platformunun Baş Küratör ve Pedagoji Uzmanı AI'sısın.
Görevin, verilen konu için LearnAxia standartlarına tam uyumlu bir resmi modül künyesi çıkarmak.

Platformumuzda desteklenen ana kategoriler ve alt kategoriler şunlardır:
${categoriesJson}

Platformumuzda desteklenen 4 homojen soru tipi vardır:
1. FLASHCARD (Kavram, terim, yabancı dil kelimeleri, formüller için ideal)
2. MC (Çoktan seçmeli 4 seçenekli test; analiz, bilgi ölçme, sınav hazırlığı için ideal)
3. TRUE_FALSE (Doğru / Yanlış önerme testi; yaygın yanılgıları ayıklama ve kavramsal doğruluk için ideal)
4. GAP (Cümle içi boşluk doldurma; tanım, kural ve ezber bilgisi için ideal)

Kullanıcının Verdiği Konu: "${topic}"
İstenen Soru Tipi: ${requestedType && requestedType !== 'AUTO' ? requestedType : 'OTOMATİK (En uygun olanı sen seç)'}
Dil: ${language.toUpperCase()}

Lütfen YALNIZCA aşağıdaki JSON formatında yanıt ver:
{
  "title": "Kısa, çekici ve net modül başlığı (en fazla 60 karakter)",
  "description": "Modülün neyi öğrettiğini özetleyen profesyonel açıklama (1-2 cümle)",
  "selectedType": "${requestedType && requestedType !== 'AUTO' ? requestedType : 'FLASHCARD veya MC veya TRUE_FALSE veya GAP'}",
  "category": "Verilen listedeki TAM Ana Kategori adı",
  "subCategory": "Seçilen ana kategori altındaki TAM Alt Kategori adı"
}
`;

        const response = await client.chat.completions.create({
            model: DEFAULT_AI_MODEL,
            messages: [
                { role: "system", content: "You are an educational curriculum planner. Always output valid JSON only." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
        });

        const raw = response.choices[0].message.content || "{}";
        let parsed: any;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            throw new Error(`AI analiz yanıtı JSON olarak okunamadı: ${raw}`);
        }

        // Validate type
        const validTypes: QuestionType[] = ['FLASHCARD', 'MC', 'TRUE_FALSE', 'GAP'];
        let finalType: QuestionType = validTypes.includes(parsed.selectedType)
            ? parsed.selectedType
            : (requestedType && requestedType !== 'AUTO' ? requestedType : 'FLASHCARD');

        if (requestedType && requestedType !== 'AUTO') {
            finalType = requestedType;
        }

        // Validate Category & SubCategory against taxonomy
        let finalCategory = parsed.category;
        let finalSubCategory = parsed.subCategory;

        if (!CATEGORIES[finalCategory]) {
            // Fallback: search which category has this subcategory or pick Genel Kültür
            const matchedCat = Object.keys(CATEGORIES).find(cat =>
                CATEGORIES[cat].includes(finalSubCategory)
            );
            if (matchedCat) {
                finalCategory = matchedCat;
            } else {
                finalCategory = "Genel Kültür";
                finalSubCategory = "Diğer";
            }
        } else if (!CATEGORIES[finalCategory].includes(finalSubCategory)) {
            finalSubCategory = CATEGORIES[finalCategory][0] || "Diğer";
        }

        return {
            title: String(parsed.title || topic).slice(0, 100),
            description: String(parsed.description || `${topic} hakkında LearnAxia resmi çalışma modülü.`),
            selectedType: finalType,
            category: finalCategory,
            subCategory: finalSubCategory
        };
    }

    /**
     * Adım 2: Belirlenen soru tipi için tam şemaya uyan homojen içerik üretir.
     */
    private static async generateItemsForType(
        client: OpenAI,
        topic: string,
        title: string,
        type: QuestionType,
        count: number = 8,
        language: 'tr' | 'en' = 'tr'
    ): Promise<Array<any>> {
        let typeInstructions = "";

        if (type === 'FLASHCARD') {
            typeInstructions = `
Her kart için tam olarak şu JSON nesnesini üret:
{
  "front": "Ön yüzdeki soru, kavram veya terim",
  "back": "Arka yüzdeki detaylı, eğitici ve net açıklama veya cevap"
}
`;
        } else if (type === 'MC') {
            typeInstructions = `
Her soru için tam olarak şu JSON nesnesini üret:
{
  "question": "Net ve anlaşılır soru kökü",
  "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
  "correctAnswer": "options dizisindeki doğru olan seçeneğin BİREBİR AYNI METNİ",
  "explanation": "Doğru cevabın neden doğru olduğunu ve konsepti açıklayan kısa gerekçe"
}
Önemli: options dizisinde TAM OLARAK 4 seçenek olmalıdır. correctAnswer mutlaka options içindeki bir elemanla harfi harfine eşleşmelidir.
`;
        } else if (type === 'TRUE_FALSE') {
            typeInstructions = `
Her önerme için tam olarak şu JSON nesnesini üret:
{
  "statement": "Kesin bir yargı bildiren doğru veya yanlış önerme cümlesi",
  "correctAnswer": true, // Önerme doğruysa true, yanlışsa false (boolean)
  "explanation": "Önermenin neden doğru ya da yanlış olduğunu anlatan açıklama"
}
Önemli: correctAnswer bir boolean (true veya false) olmalıdır, tırnak içine alma. Önermelerin yaklaşık yarısı doğru, yarısı yanlış olsun.
`;
        } else if (type === 'GAP') {
            typeInstructions = `
Her boşluk doldurma sorusu için tam olarak şu JSON nesnesini üret:
{
  "text": "Cümle içinde boşluk bırakılacak kelimeyi veya kelime öbeğini {{Çift Süslü Parantez}} içine al.",
  "answers": ["Çift Süslü Parantez"],
  "correctAnswer": "Çift Süslü Parantez",
  "explanation": "Cümlenin bağlamını açıklayan not"
}
Önemli: text içinde MUTLAKA en az bir tane {{kelime}} formatında çift süslü parantez bulunmalıdır! answers dizisi bu parantez içindeki kelimeyi içermelidir.
Örnek: "Türkiye'nin başkenti {{Ankara}} şehridir."
`;
        }

        const prompt = `
Sen LearnAxia eğitim platformu için yüksek kaliteli içerik üreten kıdemli bir eğitimcisin.
Konu: "${topic}" (Modül Başlığı: "${title}")
Soru Tipi: ${type}
Üretilecek Soru/Kart Sayısı: ${count}
Dil: ${language.toUpperCase()}

Format ve Kalite Kuralları:
- Sadece ve sadece ${type} tipinde sorular üret (Homojenlik kuralı).
- İçerikler pedagojik olarak öğretici, net, hatasız ve doğrudan konunun özünü kavratıcı olmalıdır.
- Soru metinleri veya cevaplar boş olamaz.

${typeInstructions}

Lütfen YALNIZCA aşağıdaki JSON formatında yanıt ver:
{
  "items": [
    ... ${count} adet nesne ...
  ]
}
`;

        const response = await client.chat.completions.create({
            model: DEFAULT_AI_MODEL,
            messages: [
                { role: "system", content: "You are an elite academic question generator. Return valid JSON only with exact schemas." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4
        });

        const raw = response.choices[0].message.content || "{}";
        let parsed: any;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            throw new Error(`AI soru üretim çıktısı JSON olarak okunamadı: ${raw}`);
        }

        const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
        if (rawItems.length === 0) {
            throw new Error("AI tarafından hiçbir soru/kart üretilemedi.");
        }

        // Validate and clean each item according to type
        const validatedItems = [];
        for (const item of rawItems) {
            if (type === 'FLASHCARD') {
                if (item.front && item.back) {
                    validatedItems.push({
                        front: String(item.front).trim(),
                        back: String(item.back).trim(),
                        question: String(item.front).trim(),
                        answer: String(item.back).trim()
                    });
                }
            } else if (type === 'MC') {
                const question = item.question || item.front;
                const options = Array.isArray(item.options) ? item.options.map((o: any) => String(o).trim()) : [];
                if (question && options.length >= 2) {
                    // Ensure exactly 4 options if possible
                    while (options.length < 4) {
                        options.push(`Seçenek ${options.length + 1}`);
                    }
                    const validOptions = options.slice(0, 4);
                    let correctAnswer = String(item.correctAnswer || item.answer || validOptions[0]).trim();
                    if (!validOptions.includes(correctAnswer)) {
                        correctAnswer = validOptions[0];
                    }
                    validatedItems.push({
                        question: String(question).trim(),
                        options: validOptions,
                        correctAnswer,
                        explanation: item.explanation ? String(item.explanation).trim() : undefined
                    });
                }
            } else if (type === 'TRUE_FALSE') {
                const statement = item.statement || item.question;
                if (statement) {
                    const isTrue = item.correctAnswer === true || String(item.correctAnswer).toLowerCase() === 'true';
                    validatedItems.push({
                        statement: String(statement).trim(),
                        question: String(statement).trim(),
                        correctAnswer: isTrue,
                        explanation: item.explanation ? String(item.explanation).trim() : undefined
                    });
                }
            } else if (type === 'GAP') {
                let text = String(item.text || item.question || '').trim();
                // Check if has {{...}}
                const gapRegex = /\{\{([^}]+)\}\}/g;
                let match = gapRegex.exec(text);
                let answers: string[] = [];
                if (match) {
                    answers.push(match[1].trim());
                    while ((match = gapRegex.exec(text)) !== null) {
                        answers.push(match[1].trim());
                    }
                } else if (item.correctAnswer || item.answer) {
                    // Wrap the answer in text
                    const ans = String(item.correctAnswer || item.answer).trim();
                    text = text.replace(ans, `{{${ans}}}`);
                    answers = [ans];
                }

                if (answers.length > 0) {
                    validatedItems.push({
                        text,
                        question: text,
                        answers,
                        correctAnswer: answers[0],
                        explanation: item.explanation ? String(item.explanation).trim() : undefined
                    });
                }
            }
        }

        if (validatedItems.length === 0) {
            throw new Error(`${type} formatına uygun geçerli soru nesnesi oluşturulamadı.`);
        }

        return validatedItems;
    }

    /**
     * Resmi @learnaxia kullanıcısını veritabanında bulur veya oluşturur.
     */
    private static async getOrCreateLearnAxiaUser() {
        let owner = await prisma.user.findFirst({
            where: {
                OR: [
                    { handle: 'learnaxia' },
                    { email: 'learnaxia@test.com' }
                ]
            }
        });

        if (!owner) {
            owner = await prisma.user.create({
                data: {
                    name: 'LearnAxia Official',
                    email: 'learnaxia@test.com',
                    handle: 'learnaxia',
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    image: 'https://learnaxia.com/icon.png'
                }
            });
        }

        return owner;
    }

    /**
     * Ana Fonksiyon: Verilen konuyu analiz eder, soruları üretir ve LearnAxia adına veritabanında yayınlar.
     */
    static async generateAndPublish(input: OfficialModuleInput): Promise<GeneratedOfficialModuleResult> {
        const client = this.getClient();
        const trimmedTopic = input.topic.trim();
        if (trimmedTopic.length < 3) {
            throw new Error("Lütfen en az 3 karakterden oluşan bir konu girin.");
        }

        const count = Math.min(Math.max(input.count || 8, 3), 20);
        const language = input.language || 'tr';

        // 1. Analiz & Taksonomi Eşleştirme
        const analysis = await this.analyzeTopicAndTaxonomy(client, trimmedTopic, input.type, language);

        // 2. Homojen Soru/Kart Üretimi
        const validatedItems = await this.generateItemsForType(
            client,
            trimmedTopic,
            analysis.title,
            analysis.selectedType,
            count,
            language
        );

        // 3. Veritabanına Resmi Kullanıcı Adına Kayıt
        const owner = await this.getOrCreateLearnAxiaUser();

        const createdModule = await prisma.module.create({
            data: {
                title: analysis.title,
                description: analysis.description,
                type: analysis.selectedType,
                status: 'ACTIVE',
                visibility: 'PUBLIC',
                isVerified: true,
                isForkable: true,
                ownerId: owner.id,
                creatorId: owner.id,
                category: analysis.category,
                subCategory: analysis.subCategory,
                items: {
                    create: validatedItems.map((item, idx) => ({
                        type: analysis.selectedType,
                        order: idx + 1,
                        contentHash: crypto.createHash('md5').update(JSON.stringify(item)).digest('hex'),
                        content: item
                    }))
                }
            },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        // 4. Kütüphaneye Ekle
        await prisma.userModuleLibrary.upsert({
            where: {
                userId_moduleId: {
                    userId: owner.id,
                    moduleId: createdModule.id
                }
            },
            update: { role: 'OWNER' },
            create: {
                userId: owner.id,
                moduleId: createdModule.id,
                role: 'OWNER'
            }
        });

        return {
            moduleId: createdModule.id,
            title: createdModule.title,
            description: createdModule.description || '',
            type: createdModule.type as QuestionType,
            category: createdModule.category || 'Genel',
            subCategory: createdModule.subCategory || 'Genel',
            itemCount: createdModule.items.length,
            items: createdModule.items.map(item => ({
                id: item.id,
                type: item.type,
                order: item.order,
                content: item.content
            }))
        };
    }
}
