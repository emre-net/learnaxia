import prisma from "@/lib/prisma";
import { ItemType, StudyMode } from "@/lib/types";

export class StudyService {
    static async startSession(userId: string | null, moduleId: string, mode: StudyMode) {
        // Virtual Tutorial / Demo Mode for Guests & First-Time Users
        if (moduleId === 'tutorial' || moduleId === 'demo') {
            const tutorialItems = [
                {
                    id: 'tut-1',
                    moduleId: 'tutorial',
                    type: 'FLASHCARD' as const,
                    content: {
                        front: 'Aralıklı Tekrar (Spaced Repetition) Nedir?',
                        back: 'Bilişsel psikolojide hafıza eğrisine göre optimize edilmiş bir öğrenme tekniğidir. Bilgiyi unutmaya en yakın olduğunuz anda hatırlatarak uzun süreli hafızaya yerleştirir.',
                        question: 'Aralıklı Tekrar (Spaced Repetition) Nedir?',
                        answer: 'Bilişsel psikolojide hafıza eğrisine göre optimize edilmiş bir öğrenme tekniğidir. Bilgiyi unutmaya en yakın olduğunuz anda hatırlatarak uzun süreli hafızaya yerleştirir.'
                    },
                    hash: 'tut-1-hash',
                    strengthScore: 1,
                    box: 1,
                    interval: 1,
                    isRetired: false
                },
                {
                    id: 'tut-2',
                    moduleId: 'tutorial',
                    type: 'MC' as const,
                    content: {
                        question: "Learnaxia'da momentum serinizi (streak) korumak ve puan kazanmak için en etkili yöntem nedir?",
                        options: [
                            'Her gün düzenli olarak en az 1 modül tamamlamak',
                            'Haftada bir gün 10 saat aralıksız çalışmak',
                            'Sadece sınav gecesi sabahlamak',
                            'Çalışma kartlarını karıştırmadan ezberlemek'
                        ],
                        answer: 'Her gün düzenli olarak en az 1 modül tamamlamak'
                    },
                    hash: 'tut-2-hash',
                    strengthScore: 1,
                    box: 1,
                    interval: 1,
                    isRetired: false
                },
                {
                    id: 'tut-3',
                    moduleId: 'tutorial',
                    type: 'GAP' as const,
                    content: {
                        text: 'Learnaxia, yapay zeka ile notlarınızı saniyeler içinde [bilimsel] çalışma kartlarına dönüştürür.',
                        gap: 'bilimsel',
                        answer: 'bilimsel',
                        question: 'Boşluğu doldurunuz:'
                    },
                    hash: 'tut-3-hash',
                    strengthScore: 1,
                    box: 1,
                    interval: 1,
                    isRetired: false
                },
                {
                    id: 'tut-4',
                    moduleId: 'tutorial',
                    type: 'MC' as const,
                    content: {
                        question: 'Düzenli kısa aralıklı tekrarlar, tek seferlik yoğun ezbere göre bilginin akılda kalıcılığını 3 kata kadar artırır.',
                        options: ['Doğru', 'Yanlış'],
                        answer: 'Doğru'
                    },
                    hash: 'tut-4-hash',
                    strengthScore: 1,
                    box: 1,
                    interval: 1,
                    isRetired: false
                }
            ];

            return {
                sessionId: `guest_tutorial_${Date.now()}`,
                module: {
                    id: 'tutorial',
                    title: 'Learnaxia Hızlı Başlangıç & Deneme Turu',
                    type: 'FLASHCARD'
                },
                items: tutorialItems,
                mode: mode || 'NORMAL',
                resumedFromIndex: 0,
                isGuest: true
            };
        }

        // 1. Fetch Module & Items First
        const dbModule = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!dbModule) throw new Error("Module not found");

        // 2. Access Check for Guests (userId === null) vs Authenticated Users
        if (!userId) {
            // Unauthenticated guest: only allow public modules
            if (dbModule.visibility !== 'PUBLIC') {
                throw new Error("Unauthorized Study Access");
            }

            const items = dbModule.items.map(item => {
                let type: any = item.type;
                let content: any = { ...item.content as object };

                if (type === 'MULTIPLE_CHOICE') type = 'MC';
                if (type === 'GAP_FILL') type = 'GAP';
                if (type === 'MC' || type === 'FLASHCARD' || type === 'TRUE_FALSE') {
                    if (!content.question && content.front) content.question = content.front;
                    if (!content.front && content.question) content.front = content.question;
                    if (!content.answer && content.back) content.answer = content.back;
                    if (!content.back && content.answer) content.back = content.answer;
                }

                if (type === 'TRUE_FALSE') {
                    type = 'MC';
                    const tfQuestion = content.question || content.Question || content.statement || content.Statement || content.text;
                    if (!content.question && tfQuestion) content.question = tfQuestion;
                    if (!content.options || content.options.length === 0) content.options = ["True", "False"];
                }

                return {
                    id: item.id,
                    moduleId: item.moduleId,
                    type: type,
                    content: content,
                    hash: item.contentHash,
                    lastResult: null,
                    strengthScore: 0,
                    box: 1,
                    interval: 0,
                    nextReviewAt: null,
                    isRetired: false
                };
            });

            return {
                sessionId: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                module: {
                    id: dbModule.id,
                    title: dbModule.title,
                    type: dbModule.type
                },
                items,
                mode: 'NORMAL' as StudyMode,
                resumedFromIndex: 0,
                isGuest: true
            };
        }

