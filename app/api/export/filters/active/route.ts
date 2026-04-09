import { NextRequest, NextResponse } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';

/**
 * Production API: Get current active filter configuration
 * Uses 'standings' as the reference for global active state
 */
export async function GET(request: NextRequest) {
  try {
    const result = await ActiveApiExportService.getAll();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Active configs not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data.map(item => ({
        title: item.title,
        game_id: item.game_id,
        match_id: item.match_id,
        query_params: item.query_params || {}
      }))
    });
  } catch (error: any) {
    console.error('Error in active config API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
