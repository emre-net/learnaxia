import { PrismaClient, LogLevel } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

const prisma = new PrismaClient();
export const logContext = new AsyncLocalStorage<{ requestId: string; userId?: string }>();

export type LogContext = {
    service?: string;
    context?: string;
    metadata?: any;
    url?: string;
    stack?: string;
};

export class LoggingService {
    private static env = process.env.NODE_ENV || "development";

    private static sanitize(data: any): any {
        if (!data) return data;
        const sanitized = JSON.parse(JSON.stringify(data));
        const sensitiveKeys = ["password", "token", "secret", "creditcard", "authorization", "cookie"];

        const mask = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === "object") {
                    mask(obj[key]);
                } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                    obj[key] = "***MASKED***";
                }
            }
        };

        mask(sanitized);
        return sanitized;
    }

    private static async createLog(level: "INFO" | "WARN" | "ERROR" | "CRITICAL", message: string, options?: LogContext) {
        const context = logContext.getStore();
        const requestId = context?.requestId;
        const userId = context?.userId;

        try {
            const logEntry = await prisma.systemLog.create({
                data: {
                    level,
                    message,
                    requestId,
                    userId,
                    environment: this.env,
                    service: options?.service || "server",
                    source: "SERVER",
                    stack: options?.stack || (level === "ERROR" || level === "CRITICAL" ? new Error().stack : null),
                    url: options?.url,
                    metadata: options?.metadata ? this.sanitize(options.metadata) : null,
                },
            });

            if (this.env === "development") {
                console.log(`[${level}] [${requestId || 'NO-ID'}] ${message}`, options?.metadata || "");
            }

            return logEntry;
        } catch (error) {
            console.error("FATAL: LoggingService failed to write to DB", error);
        }
    }

    static async info(message: string, options?: LogContext) {
        return this.createLog("INFO", message, options);
    }

    static async warn(message: string, options?: LogContext) {
        return this.createLog("WARN", message, options);
    }

    static async error(message: string, options?: LogContext) {
        return this.createLog("ERROR", message, options);
    }

    static async critical(message: string, options?: LogContext) {
        return this.createLog("CRITICAL", message, options);
    }

    /**
     * Client tarafındaki logları kaydetmek için kullanılır.
     */
    static async logClient(data: {
        level: any;
        message: string;
        stack?: string;
        url?: string;
        userAgent?: string;
        ipAddress?: string;
        metadata?: any;
        userId?: string;
    }) {
        try {
            return await prisma.systemLog.create({
                data: {
                    ...data,
                    environment: this.env,
                    source: "CLIENT",
                    service: "client",
                    metadata: data.metadata ? this.sanitize(data.metadata) : null,
                }
            });
        } catch (error) {
            console.error("Failed to log client error", error);
        }
    }
}
