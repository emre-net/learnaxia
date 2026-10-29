#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
    const prefix = `--${name}=`;
    const found = args.find(a => a.startsWith(prefix));
    if (found) return found.slice(prefix.length).replace(/^["']|["']$/g, '');
    const idx = args.indexOf(`--${name}`);
    if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
        return args[idx + 1].replace(/^["']|["']$/g, '');
    }
    return defaultValue;
}

const topic = getArg('topic', '');
const type = getArg('type', 'AUTO'); // FLASHCARD, MC, TRUE_FALSE, GAP, AUTO
const count = parseInt(getArg('count', '8'), 10);
const language = getArg('language', 'tr');
const target = getArg('target', 'auto'); // 'local', 'prod', or 'auto'

if (!topic || topic.trim().length < 3) {
    console.error(`\n❌ HATA: Lütfen geçerli bir konu belirtin!`);
    console.error(`Kullanım: node --env-file=apps/web/.env apps/web/scripts/trigger-official-generator.mjs --topic="Konu Başlığı" [--type=MC|FLASHCARD|TRUE_FALSE|GAP|AUTO] [--count=8]\n`);
    process.exit(1);
}

// Read secrets from environment
const secret = process.env.AUTH_SECRET || process.env.SYNC_SECRET || process.env.ADMIN_PASSWORD;
if (!secret) {
    console.error(`\n❌ HATA: AUTH_SECRET bulunamadı. Lütfen .env dosyanızı kontrol edin!\n`);
    process.exit(1);
}

async function determineBaseUrl() {
    if (target === 'local') return 'http://localhost:3000';
    if (target === 'prod') return 'https://learnaxia.com';

    // Auto: Check if localhost:3000 is reachable, otherwise default to prod
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('http://localhost:3000/api/ping', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            console.log(`📡 Yerel dev sunucusu tespit edildi (http://localhost:3000).`);
            return 'http://localhost:3000';
        }
    } catch {
        // Fallback to production
    }

    console.log(`🌐 Canlı sunucu kullanılıyor (https://learnaxia.com).`);
    return 'https://learnaxia.com';
}

async function main() {
    console.log(`\n======================================================`);
    console.log(`🚀 LearnAxia Resmi AI Modül Jeneratörü Başlatılıyor...`);
    console.log(`======================================================`);
    console.log(`📌 Konu:        "${topic}"`);
    console.log(`🎯 Soru Tipi:   ${type}`);
    console.log(`🔢 Soru Sayısı: ${count}`);
    console.log(`🌍 Dil:         ${language.toUpperCase()}`);

    const baseUrl = await determineBaseUrl();
    const endpoint = `${baseUrl}/api/admin/official-module/generate`;

    console.log(`⏳ AI analiz ediyor, soruları üretiyor ve veritabanına kaydediyor...`);
    const startTime = Date.now();

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': secret
            },
            body: JSON.stringify({
                topic,
                type,
                count,
                language
            })
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!res.ok) {
            let errorText = await res.text();
            try {
                const errJson = JSON.parse(errorText);
                errorText = errJson.error || errorText;
            } catch {}
            throw new Error(`API Hatası [HTTP ${res.status}]: ${errorText}`);
        }

        const data = await res.json();
        const mod = data.module;

        console.log(`\n======================================================`);
        console.log(`✅ BAŞARILI! Modül Üretildi ve Yayına Alındı (${elapsed}s)`);
        console.log(`======================================================`);
        console.log(`🆔 Modül ID:    ${mod.moduleId}`);
        console.log(`🏷️ Başlık:      ${mod.title}`);
        console.log(`📝 Açıklama:    ${mod.description}`);
        console.log(`🎲 Soru Tipi:   ${mod.type}`);
        console.log(`📁 Kategori:    ${mod.category} > ${mod.subCategory}`);
        console.log(`📊 Kart Sayısı: ${mod.itemCount}`);
        console.log(`🔗 Web URL:     ${baseUrl}/dashboard/modules/${mod.moduleId}`);
        console.log(`📲 Mobil:       Keşfet (Discover) ekranında anında yayında!`);
        console.log(`------------------------------------------------------`);
        console.log(`📋 Üretilen İçerikler Özeti:`);

        mod.items.forEach((item, idx) => {
            const num = idx + 1;
            const c = item.content;
            if (mod.type === 'FLASHCARD') {
                console.log(`  [#${num}] ÖN: "${c.front}"`);
                console.log(`        ARKA: "${c.back}"`);
            } else if (mod.type === 'MC') {
                console.log(`  [#${num}] SORU: "${c.question}"`);
                console.log(`        SEÇENEKLER: ${c.options.join(" | ")}`);
                console.log(`        DOĞRU CEVAP: "${c.correctAnswer}"`);
            } else if (mod.type === 'TRUE_FALSE') {
                console.log(`  [#${num}] ÖNERME: "${c.statement}"`);
                console.log(`        DOĞRU MU?: ${c.correctAnswer ? 'DOĞRU ✅' : 'YANLIŞ ❌'}`);
            } else if (mod.type === 'GAP') {
                console.log(`  [#${num}] METİN: "${c.text}"`);
                console.log(`        CEVAP: "${c.correctAnswer}"`);
            }
        });
        console.log(`======================================================\n`);

    } catch (error) {
        console.error(`\n❌ ÜRETİM SIRASINDA HATA OLUŞTU:`, error.message);
        process.exit(1);
    }
}

main();
