
const { PrismaClient } = require('@prisma/client')
const fs = require('fs');
const path = require('path');

// Manual .env loading
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value;
        }
    });
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

async function main() {
    console.log('--- STATS DIAGNOSTIC START ---')

    // 1. Bir örnek modül ve sahibine bakalım
    const sampleModule = await prisma.module.findFirst({
        include: {
            owner: { select: { id: true, handle: true } },
            userLibrary: { select: { userId: true, role: true } },
            _count: { select: { userLibrary: { where: { role: 'SAVED' } } } }
        }
    })

    if (sampleModule) {
        console.log(`Module: "${sampleModule.title}" (Owner: @${sampleModule.owner.handle})`)
        console.log(`Total Save Count (from _count): ${sampleModule._count.userLibrary}`)
        console.log(`Library Records:`, JSON.stringify(sampleModule.userLibrary, null, 2))

        const ownerInLibrary = sampleModule.userLibrary.find(l => l.userId === sampleModule.ownerId)
        if (ownerInLibrary) {
            console.log(`Owner IS in their own module's library with role: ${ownerInLibrary.role}`)
        } else {
            console.log(`Owner is NOT in their own module's library.`)
        }
    }

    // 2. Çalışma (session) istatistiklerine bakalım
    const sessionStats = await prisma.learningSession.groupBy({
        by: ['moduleId'],
        _count: { id: true }
    })
    console.log(`\nSession Stats (Top 5):`, JSON.stringify(sessionStats.slice(0, 5), null, 2))

    console.log('--- STATS DIAGNOSTIC END ---')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
