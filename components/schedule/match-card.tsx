'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MapPin,
  Trophy,
  Users,
  Volleyball,
  Activity,
  Zap,
  MapPin as MapPinIcon,
  Waves,
  Sword,
  Sparkles,
  Music,
  Circle,
  Target,
  Dumbbell
} from 'lucide-react';
import Image from 'next/image';
import { ScheduleMatch } from '@/lib/types/matches';
import { determineWinner } from './utils';
import { getSportIcon } from '@/lib/utils/sports';

interface MatchCardProps {
  readonly match: ScheduleMatch;
  readonly onMatchClick?: (match: ScheduleMatch) => void;
}

export default function MatchCard({ match, onMatchClick }: MatchCardProps) {
  // Transform match_participants to the format expected by determineWinner
  const participants = match.match_participants.map((p) => ({
    id: p.id,
    teamName: p.schools_teams?.name ?? 'Unknown Team',
    schoolName: p.schools_teams?.school?.name ?? 'Unknown School',
    schoolAbbreviation: p.schools_teams?.school?.abbreviation ?? 'UNK',
    schoolLogo: p.schools_teams?.school?.logo_url ?? null,
    score: p.match_score,
    isWinner: false
  }));

  const participantsWithWinners = determineWinner(participants);
  const [team1, team2] = participantsWithWinners;

  // Get sport icon component
  const getSportIconComponent = (sportName: string) => {
    const iconName = getSportIcon(sportName);
    const iconProps = { className: 'h-4 w-4' };

    switch (iconName) {
      case 'Basketball':
        return <Circle {...iconProps} />; // Using Circle for basketball
      case 'Volleyball':
        return <Volleyball {...iconProps} />;
      case 'Football':
        return <Circle {...iconProps} />; // Using Circle for football
      case 'Tennis':
        return <Circle {...iconProps} />; // Using Circle for tennis
      case 'Badminton':
        return <Circle {...iconProps} />; // Using Circle for badminton
      case 'TableTennis':
        return <Circle {...iconProps} />; // Using Circle for table tennis
      case 'Baseball':
        return <Circle {...iconProps} />; // Using Circle for baseball
      case 'Softball':
        return <Circle {...iconProps} />; // Using Circle for softball
      case 'Activity':
        return <Activity {...iconProps} />;
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'MapPin':
        return <MapPinIcon {...iconProps} />;
      case 'Waves':
        return <Waves {...iconProps} />;
      case 'Fist':
        return <Target {...iconProps} />; // Using Target for combat sports
      case 'Sword':
        return <Sword {...iconProps} />;
      case 'Chess':
        return <Target {...iconProps} />; // Using Target for chess
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'Music':
        return <Music {...iconProps} />;
      case 'Circle':
        return <Circle {...iconProps} />;
      case 'Target':
        return <Target {...iconProps} />;
      case 'Dumbbell':
        return <Dumbbell {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'live':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished':
        return 'Finished';
      case 'live':
        return 'Live';
      case 'upcoming':
        return 'Upcoming';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Card
      className="border-border bg-card hover:border-primary/20 cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
      onClick={() => onMatchClick?.(match)}
    >
      {/* Main Content */}
      <CardContent className="p-6">
        {/* Match Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={getStatusColor(match.status)}>
              {getStatusText(match.status)}
            </Badge>
            <div className="text-muted-foreground font-roboto flex items-center gap-2 text-sm">
              {getSportIconComponent(match.esports_seasons_stages?.esports_categories?.esports?.name ?? 'Unknown')}
              <span>
                {match.esports_seasons_stages?.esports_categories?.esports?.name ?? 'Unknown'} •{' '}
                {match.esports_seasons_stages?.esports_categories?.levels ?? 'Unknown'} •{' '}
                {match.esports_seasons_stages?.esports_categories?.division ?? 'Unknown'}
              </span>
            </div>
          </div>
          <div className="text-muted-foreground font-roboto text-sm">
            {match.esports_seasons_stages?.competition_stage ?? 'Unknown Stage'}
          </div>
        </div>

        {/* Teams and Scores */}
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          {/* Team 1 */}
          <div className="flex items-center justify-end gap-2">
            <div className="min-w-0 text-right">
              <div className="font-mango-grotesque text-foreground truncate text-lg font-semibold">
                {team1.schoolAbbreviation}
              </div>
              <div className="text-muted-foreground font-roboto truncate text-sm">
                {team1.schoolName}
              </div>
            </div>
            <div className="relative">
              <Image
                src={team1.schoolLogo ?? '/img/cesafi-logo.webp'}
                alt={`${team1.schoolAbbreviation} logo`}
                width={48}
                height={48}
                className="border-border h-12 w-12 rounded-full border-2 object-cover"
              />
              {team1.isWinner && match.status === 'finished' && (
                <div className="absolute -top-1 -right-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
              )}
            </div>
            <div
              className={`font-mango-grotesque text-4xl font-bold ${
                team1.isWinner && match.status === 'finished' ? 'text-primary' : 'text-foreground'
              }`}
            >
              {team1.score ?? '-'}
            </div>
          </div>

          {/* VS - Perfectly Centered */}
          <div className="flex justify-center">
            <div className="text-muted-foreground font-mango-grotesque text-sm font-medium">vs</div>
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-start gap-2">
            <div
              className={`font-mango-grotesque text-4xl font-bold ${
                team2.isWinner && match.status === 'finished' ? 'text-primary' : 'text-foreground'
              }`}
            >
              {team2.score ?? '-'}
            </div>
            <div className="relative">
              <Image
                src={team2.schoolLogo ?? '/img/cesafi-logo.webp'}
                alt={`${team2.schoolAbbreviation} logo`}
                width={48}
                height={48}
                className="border-border h-12 w-12 rounded-full border-2 object-cover"
              />
              {team2.isWinner && match.status === 'finished' && (
                <div className="absolute -top-1 -right-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
              )}
            </div>
            <div className="min-w-0 text-left">
              <div className="font-mango-grotesque text-foreground truncate text-lg font-semibold">
                {team2.schoolAbbreviation}
              </div>
              <div className="text-muted-foreground font-roboto truncate text-sm">
                {team2.schoolName}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Match Details Footer */}
      <div className="bg-muted/50 px-6 py-4">
        <div className="text-muted-foreground font-roboto flex flex-wrap items-center justify-between gap-y-2 text-base font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{match.displayTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{match.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Best of {match.best_of}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
