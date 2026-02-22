
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- SYNC START ---')

    // 1. Learnaxia Ekibi modüllerini PUBLIC ve ACTIVE yap
    const modulesResult = await prisma.module.updateMany({
        where: {
            owner: { handle: 'learnaxia' }
        },
        data: {
            visibility: 'PUBLIC',
            status: 'ACTIVE'
        }
    })
    console.log(`Updated Learnaxia Modules: ${modulesResult.count}`)

    // 2. Learnaxia Ekibi koleksiyonlarını PUBLIC yap
    const collectionsResult = await prisma.collection.updateMany({
        where: {
            owner: { handle: 'learnaxia' }
        },
        data: {
            visibility: 'PUBLIC'
        }
    })
    console.log(`Updated Learnaxia Collections: ${collectionsResult.count}`)

    // 3. Mevcut durumu doğrula
    const visibleCount = await prisma.module.count({
        where: {
            visibility: 'PUBLIC',
            status: 'ACTIVE',
            isForkable: true
        }
    })
    console.log(`\nNew count of modules visible in Discover: ${visibleCount}`)

    console.log('--- SYNC END ---')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
