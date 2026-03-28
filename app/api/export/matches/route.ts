import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/matches/[matchId]/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'match-overview', handlerGET);
}
export const POST = GET;
