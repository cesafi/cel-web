'use server';

import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';

/**
 * Extracts MLBB stats from an uploaded image.
 * 
 * Mock implementation returning data from the user's "Victory 16-3" screenshot.
 */
export async function extractMlbbStatsFromImage(formData: FormData): Promise<{ success: boolean; data?: MlbbScreenshotData; error?: string }> {
  try {
    const file = formData.get('image') as File;
    if (!file) {
      return { success: false, error: 'No image provided' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock data for MLBB (Victory 16-3)
    return {
      success: true,
      data: MOCK_MLBB_DATA
    };

  } catch (error) {
    console.error('OCR Extraction Failed:', error);
    return { success: false, error: 'Failed to process image' };
  }
}

const MOCK_MLBB_DATA: MlbbScreenshotData = {
  matchResult: 'VICTORY',
  score: {
    blue: 16,
    red: 3
  },
  players: [
    // Blue Team (Left) - USJR
    {
      playerName: 'USJR KAZUKI',
      heroName: 'Odette',
      team: 'Blue',
      kda: { kills: 0, deaths: 0, assists: 11 },
      gold: 6272,
      rating: 8.8,
      badge: 'Gold'
    },
    {
      playerName: 'USJR Stevesanity',
      heroName: 'Harith',
      team: 'Blue',
      kda: { kills: 6, deaths: 0, assists: 2 },
      gold: 9087,
      rating: 9.3,
      badge: 'Gold'
    },
    {
      playerName: 'USJR Wanji.',
      heroName: 'Karrie',
      team: 'Blue',
      kda: { kills: 6, deaths: 2, assists: 4 },
      gold: 9379,
      rating: 9.3,
      badge: 'Gold'
    },
    {
      playerName: 'USJR DANJIRO',
      heroName: 'Lylia',
      team: 'Blue',
      kda: { kills: 0, deaths: 1, assists: 12 },
      gold: 7474,
      rating: 8.7,
      badge: 'Gold'
    },
    {
      playerName: 'USJR CELIBOURGE1',
      heroName: 'Fanny',
      team: 'Blue',
      kda: { kills: 4, deaths: 0, assists: 6 },
      gold: 7660,
      rating: 9.5,
      badge: 'MVP'
    },
    // Red Team (Right) - USC
    {
      playerName: 'LUKETZYY USC',
      heroName: 'Lapu-Lapu',
      team: 'Red',
      kda: { kills: 2, deaths: 3, assists: 1 },
      gold: 6148,
      rating: 5.8,
      badge: null // Silver usually for loser MVP but icon is different
    },
    {
      playerName: 'Bravo. USC',
      heroName: 'Eudora',
      team: 'Red',
      kda: { kills: 0, deaths: 3, assists: 2 },
      gold: 5301,
      rating: 4.9,
      badge: null
    },
    {
      playerName: 'SHIN TORU USC',
      heroName: 'Valir',
      team: 'Red',
      kda: { kills: 1, deaths: 4, assists: 0 },
      gold: 6906,
      rating: 4.0,
      badge: 'Bronze'
    },
    {
      playerName: 'Yingg USC',
      heroName: 'Angela',
      team: 'Red',
      kda: { kills: 0, deaths: 2, assists: 2 },
      gold: 4515,
      rating: 4.6,
      badge: null
    },
    {
      playerName: 'BAI LUCI USC',
      heroName: 'Tigreal',
      team: 'Red',
      kda: { kills: 0, deaths: 4, assists: 1 },
      gold: 5711,
      rating: 4.1,
      badge: null
    }
  ]
};
