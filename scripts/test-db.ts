import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing DB Access...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL)

    try {
        const userCount = await prisma.user.count()
        console.log('Connection Successful! User count:', userCount)
    } catch (e) {
        console.error('DB Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
