/**
 * Unified broadcast export cache versioning.
 *
 * Each export domain (draft, game-results, map-veto, h2h) maintains its own
 * independent version counter on `globalThis`. The version only increments
 * when a server action actually mutates the underlying data, so vMix can
 * poll at 1ms and the API will serve from memory with zero DB cost until
 * something genuinely changes.
 *
 * Usage:
 *   import { getExportCacheVersion, bumpExportCache } from '@/lib/utils/export-cache';
 *
 *   // In export route — serve cached if version matches
 *   if (cache.version === getExportCacheVersion('draft')) { ... }
 *
 *   // In server action — bump after successful write
 *   if (res.success) bumpExportCache('draft');
 */

export type ExportCacheDomain =
    | 'draft'
    | 'game-results'
    | 'map-veto'
    | 'h2h';

const CACHE_KEY = '__exportCacheVersions' as const;

const globalForCache = globalThis as unknown as {
    [CACHE_KEY]: Record<ExportCacheDomain, number>;
};

if (!globalForCache[CACHE_KEY]) {
    globalForCache[CACHE_KEY] = {
        'draft': 0,
        'game-results': 0,
        'map-veto': 0,
        'h2h': 0,
    };
}

export function getExportCacheVersion(domain: ExportCacheDomain): number {
    return globalForCache[CACHE_KEY][domain];
}

export function bumpExportCache(domain: ExportCacheDomain): void {
    globalForCache[CACHE_KEY][domain] += 1;
}
