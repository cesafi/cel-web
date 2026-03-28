import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/players/stats/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'player-stats', handlerGET);
}
export const POST = GET;
