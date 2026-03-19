"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export function GlobalErrorListener() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            logger.error(`Global Error: ${event.message}`, {
                metadata: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error?.toString(),
                    stack: event.error?.stack
                },
                context: "window.onerror"
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            logger.error(`Unhandled Promise Rejection: ${event.reason?.message || 'Unknown reason'}`, {
                metadata: {
                    reason: event.reason?.toString(),
                    stack: event.reason?.stack
                },
                context: "unhandledrejection"
            });
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, []);

    return null;
}
