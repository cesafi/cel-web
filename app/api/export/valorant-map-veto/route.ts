import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/valorant-map-veto/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'valorant-map-veto', handlerGET);
}
export const POST = GET;
