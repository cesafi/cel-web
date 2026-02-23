import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

/**
 * Image proxy for external game character icons.
 * Fandom/Wikia CDN blocks browser requests via hotlink protection (Referer check).
 * This route fetches images server-side and forwards them to the client with caching.
 * 
 * Usage: /api/image-proxy?url=https://static.wikia.nocookie.net/...
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Only allow known image hosts
    const allowedHosts = [
        'static.wikia.nocookie.net',
        'vignette.wikia.nocookie.net',
    ];

    try {
        const parsed = new URL(url);
        if (!allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
            return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        // Use unstable_cache to persistently cache the fetched image on the server
        const getCachedImage = unstable_cache(
            async (imageUrl: string) => {
                const response = await fetch(imageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; CEL-Web/1.0)',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Upstream returned ${response.status}`);
                }

                const contentType = response.headers.get('content-type') || 'image/png';
                const arrayBuffer = await response.arrayBuffer();

                // Convert ArrayBuffer to base64 so it can be serialized by Next.js cache
                const buffer = Buffer.from(arrayBuffer);
                const base64Data = buffer.toString('base64');

                return {
                    contentType,
                    base64Data,
                };
            },
            [`image-proxy-${url}`], // Cache key based on URL
            {
                revalidate: 604800, // Cache for 7 days
                tags: ['image-proxy'],
            }
        );

        const cached = await getCachedImage(url);

        // Reconstruct Buffer from cached base64 string
        const imageBuffer = Buffer.from(cached.base64Data, 'base64');

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': cached.contentType,
                'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }
}
