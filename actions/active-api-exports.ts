'use server';

import { ActiveApiExportService } from '@/services/active-api-exports';
import { ServiceResponse } from '@/lib/types/base';

export async function getActiveApiExports(): Promise<ServiceResponse<any[]>> {
    return await ActiveApiExportService.getAll();
}

export async function setActiveApiExport(title: 'draft' | 'game-results', gameId: number): Promise<ServiceResponse<any>> {
    return await ActiveApiExportService.setActiveGameId(title, gameId);
}

export async function setActiveApiExportMatch(title: 'valorant-map-veto', matchId: number): Promise<ServiceResponse<any>> {
    return await ActiveApiExportService.setActiveMatchId(title, matchId);
}
