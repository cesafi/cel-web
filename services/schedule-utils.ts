import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Calculates the "Week X Day Y" format for a given match based on its scheduled date
 * relative to the first match of the same season.
 * 
 * Logic:
 * 1. Find the earliest scheduled match in the same season (this is Week 1 Day 1).
 * 2. Calculate the difference in weeks and days from the first match's date.
 * 3. Count only the days that actually have matches scheduled (to avoid counting empty days).
 * 
 * @param matchId The ID of the match to check
 * @param seasonId The season ID the match belongs to
 * @param scheduledAt The scheduled date of the match (ISO string)
 * @returns Formatted string like "WEEK 3 DAY 5", or "None" if calculation fails
 */
export async function getMatchWeekAndDay(matchId: number, seasonId: number, scheduledAt: string | null): Promise<string> {
    if (!scheduledAt) return 'None';

    try {
        const supabase = await getSupabaseServer();

        // 1. Get all match dates for this season
        // We use inner joins to correctly filter matches by season_id through the stage
        const { data: matches, error } = await supabase
            .from('matches')
            .select('id, scheduled_at, esports_seasons_stages!inner(season_id)')
            .eq('esports_seasons_stages.season_id', seasonId)
            .not('scheduled_at', 'is', null)
            .order('scheduled_at', { ascending: true });

        if (error || !matches || matches.length === 0) {
            return 'None';
        }

        // Format all valid dates to Asia/Manila (PHT) timezone as YYYY-MM-DD
        const toPHDateString = (isoString: string) => {
            const d = new Date(isoString);
            return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // en-CA gives YYYY-MM-DD
        };

        const targetDateStr = toPHDateString(scheduledAt);
        const matchDates = new Set<string>();

        let firstDateStr = '';

        for (const m of matches) {
            if (m.scheduled_at) {
                const dateStr = toPHDateString(m.scheduled_at);
                matchDates.add(dateStr);
                if (!firstDateStr) {
                    firstDateStr = dateStr;
                }
            }
        }

        if (!matchDates.has(targetDateStr)) {
            // Failsafe in case the provided scheduleAt differs significantly from db for some reason
            matchDates.add(targetDateStr);
        }

        // 2. Sort the unique match dates chronologically
        const sortedUniqueDates = Array.from(matchDates).sort();

        // 3. Find the index of the target date (Day number = index + 1)
        const dayIndex = sortedUniqueDates.indexOf(targetDateStr);
        if (dayIndex === -1) return 'None';
        
        const dayNumber = dayIndex + 1;

        // 4. Calculate the Week number based on calendar days elapsed since the first match
        // We convert the YYYY-MM-DD back to a local midnight Date to calculate accurate Day differences
        const d1 = new Date(`${firstDateStr}T00:00:00+08:00`);
        const d2 = new Date(`${targetDateStr}T00:00:00+08:00`);
        
        const daysDiff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(daysDiff / 7) + 1;

        return `WEEK ${weekNumber} DAY ${dayNumber}`;

    } catch (e) {
        console.warn('Failed to calculate Match Week and Day:', e);
        return 'None';
    }
}
