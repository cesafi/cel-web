'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ── Global batch queue to stagger image loads ──
// Limits concurrent image fetches to avoid rate limiting from image hosts

const BATCH_SIZE = 8;
const BATCH_DELAY_MS = 150;

type QueueItem = {
    src: string;
    resolve: (loaded: boolean) => void;
};

let queue: QueueItem[] = [];
let activeCount = 0;
let isProcessing = false;

function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    const process = () => {
        while (activeCount < BATCH_SIZE && queue.length > 0) {
            const item = queue.shift()!;
            activeCount++;

            const img = new Image();
            img.onload = () => {
                activeCount--;
                item.resolve(true);
                setTimeout(process, BATCH_DELAY_MS);
            };
            img.onerror = () => {
                activeCount--;
                item.resolve(false);
                setTimeout(process, BATCH_DELAY_MS);
            };
            img.src = item.src;
        }

        if (queue.length === 0 && activeCount === 0) {
            isProcessing = false;
        }
    };

    process();
}

// Rewrite external URLs that need proxying (Fandom CDN blocks browser requests)
const PROXY_HOSTS = ['static.wikia.nocookie.net', 'vignette.wikia.nocookie.net'];

function getProxiedUrl(src: string): string {
    try {
        const url = new URL(src);
        if (PROXY_HOSTS.some(host => url.hostname === host)) {
            return `/api/image-proxy?url=${encodeURIComponent(src)}`;
        }
    } catch {
        // Not a valid URL, return as-is
    }
    return src;
}

function enqueueImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        queue.push({ src, resolve });
        processQueue();
    });
}

// ── LazyImage Component ──
// Uses IntersectionObserver to detect visibility,
// then enqueues the image load through the batch queue.

interface LazyImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
}

export function LazyImage({ src, alt, className, fallback }: LazyImageProps) {
    const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
    const containerRef = useRef<HTMLDivElement>(null);
    const hasTriggered = useRef(false);

    const proxiedSrc = src ? getProxiedUrl(src) : null;

    const startLoad = useCallback(() => {
        if (hasTriggered.current || !proxiedSrc) return;
        hasTriggered.current = true;
        setState('loading');

        enqueueImage(proxiedSrc).then((loaded) => {
            setState(loaded ? 'loaded' : 'error');
        });
    }, [proxiedSrc]);

    useEffect(() => {
        if (!src) {
            setState('error');
            return;
        }

        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    startLoad();
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Start loading 200px before visible
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [src, startLoad]);

    return (
        <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
            {state === 'loaded' && proxiedSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={proxiedSrc}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
            ) : state === 'error' || !src ? (
                fallback || (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-xs font-bold text-muted-foreground">
                        {alt.substring(0, 2)}
                    </div>
                )
            ) : (
                // Loading / idle state — show shimmer
                <div className="w-full h-full bg-muted animate-pulse" />
            )}
        </div>
    );
}
