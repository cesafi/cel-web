import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/maps/stats/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'map-stats', handlerGET);
}
export const POST = GET;
