import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';
import { MobileRefreshService } from '@/lib/auth/mobile-refresh';

export const dynamic = 'force-dynamic';

const JWT_EXPIRY_DAYS = 1;

function getJwtSecret(): Uint8Array {
    const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('MOBILE_JWT_SECRET is missing in production environment');
    }
    return new TextEncoder().encode(secret || 'development_fallback_secret');
}

function sanitizeRedirectUri(rawUri: string | null): string {
    const defaultUri = 'learnaxia://auth/callback';
    if (!rawUri) return defaultUri;

    // Allowed schemes for deep linking to LearnAxia mobile
    const allowedPrefixes = ['learnaxia://', 'exp://'];
    const isAllowed = allowedPrefixes.some(prefix => rawUri.startsWith(prefix));

    return isAllowed ? rawUri : defaultUri;
}

function renderRedirectHtml(targetUrl: string, isError: boolean = false, errorMessage: string = '') {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LearnAxia - ${isError ? 'Giriş Başarısız' : 'Giriş Başarılı'}</title>
    ${!isError ? `<meta http-equiv="refresh" content="0;url=${targetUrl}" />` : ''}
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
        }
        .card {
            background-color: #121215;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 36px 28px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }
        .icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: ${isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)'};
            color: ${isError ? '#ef4444' : '#818cf8'};
            border: 1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'};
        }
        h1 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }
        p {
            font-size: 14px;
            color: #a1a1aa;
            line-height: 1.5;
            margin-bottom: 28px;
        }
        .btn {
            display: block;
            width: 100%;
            background-color: ${isError ? '#27272a' : '#6366f1'};
            color: #ffffff;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            padding: 15px 20px;
            border-radius: 14px;
            transition: all 0.2s ease;
        }
        .btn:hover {
            opacity: 0.95;
            transform: scale(0.99);
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">${isError ? '✕' : '✓'}</div>
        <h1>${isError ? 'Giriş Başarısız' : 'Giriş Başarılı!'}</h1>
        <p>${isError ? errorMessage : 'LearnAxia uygulamasına yönlendiriliyorsunuz. Uygulama otomatik açılmazsa aşağıdaki butona dokunun.'}</p>
        <a href="${targetUrl}" class="btn">${isError ? 'Uygulamaya Geri Dön' : 'Uygulamayı Aç'}</a>
    </div>
    <script>
        (function() {
            var url = ${JSON.stringify(targetUrl)};
            try {
                window.location.replace(url);
            } catch(e) {
                window.location.href = url;
            }
        })();
    </script>
</body>
</html>`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const targetRedirect = sanitizeRedirectUri(searchParams.get('redirect_uri'));

        const session = await auth();

        if (!session?.user?.id || !session.user.email) {
            const errorUrl = `${targetRedirect}${targetRedirect.includes('?') ? '&' : '?'}error=unauthorized`;
            return new Response(renderRedirectHtml(errorUrl, true, 'Google oturumu doğrulanamadı. Lütfen tekrar deneyin.'), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                sessionVersion: true,
                deletedAt: true,
                emailVerified: true,
            },
        });

        if (!user || user.deletedAt) {
            const errorUrl = `${targetRedirect}${targetRedirect.includes('?') ? '&' : '?'}error=user_not_found`;
            return new Response(renderRedirectHtml(errorUrl, true, 'Kullanıcı hesabı bulunamadı veya silinmiş.'), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        // Google ile giriş yapan kullanıcıların e-postasını doğrulanmış olarak işaretle
        if (!user.emailVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            });
        }

        // Mobil Access Token (HS256 JWT)
        const accessToken = await new SignJWT({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tokenVersion: user.sessionVersion ?? 1,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
            .sign(getJwtSecret());

        // Mobil Refresh Token
        const refreshToken = await MobileRefreshService.generate(user.id);

        // Başarılı deep-link URL'si
        const separator = targetRedirect.includes('?') ? '&' : '?';
        const deepLinkUrl = `${targetRedirect}${separator}accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;

        return new Response(renderRedirectHtml(deepLinkUrl, false), {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error: any) {
        console.error('[Mobile Google Auth Callback Error]:', error);
        const fallbackUrl = 'learnaxia://auth/callback?error=internal_error';
        return new Response(renderRedirectHtml(fallbackUrl, true, 'Sunucu hatası oluştu. Lütfen tekrar deneyin.'), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}
