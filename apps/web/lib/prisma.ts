import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
    return new PrismaClient({
        // Dev'de query/warn logları göster, prod'da sadece hataları logla
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// NOT: Production'da DATABASE_URL pgBouncer kullanıyorsa şu parametreyi ekleyin:
// DATABASE_URL="...?sslmode=require&pgbouncer=true"

// Dev'de Next.js hot reload sırasında yeni client oluşmasını önler
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
