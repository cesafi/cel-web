import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/league-operator/',
                    '/head-writer/',
                    '/writer/',
                    '/preview/',
                    '/login/',
                    '/lobby/',
                    '/api/',
                ],
            },
        ],
        sitemap: 'https://cesafiesportsleague.com/sitemap.xml',
    }
}
