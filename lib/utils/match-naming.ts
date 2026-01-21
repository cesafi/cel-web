export interface MatchParticipant {
  id: string;
  name: string;
  schools: {
    name: string;
    abbreviation: string;
  };
}

/**
 * Generates a consistent match name based on participating teams
 * Format: "ABBREV Team vs ABBREV Team"
 */
export function generateMatchName(participants: MatchParticipant[]): string {
  if (participants.length === 0) {
    return 'TBD vs TBD';
  }

  if (participants.length === 1) {
    const team = participants[0];
    return `${team.schools.abbreviation} ${team.name} vs TBD`;
  }

  if (participants.length === 2) {
    const [team1, team2] = participants;
    return `${team1.schools.abbreviation} ${team1.name} vs ${team2.schools.abbreviation} ${team2.name}`;
  }

  // For more than 2 teams (multi-team matches)
  const teamNames = participants.map((p) => `${p.schools.abbreviation} ${p.name}`);
  return teamNames.join(' vs ');
}

/**
 * Generates a match description based on participating teams and competition details
 */
export function generateMatchDescription(
  participants: MatchParticipant[],
  competitionStage: string,
  sportName: string,
  division: string,
  level: string
): string {
  const stageFormatted = competitionStage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const divisionFormatted = division.charAt(0).toUpperCase() + division.slice(1);
  const levelFormatted = level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  if (participants.length === 0) {
    return `${stageFormatted} match in ${sportName} (${divisionFormatted} ${levelFormatted})`;
  }

  if (participants.length === 1) {
    const team = participants[0];
    return `${stageFormatted} match featuring ${team.schools.name} ${team.name} in ${sportName} (${divisionFormatted} ${levelFormatted})`;
  }

  if (participants.length === 2) {
    const [team1, team2] = participants;
    return `${stageFormatted} match between ${team1.schools.name} ${team1.name} and ${team2.schools.name} ${team2.name} in ${sportName} (${divisionFormatted} ${levelFormatted})`;
  }

  // For more than 2 teams
  const schoolNames = participants.map((p) => `${p.schools.name} ${p.name}`);
  const lastTeam = schoolNames.pop();
  const otherTeams = schoolNames.join(', ');

  return `${stageFormatted} match between ${otherTeams} and ${lastTeam} in ${sportName} (${divisionFormatted} ${levelFormatted})`;
}

/**
 * Generates match title (shorter version of name for display purposes)
 */
export function generateMatchTitle(participants: MatchParticipant[]): string {
  if (participants.length === 0) {
    return 'TBD vs TBD';
  }

  if (participants.length === 1) {
    const team = participants[0];
    return `${team.schools.abbreviation} vs TBD`;
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
