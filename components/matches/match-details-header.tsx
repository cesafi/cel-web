import { MatchWithFullDetails } from '@/lib/types/matches';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, MapPin, MonitorPlay } from 'lucide-react';

interface MatchDetailsHeaderProps {
  match: MatchWithFullDetails;
}

export function MatchDetailsHeader({ match }: MatchDetailsHeaderProps) {
  const team1 = match.match_participants[0];
  const team2 = match.match_participants[1];
  
  const stageName = match.esports_seasons_stages?.competition_stage?.replace(/_/g, ' ') || 'Unknown Stage';
  const season = match.esports_seasons_stages?.seasons;
  
  // Use explicit season name if available, otherwise fall back to year
  let seasonName = '';
  if (season) {
     if (season.name) {
       seasonName = season.name;
     } else if (season.start_at) {
       seasonName = `Season ${new Date(season.start_at).getFullYear()}`;
     }
  }
  const matchDate = match.scheduled_at ? new Date(match.scheduled_at) : null;

  return (
    <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{seasonName}</Badge>
          <span className="font-medium text-foreground">{stageName}</span>
        </div>
        {matchDate && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(matchDate, 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {team1?.schools_teams?.school?.logo_url ? (
              <Image
                src={team1.schools_teams.school.logo_url}
                alt={team1.schools_teams.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-full animate-pulse" />
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-center">
            {team1?.schools_teams?.name || 'TBD'}
          </h2>
          <div className="text-sm text-muted-foreground">
            {team1?.schools_teams?.school?.name}
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl md:text-6xl font-black font-mono tracking-widest flex items-center gap-4">
            <span className={team1?.match_score && team2?.match_score && team1.match_score > team2.match_score ? 'text-primary' : ''}>
              {team1?.match_score ?? 0}
            </span>
            <span className="text-muted-foreground text-2xl">-</span>
            <span className={team2?.match_score && team1?.match_score && team2.match_score > team1.match_score ? 'text-primary' : ''}>
              {team2?.match_score ?? 0}
            </span>
          </div>
          <Badge variant="secondary" className="mt-2 text-xs uppercase tracking-wider">
            {match.status}
          </Badge>
          {match.games.length > 0 && (
             <span className="text-xs text-muted-foreground mt-1">Best of {Math.ceil(match.games.length / 2) * 2 - 1}</span> // Rough mapping, usually predefined
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {team2?.schools_teams?.school?.logo_url ? (
              <Image
                src={team2.schools_teams.school.logo_url}
                alt={team2.schools_teams.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-full animate-pulse" />
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-center">
            {team2?.schools_teams?.name || 'TBD'}
          </h2>
          <div className="text-sm text-muted-foreground">
            {team2?.schools_teams?.school?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
