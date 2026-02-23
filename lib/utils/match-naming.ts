export interface MatchParticipant {
  id: string;
  name: string;
  schools: {
    name: string;
    abbreviation: string;
  };
}

/**
 * Generates a match name using school abbreviations
 * Format: "USJ-R vs UCMN"
 */
export function generateMatchName(participants: MatchParticipant[]): string {
  if (participants.length === 0) {
    return 'TBD vs TBD';
  }

  if (participants.length === 1) {
    return `${participants[0].schools.abbreviation} vs TBD`;
  }

  if (participants.length === 2) {
    const [team1, team2] = participants;
    return `${team1.schools.abbreviation} vs ${team2.schools.abbreviation}`;
  }

  // For more than 2 teams (multi-team matches)
  const abbrevs = participants.map((p) => p.schools.abbreviation);
  return abbrevs.join(' vs ');
}

/**
 * Generates a match description with score placeholders and stage info
 * Format: "USJ-R (0) vs (0) UCMN - VALO Groupstage"
 */
export function generateMatchDescription(
  participants: MatchParticipant[],
  competitionStage: string,
  sportName: string,
  _division: string,
  _level: string
): string {
  const stageFormatted = competitionStage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Shorten common sport names for the description
  const sportShort = shortenSportName(sportName);

  if (participants.length === 0) {
    return `TBD (0) vs (0) TBD - ${sportShort} ${stageFormatted}`;
  }

  if (participants.length === 1) {
    return `${participants[0].schools.abbreviation} (0) vs (0) TBD - ${sportShort} ${stageFormatted}`;
  }

  if (participants.length === 2) {
    const [team1, team2] = participants;
    return `${team1.schools.abbreviation} (0) vs (0) ${team2.schools.abbreviation} - ${sportShort} ${stageFormatted}`;
  }

  // For more than 2 teams
  const abbrevs = participants.map((p) => `${p.schools.abbreviation} (0)`);
  return `${abbrevs.join(' vs ')} - ${sportShort} ${stageFormatted}`;
}

/**
 * Shortens common sport names for compact display
 */
function shortenSportName(name: string): string {
  const shortNames: Record<string, string> = {
    'Mobile Legends: Bang Bang': 'MLBB',
    'VALORANT': 'VALO',
    'Valorant': 'VALO',
    'League of Legends': 'LoL',
    'League of Legends: Wild Rift': 'WR',
    'Call of Duty: Mobile': 'CODM',
  };
  return shortNames[name] || name;
}

/**
 * Generates match title (shorter version of name for display purposes)
 */
export function generateMatchTitle(participants: MatchParticipant[]): string {
  if (participants.length === 0) {
    return 'TBD vs TBD';
  }

  if (participants.length === 1) {
    return `${participants[0].schools.abbreviation} vs TBD`;
  }

  if (participants.length === 2) {
    const [team1, team2] = participants;
    return `${team1.schools.abbreviation} vs ${team2.schools.abbreviation}`;
  }

  // For more than 2 teams, use first and last
  const firstTeam = participants[0];
  const lastTeam = participants[participants.length - 1];
  return `${firstTeam.schools.abbreviation} vs ${lastTeam.schools.abbreviation} (+${participants.length - 2})`;
}

