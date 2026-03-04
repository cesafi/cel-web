/**
 * Shared CSV grid helpers for production export routes.
 * Consistent 15-column (A–O) grid layout.
 */

export const COLS = 15;
const N = 'None';

/** Escape a CSV field */
export const esc = (v: any): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

/** Build a CSV row from values, padded/trimmed to `cols` */
export const row = (vals: (string | number | null | undefined)[], cols = COLS): string => {
    const padded = [...vals];
    while (padded.length < cols) padded.push('');
    return padded.slice(0, cols).map(esc).join(',') + '\r\n';
};

/** Empty row */
export const emptyRow = (cols = COLS): string => row(Array(cols).fill(''), cols);

/** Format a number to N decimal places */
export const fmt = (n: number | undefined | null, decimals = 1): string => {
    if (n === null || n === undefined || isNaN(n)) return N;
    return Number(n).toFixed(decimals);
};

/** Format a percentage */
export const pct = (n: number | undefined | null, decimals = 1): string => {
    if (n === null || n === undefined || isNaN(n)) return N;
    return Number(n).toFixed(decimals) + '%';
};

/** Produce a filled row of N for a missing data slot */
export const fillerRow = (count: number, cols = COLS): string =>
    row(Array(count).fill(N).concat(Array(Math.max(0, cols - count)).fill('')), cols);

/** Standard CSV response headers */
export const csvHeaders = (filename: string) => ({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}.csv"`,
    'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5',
    'Access-Control-Allow-Origin': '*',
});

/** Parse common filter query params */
export function parseFilters(searchParams: URLSearchParams) {
    return {
        game: (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant',
        seasonId: searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined,
        stageId: searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined,
        categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
    };
}
