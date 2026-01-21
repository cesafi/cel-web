
import { getSupabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const matchId = parseInt(id);

  if (isNaN(matchId)) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
  }

  // 1. Fetch Match Details to determine Game Type via Esports
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      *,
      esports_seasons_stages (
        competition_stage,
        esports_categories (
          esports (
            name
          )
        )
      ),
      match_participants (
        *,
        schools_teams (
          name
        )
      ),
      games(
        id, 
        game_number, 
        map_name, 
        duration_seconds, 
        winner_id,
        game_hero_bans(team_id, hero_name, ban_order)
      )
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // 2. Determine Stats Table based on Game Type
  // Extract derived game type from nested relation
  // Safe navigation in case data is missing
  const sportName = match.esports_seasons_stages?.esports_categories?.esports?.name?.toLowerCase() || '';
  
  let gameType = 'mlbb'; // Default
  if (sportName.includes('valorant')) {
    gameType = 'valorant';
  }

  let csvContent = '';
  const filename = `match_${matchId}_stats.csv`;

  if (gameType === 'valorant') {
    csvContent = await generateValorantCSV(supabase, match);
  } else {
    csvContent = await generateMlbbCSV(supabase, match);
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

async function generateValorantCSV(supabase: any, match: any) {
  // Fetch stats
  const gameIds = match.games.map((g: any) => g.id);
  const { data: stats } = await supabase
    .from('stats_valorant_game_player')
    .select(`
      *,
      player:players(ign, first_name, last_name),
      team:schools_teams(name)
    `)
    .in('game_id', gameIds);

  // Header
  const header = [
    'Match ID', 'Season', 'Stage', 'Venue', 'Game Number', 'Map', 'Team', 'Player IGN', 'Agent', 
    'Kills', 'Deaths', 'Assists', 'ACS', 'ADR', 'HS%', 'First Bloods'
  ].join(',');

  const rows = (stats || []).map((stat: any) => {
    const game = match.games.find((g: any) => g.id === stat.game_id);
    return [
      match.id,
      match.season_id || '',
      match.esports_seasons_stages?.competition_stage || '',
      match.venue || '',
      game?.game_number || '',
      game?.map_name || '',
      stat.team?.name || '',
      stat.player?.ign || '',
      stat.agent_name || '',
      stat.kills,
      stat.deaths,
      stat.assists,
      stat.acs,
      stat.adr,
      stat.headshot_percent,
      stat.first_bloods
    ].map(escapeCsv).join(',');
  });

  return [header, ...rows].join('\n');
}

async function generateMlbbCSV(supabase: any, match: any) {
   // Fetch stats
   const gameIds = match.games.map((g: any) => g.id);
   const { data: stats } = await supabase
     .from('stats_mlbb_game_player')
     .select(`
       *,
       player:players(ign, first_name, last_name),
       team:schools_teams(name)
     `)
     .in('game_id', gameIds);
 
   // Header
   const header = [
     'Match ID', 'Season', 'Stage', 'Venue', 'Game Number', 'Team', 'Player IGN', 'Hero', 
     'Kills', 'Deaths', 'Assists', 'Gold', 'GPM', 'XP', 'XPM', 'Dmg Dealt', 'Dmg Taken', 'Turret Dmg',
     'Team Bans'
   ].join(',');
 
   const rows = (stats || []).map((stat: any) => {
     const game = match.games.find((g: any) => g.id === stat.game_id);
     
     // Find bans for this team in this game
     // Note: game_hero_bans uses team_id which refers to schools_teams.id
     const bans = game?.game_hero_bans
        ?.filter((b: any) => b.team_id === stat.team_id)
        ?.sort((a: any, b: any) => (a.ban_order || 0) - (b.ban_order || 0))
        ?.map((b: any) => b.hero_name)
        ?.join(';') || '';

     return [
       match.id,
       match.season_id || '',
       match.esports_seasons_stages?.competition_stage || '',
       match.venue || '',
       game?.game_number || '',
       stat.team?.name || '',
       stat.player?.ign || '',
       stat.hero_name || '',
       stat.kills,
       stat.deaths,
       stat.assists,
       stat.gold,
       stat.gpm,
       stat.xp,
       stat.xpm,
       stat.damage_dealt,
       stat.damage_taken,
       stat.turret_damage,
       bans
     ].map(escapeCsv).join(',');
   });
 
   return [header, ...rows].join('\n');
}

function escapeCsv(value: any) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
