export interface MatchParticipant {
  id: string;
  name: string;
  schools: {
    name: string;
    abbreviation: string;
  };
}

/**
 * Builds a combined list of real participant abbreviations + TBD placeholders
 */
function buildAbbreviationList(participants: MatchParticipant[], tbdCount: number = 0): string[] {
  const abbrevs = participants.map((p) => p.schools.abbreviation);
  for (let i = 0; i < tbdCount; i++) {
    abbrevs.push('TBD');
  }
  return abbrevs;
}

/**
 * Generates a match name using school abbreviations
 * Format: "USJ-R vs UCMN"
 */
export function generateMatchName(participants: MatchParticipant[], tbdCount: number = 0): string {
  const abbrevs = buildAbbreviationList(participants, tbdCount);

  if (abbrevs.length === 0) {
    return 'TBD vs TBD';
  }

  if (abbrevs.length === 1) {
    return `${abbrevs[0]} vs TBD`;
  }

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
  _level: string,
  tbdCount: number = 0
): string {
  const stageFormatted = competitionStage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Shorten common sport names for the description
  const sportShort = shortenSportName(sportName);

  const abbrevs = buildAbbreviationList(participants, tbdCount);

  if (abbrevs.length === 0) {
    return `TBD (0) vs (0) TBD - ${sportShort} ${stageFormatted}`;
  }

  if (abbrevs.length === 1) {
    return `${abbrevs[0]} (0) vs (0) TBD - ${sportShort} ${stageFormatted}`;
  }

  const withScores = abbrevs.map((a) => `${a} (0)`);
  return `${withScores.join(' vs ')} - ${sportShort} ${stageFormatted}`;
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
export function generateMatchTitle(participants: MatchParticipant[], tbdCount: number = 0): string {
  const abbrevs = buildAbbreviationList(participants, tbdCount);

  if (abbrevs.length === 0) {
    return 'TBD vs TBD';
  }

  if (abbrevs.length === 1) {
    return `${abbrevs[0]} vs TBD`;
  }

  if (abbrevs.length === 2) {
    return `${abbrevs[0]} vs ${abbrevs[1]}`;
  }

  // For more than 2 entries, use first and last
  return `${abbrevs[0]} vs ${abbrevs[abbrevs.length - 1]} (+${abbrevs.length - 2})`;
}

