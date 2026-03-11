module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/apps/web/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const prismaClientSingleton = ()=>{
    return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
};
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
const __TURBOPACK__default__export__ = prisma;
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/web/lib/auth/mobile-jwt.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractBearerToken",
    ()=>extractBearerToken,
    "getMobileUser",
    ()=>getMobileUser,
    "verifyMobileAccessToken",
    ()=>verifyMobileAccessToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [app-route] (ecmascript)");
;
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback_secret_for_development');
async function getMobileUser(req) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}
function extractBearerToken(header) {
    if (!header || !header.startsWith('Bearer ')) return null;
    return header.split(' ')[1];
}
async function verifyMobileAccessToken(token) {
    const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, JWT_SECRET);
    return {
        userId: payload.id,
        email: payload.email,
        tokenVersion: payload.tokenVersion
    };
}
}),
"[project]/apps/web/app/api/mobile/analytics/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$auth$2f$mobile$2d$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/auth/mobile-jwt.ts [app-route] (ecmascript)");
;
;
;
async function GET(req) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$auth$2f$mobile$2d$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getMobileUser"])(req);
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        const userId = user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const totalDuration = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].itemSession.aggregate({
            _sum: {
                durationMs: true
            },
            where: {
                userId
            }
        });
        const globalProgress = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].itemProgress.aggregate({
            _sum: {
                correctCount: true,
                wrongCount: true
            },
            where: {
                userId
            }
        });
        const totalCorrect = globalProgress._sum.correctCount || 0;
        const totalWrong = globalProgress._sum.wrongCount || 0;
        const totalSolved = totalCorrect + totalWrong;
        const globalAccuracy = totalSolved > 0 ? Math.round(totalCorrect / totalSolved * 100) : 0;
        const lastMonthSessions = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].itemSession.findMany({
            where: {
                userId,
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                durationMs: true
            }
        });
        const activityMap = new Map();
        lastMonthSessions.forEach((s)=>{
            const date = s.createdAt.toISOString().split('T')[0];
            activityMap.set(date, (activityMap.get(date) || 0) + (s.durationMs || 0));
        });
        const dailyActivity = Array.from(activityMap.entries()).map(([date, durationMs])=>({
                date,
                duration: Math.round(durationMs / 60000)
            })).sort((a, b)=>a.date.localeCompare(b.date));
        const allLibraryEntries = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].userModuleLibrary.findMany({
            where: {
                userId
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        const activeModulesCount = allLibraryEntries.length;
        const recentModules = allLibraryEntries.sort((a, b)=>new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime()).slice(0, 5);
        const moduleIds = recentModules.map((m)=>m.moduleId);
        const recentProgress = moduleIds.length > 0 ? await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].itemProgress.findMany({
            where: {
                userId,
                item: {
                    moduleId: {
                        in: moduleIds
                    }
                }
            },
            select: {
                correctCount: true,
                wrongCount: true,
                item: {
                    select: {
                        moduleId: true
                    }
                }
            }
        }) : [];
        const moduleStatsMap = new Map();
        recentProgress.forEach((p)=>{
            const mid = p.item.moduleId;
            const existing = moduleStatsMap.get(mid) || {
                correct: 0,
                wrong: 0
            };
            existing.correct += p.correctCount;
            existing.wrong += p.wrongCount;
            moduleStatsMap.set(mid, existing);
        });
        const moduleStats = recentModules.map((entry)=>{
            const stats = moduleStatsMap.get(entry.moduleId) || {
                correct: 0,
                wrong: 0
            };
            const total = stats.correct + stats.wrong;
            const accuracy = total > 0 ? Math.round(stats.correct / total * 100) : 0;
            return {
                title: entry.module.title,
                accuracy,
                totalInteractions: total
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            stats: {
                totalStudyMinutes: Math.round((totalDuration._sum.durationMs || 0) / 60000),
                modulesStarted: activeModulesCount,
                totalSolved
            },
            dailyActivity,
            moduleStats
        });
    } catch (error) {
        console.error("Mobile Analytics Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal Server Error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a527fecd._.js.map