import { NextRequest } from 'next/server';
import { proxyExport } from '@/lib/utils/export-proxy';
import { GET as handlerGET } from '@/app/api/games/standings/route';

export async function GET(request: NextRequest) {
    return proxyExport(request, 'standings', handlerGET);
}
export const POST = GET;
