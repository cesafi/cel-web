import type { MetadataRoute } from 'next'
import { getSupabaseServer } from '@/lib/supabase/server'

const BASE_URL = 'https://cesafiesportsleague.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await getSupabaseServer()

    // Static public pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/schedule`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/standings`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/statistics`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/news`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/schools`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/about-us`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/sponsors`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/volunteers`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.2,
        },
        {
            url: `${BASE_URL}/terms-of-service`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.2,
        },
    ]

    // Dynamic: published news/articles
    const { data: articles } = await supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })

    const articlePages: MetadataRoute.Sitemap = (articles || []).map((article: { slug: string; updated_at: string | null }) => ({
        url: `${BASE_URL}/news/${article.slug}`,
        lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // Dynamic: schools (route uses abbreviation as the URL param)
    const { data: schools } = await supabase
        .from('schools')
        .select('abbreviation, updated_at')
        .order('name', { ascending: true })

    const schoolPages: MetadataRoute.Sitemap = (schools || []).map((school: { abbreviation: string; updated_at: string | null }) => ({
        url: `${BASE_URL}/schools/${school.abbreviation}`,
        lastModified: school.updated_at ? new Date(school.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    return [...staticPages, ...articlePages, ...schoolPages]
}
