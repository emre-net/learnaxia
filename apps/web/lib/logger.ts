type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

interface LogOptions {
    metadata?: any;
    context?: string;
}

const logQueue: any[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

const flushLogs = async () => {
    if (logQueue.length === 0) return;
    const batch = [...logQueue];
    logQueue.length = 0;
    if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
    }

    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000);

        await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify(batch),
        });
    } catch (err) {
        // Silent fail for logging errors
    }
};

export const logger = {
    async log(level: LogLevel, message: string, options?: LogOptions) {
        if (process.env.NODE_ENV === 'development') {
            const colors = {
                INFO: 'color: #3b82f6',
                WARN: 'color: #f59e0b',
                ERROR: 'color: #ef4444',
                CRITICAL: 'color: #7f1d1d; font-weight: bold'
            };
            console.log(`%c[${level}] ${message}`, colors[level], options?.metadata || '');
        }

        logQueue.push({
            level,
            message,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            metadata: {
                ...options?.metadata,
                context: options?.context,
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            },
            stack: (level === 'ERROR' || level === 'CRITICAL') ? new Error().stack : undefined
        });

        if (level === 'ERROR' || level === 'CRITICAL' || logQueue.length >= 10) {
            flushLogs();
        } else if (!flushTimeout) {
            flushTimeout = setTimeout(flushLogs, 10000); // Flush after 10s of inactivity
        }
    },

    info(message: string, options?: LogOptions) {
        return this.log('INFO', message, options);
    },

    warn(message: string, options?: LogOptions) {
        return this.log('WARN', message, options);
    },

    error(message: string, options?: LogOptions) {
        return this.log('ERROR', message, options);
    },

    critical(message: string, options?: LogOptions) {
        return this.log('CRITICAL', message, options);
    }
};
