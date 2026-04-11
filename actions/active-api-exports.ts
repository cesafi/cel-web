'use server';

import { ActiveApiExportService } from '@/services/active-api-exports';
import { ServiceResponse } from '@/lib/types/base';
import { bumpExportCache } from '@/lib/utils/export-cache';

export async function getActiveApiExports(): Promise<ServiceResponse<any[]>> {
    return await ActiveApiExportService.getAll();
}

export async function setActiveApiExport(title: 'draft' | 'game-results', gameId: number): Promise<ServiceResponse<any>> {
    const res = await ActiveApiExportService.setActiveGameId(title, gameId);
    if (res.success) bumpExportCache(title);
    return res;
}

export async function setActiveApiExportMatch(title: 'valorant-map-veto', matchId: number): Promise<ServiceResponse<any>> {
    const res = await ActiveApiExportService.setActiveMatchId(title, matchId);
    if (res.success) bumpExportCache('map-veto');
    return res;
}
