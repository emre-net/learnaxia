type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

interface LogOptions {
    metadata?: any;
    context?: string;
}

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

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    level,
                    message,
                    url: typeof window !== 'undefined' ? window.location.href : undefined,
                    metadata: {
                        ...options?.metadata,
                        context: options?.context,
                        timestamp: new Date().toISOString(),
                        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                    }
                }),
            });
            clearTimeout(timeoutId);
        } catch (err) {
            // Sessizce geç; ağ hataları veya zaman aşımı durumunda uygulama akışını bozma
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
