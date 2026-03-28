import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/head-to-head/teams/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'h2h-teams', handlerGET);
}
export const POST = GET;