        // Permissive Access Check for Authenticated Users
        const isPublic = dbModule.visibility === 'PUBLIC';
        const isOwner = dbModule.ownerId === userId;
        const isPrivateLinked = dbModule.visibility === 'PRIVATE';

        let hasAccess = isPublic || isOwner || isPrivateLinked;

        if (!hasAccess) {
            throw new Error("Unauthorized Study Access");
        }

        // 3. Fetch User Progress (Parallel)
        const [itemProgresses, sm2Progresses] = await Promise.all([
            prisma.itemProgress.findMany({
                where: { userId, itemId: { in: dbModule.items.map(i => i.id) } }
            }),
            prisma.sM2Progress.findMany({
                where: { userId, itemId: { in: dbModule.items.map(i => i.id) } }
            })
        ]);

        // 4. Merge & Filter Logic
        let items = dbModule.items.map(item => {
            const progress = itemProgresses.find(p => p.itemId === item.id);
            const sm2 = sm2Progresses.find(p => p.itemId === item.id);

            // Normalize Type & Content
            let type: any = item.type;
            let content: any = { ...item.content as object };

            if (type === 'MULTIPLE_CHOICE') type = 'MC';
            if (type === 'GAP_FILL') type = 'GAP';
            if (type === 'MC' || type === 'FLASHCARD' || type === 'TRUE_FALSE') {
                if (!content.question && content.front) content.question = content.front;
                if (!content.front && content.question) content.front = content.question;
                if (!content.answer && content.back) content.answer = content.back;
                if (!content.back && content.answer) content.back = content.answer;
            }

            if (type === 'TRUE_FALSE') {
                type = 'MC'; // Render TF as Multiple Choice (Quiz)
                // Tolerate AI JSON casing
                const tfQuestion = content.question || content.Question || content.statement || content.Statement || content.text;
                if (!content.question && tfQuestion) {
                    content.question = tfQuestion;
                }
                // Ensure options exist for TF
                if (!content.options || content.options.length === 0) {
                    content.options = ["True", "False"];
                }
            }

            return {
                id: item.id,
                moduleId: item.moduleId,
                type: type,
                content: content,
                hash: item.contentHash,
                // Progress Data
                lastResult: progress?.lastResult,
                strengthScore: progress?.strengthScore ?? 0,
                // SM2 Data
                box: _calculateBox(sm2?.interval), // Visual representation
                interval: sm2?.interval ?? 0,
                nextReviewAt: sm2?.nextReviewAt,
                isRetired: sm2?.isRetired ?? false
            };
        });

        // 5. Apply Mode Filters
        if (mode === 'WRONG_ONLY') {
            // Handbook Rule: "Item changed -> no longer wrong".
            // Filter: lastResult == WRONG AND item.hash == progress.hash
            items = items.filter(i => {
                const progress = itemProgresses.find(p => p.itemId === i.id);
                return i.lastResult === 'WRONG' && progress?.contentHash === i.hash;
            });
        } else if (mode === 'SM2') {
            // SM-2 Filter: Due items only (or new)
            // Due: nextReviewAt <= NOW
            const now = new Date();
            items = items.filter(i => {
                // Include if:
                // 1. No SM2 record (new item)
                // 2. Due for review
                // 3. Retired items excluded
                if (!i.nextReviewAt) return true; // New
                if (i.isRetired) return false;
                return new Date(i.nextReviewAt) <= now;
            });
        } else if (mode === 'AI_SMART') {
            // Smart Order: Prioritize WRONG > New > Review
            items = items.sort((a, b) => {
                const scoreA = (a.lastResult === 'WRONG' ? 100 : 0) + (a.interval === 0 ? 50 : 0);
                const scoreB = (b.lastResult === 'WRONG' ? 100 : 0) + (b.interval === 0 ? 50 : 0);
                return scoreB - scoreA;
            });
        }




        // 6. Find Resumption Index (Improved)
        // Find the index of the first item that doesn't have a CORRECT progress
        const firstUnsolvedIndex = (dbModule as any).items.findIndex((item: any) => {
            const progress = itemProgresses.find((p: any) => p.itemId === item.id);
            return !progress || progress.lastResult !== 'CORRECT';
        });

        // 7. Create Session Log
        const session = await prisma.learningSession.create({
            data: {
                userId,
                moduleId,
                startedAt: new Date()
            }
        });

        return {
            sessionId: session.id,
            module: {
                id: dbModule.id,
                title: dbModule.title,
                type: dbModule.type
            },
            items,
            mode,
            resumedFromIndex: firstUnsolvedIndex >= 0 ? firstUnsolvedIndex : 0,
            isGuest: false
        };
    }
}

// Helper to estimate a "box" number (Leitner style) from SM-2 interval for UI
function _calculateBox(interval?: number): number {
    if (!interval || interval <= 1) return 1;
    if (interval <= 3) return 2;
    if (interval <= 7) return 3;
    if (interval <= 21) return 4;
    return 5;
}
