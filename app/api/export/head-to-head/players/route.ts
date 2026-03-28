import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/head-to-head/players/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'h2h-players', handlerGET);
}
export const POST = GET;
