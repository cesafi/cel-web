import { NextRequest, NextResponse } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';

/**
 * Production API: Get current active filter configuration
 * Uses 'standings' as the reference for global active state
 */
export async function GET(request: NextRequest) {
  try {
    const result = await ActiveApiExportService.getByTitle('standings');

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Active config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        game_id: result.data.game_id,
        match_id: result.data.match_id,
        query_params: result.data.query_params || {}
      }
    });
  } catch (error: any) {
    console.error('Error in active config API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
