
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- GLOBAL DATA CHECK START ---')

    try {
        const modulesCount = await prisma.module.count()
        const usersCount = await prisma.user.count()
        const libraryCount = await prisma.userModuleLibrary.count()
        const sessionsCount = await prisma.learningSession.count()
        const itemProgressCount = await prisma.itemProgress.count()
        const forksCount = await prisma.module.count({ where: { NOT: { sourceModuleId: null } } })

        console.log(`Summary Counts:`)
        console.log(`- Modules: ${modulesCount}`)
        console.log(`- Users: ${usersCount}`)
        console.log(`- Library Records (UserModuleLibrary): ${libraryCount}`)
        console.log(`- Learning Sessions: ${sessionsCount}`)
        console.log(`- Item Progress Records: ${itemProgressCount}`)
        console.log(`- Forked Modules: ${forksCount}`)

        if (libraryCount > 0) {
            const sampleLib = await prisma.userModuleLibrary.findMany({ take: 5 })
            console.log(`\nSample Library Records:`, JSON.stringify(sampleLib, null, 2))
        }

        if (sessionsCount > 0) {
            const sampleSession = await prisma.learningSession.findMany({ take: 5 })
            console.log(`\nSample Session Records:`, JSON.stringify(sampleSession, null, 2))
        }

    } catch (err) {
        console.error('Diagnostic failed:', err)
    }

    console.log('--- GLOBAL DATA CHECK END ---')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
