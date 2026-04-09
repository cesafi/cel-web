'use server';

import CloudinaryService from '@/services/cloudinary';
import { GameService } from '@/services/games';
import { ServiceResponse } from '@/lib/types/base';
import { Game } from '@/lib/types/games';
import { revalidatePath } from 'next/cache';

/**
 * Uploads statistics screenshots to Cloudinary and persists the URLs to the game record.
 */
export async function uploadGameScreenshots(
  gameId: number,
  files: {
    mlbbEquipment?: File;
    mlbbData?: File;
    valorantScreenshot?: File;
  }
): Promise<ServiceResponse<Partial<Game>>> {
  try {
    const updates: any = { id: gameId };
    const folder = `matches/games/${gameId}/stats`;

    if (files.mlbbEquipment) {
      const res = await CloudinaryService.uploadImage(files.mlbbEquipment, { folder });
      if (res.success && res.data) {
        updates.mlbb_equipment_image_url = res.data.secure_url;
      }
    }

    if (files.mlbbData) {
      const res = await CloudinaryService.uploadImage(files.mlbbData, { folder });
      if (res.success && res.data) {
        updates.mlbb_data_image_url = res.data.secure_url;
      }
    }

    if (files.valorantScreenshot) {
      const res = await CloudinaryService.uploadImage(files.valorantScreenshot, { folder });
      if (res.success && res.data) {
        updates.valorant_screenshot_url = res.data.secure_url;
      }
    }

    const result = await GameService.updateById(updates);
    
    if (result.success) {
      revalidatePath(`/admin/matches/[matchId]/games/${gameId}`, 'page');
    }

    return result;
  } catch (error) {
    console.error('Failed to upload game screenshots:', error);
    return { success: false, error: 'Failed to persist screenshots' };
  }
}

/**
 * Saves a draft of extracted statistics to the game record.
 */
export async function saveExtractedStatsDraft(
  gameId: number,
  draft: any
): Promise<ServiceResponse<Game>> {
  try {
    const result = await GameService.updateById({
      id: gameId,
      extracted_stats_draft: draft
    } as any);
    
    if (result.success) {
      revalidatePath(`/admin/matches/[matchId]/games/${gameId}`, 'page');
    }

    return result;
  } catch (error) {
    console.error('Failed to save extracted stats draft:', error);
    return { success: false, error: 'Failed to save draft' };
  }
}

/**
 * Clears the extraction draft once final stats are saved.
 */
export async function clearExtractedStatsDraft(gameId: number): Promise<ServiceResponse<Game>> {
  return await GameService.updateById({
    id: gameId,
    extracted_stats_draft: null
  } as any);
}
