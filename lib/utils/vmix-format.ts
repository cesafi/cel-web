import { NextResponse } from 'next/server';

/**
 * vMix-compatible format utilities.
 *
 * vMix JSON data sources only support flat object arrays — each element in the
 * array is treated as a row and nested objects/arrays are ignored.  These helpers
 * let API routes return flat JSON, XML or CSV by adding `?format=json-flat|xml|csv`
 * to any production/game endpoint.
 */

// ---------------------------------------------------------------------------
// 1. Flatten
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested object into a single-level object with
 * underscore-separated keys.
 *
 * Example:
 *   { team: { school: { abbreviation: "USJ-R" } } }
 *   → { team_school_abbreviation: "USJ-R" }
 *
 * Arrays of primitives are joined with commas.
 * Arrays of objects are expanded with numeric indices.
 */
export function flattenObject(
    obj: Record<string, any>,
    prefix = '',
    result: Record<string, any> = {}
): Record<string, any> {
    for (const [key, value] of Object.entries(obj)) {
        const flatKey = prefix ? `${prefix}_${key}` : key;

        if (value === null || value === undefined) {
            result[flatKey] = value ?? null;
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                result[flatKey] = '';
            } else if (typeof value[0] === 'object' && value[0] !== null) {
                // Array of objects → expand with index
                value.forEach((item, idx) => {
                    flattenObject(item, `${flatKey}_${idx}`, result);
                });
            } else {
                // Array of primitives → join
                result[flatKey] = value.join(', ');
            }
        } else if (typeof value === 'object') {
            flattenObject(value, flatKey, result);
        } else {
            result[flatKey] = value;
        }
    }
    return result;
}

/**
 * Flatten an array of objects — each element is individually flattened.
 */
export function flattenArray(arr: any[]): Record<string, any>[] {
    return arr.map((item) =>
        typeof item === 'object' && item !== null ? flattenObject(item) : { value: item }
    );
}

// ---------------------------------------------------------------------------
// 2. XML
// ---------------------------------------------------------------------------

function escapeXml(value: any): string {
    const str = String(value ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function objectToXml(obj: Record<string, any>, indent = '  '): string {
    let xml = '';
    for (const [key, value] of Object.entries(obj)) {
        // Sanitise key for XML tag name (replace invalid chars)
        const tag = key.replace(/[^a-zA-Z0-9_]/g, '_');

        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (typeof item === 'object' && item !== null) {
                    xml += `${indent}<${tag}>\n${objectToXml(item, indent + '  ')}${indent}</${tag}>\n`;
                } else {
                    xml += `${indent}<${tag}>${escapeXml(item)}</${tag}>\n`;
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            xml += `${indent}<${tag}>\n${objectToXml(value, indent + '  ')}${indent}</${tag}>\n`;
        } else {
            xml += `${indent}<${tag}>${escapeXml(value)}</${tag}>\n`;
        }
    }
    return xml;
}

/**
 * Convert data to an XML string.
 *
 * If `data` is an array each element is wrapped in `<item>`.
 */
export function toXml(data: any, rootName = 'data'): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

    if (Array.isArray(data)) {
        data.forEach((item) => {
            if (typeof item === 'object' && item !== null) {
                xml += `  <item>\n${objectToXml(item, '    ')}  </item>\n`;
            } else {
                xml += `  <item>${escapeXml(item)}</item>\n`;
            }
        });
    } else if (typeof data === 'object' && data !== null) {
        xml += objectToXml(data);
    } else {
        xml += `  ${escapeXml(data)}\n`;
    }

    xml += `</${rootName}>`;
    return xml;
}

// ---------------------------------------------------------------------------
// 3. CSV
// ---------------------------------------------------------------------------

function escapeCsvField(value: any): string {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Convert an array of flat objects to a CSV string with a header row.
 */
export function toCsv(data: any[]): string {
    if (!data.length) return '';

    // Collect all unique keys across all rows
    const keys = Array.from(new Set(data.flatMap((row) => Object.keys(row))));

    const header = keys.map(escapeCsvField).join(',');
    const rows = data.map((row) =>
        keys.map((key) => escapeCsvField(row[key])).join(',')
    );

    return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// 4. Format Response  (main entry point for routes)
// ---------------------------------------------------------------------------

export type VmixFormat = 'json' | 'json-flat' | 'xml' | 'csv';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, max-age=0',
};

/**
 * Return a NextResponse formatted according to the requested `format`.
 *
 * @param data - The raw data to format (object or array).
 * @param format - One of `json`, `json-flat`, `xml`, `csv`.
 *                 Defaults to `json` (unchanged, backward-compatible).
 * @param rootName - XML root element name (default: `data`).
 */
export function formatResponse(
    data: any,
    format: VmixFormat = 'json',
    rootName = 'data'
): NextResponse {
    switch (format) {
        case 'json-flat': {
            const flat = Array.isArray(data)
                ? flattenArray(data)
                : flattenObject(data);
            return NextResponse.json(flat, { headers: CORS_HEADERS });
        }

        case 'xml': {
            const xml = toXml(data, rootName);
            return new NextResponse(xml, {
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/xml; charset=utf-8',
                },
            });
        }

        case 'csv': {
            const rows = Array.isArray(data) ? flattenArray(data) : [flattenObject(data)];
            const csv = toCsv(rows);
            return new NextResponse(csv, {
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'text/csv; charset=utf-8',
                },
            });
        }

        default:
            // json — return as-is (backward compatible)
            return NextResponse.json(data, { headers: CORS_HEADERS });
    }
}

/**
 * Extract the `format` query parameter from a request URL.
 */
export function getFormatParam(request: Request): VmixFormat {
    const url = new URL(request.url);
    const f = url.searchParams.get('format');
    if (f === 'json-flat' || f === 'xml' || f === 'csv') return f;
    return 'json';
}
