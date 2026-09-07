import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://learnaxia.com'

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/about', '/contact', '/privacy', '/terms', '/login'],
                disallow: [
                    '/dashboard/',
                    '/api/',
                    '/admin/',
                    '/study/',
                    '/mobile-editor/',
                    '/auth/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
