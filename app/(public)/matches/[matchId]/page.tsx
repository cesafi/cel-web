import { getMatchById } from '@/actions/matches';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import Image from 'next/image';
import { PublicMatchStats } from '@/components/matches/public-match-stats';
import { MapVetoPanel } from '@/components/veto/map-veto-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PublicMatchPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export async function generateMetadata({ params }: PublicMatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const result = await getMatchById(Number(matchId));
  
  if (!result.success || !result.data) {
    return { title: 'Match Not Found' };
  }

  const match = result.data;
  const sport = match.esports_seasons_stages?.esports_categories?.esports?.name || 'Esports';
  const team1 = match.match_participants?.[0]?.schools_teams?.name || 'Team 1';
  const team2 = match.match_participants?.[1]?.schools_teams?.name || 'Team 2';

  return {
    title: `${team1} vs ${team2} - ${sport} | CESAFI Esports`,
    description: `Match details for ${team1} vs ${team2} in ${sport}`,
  };
}

export default async function PublicMatchPage({ params }: PublicMatchPageProps) {
  const { matchId } = await params;
  const result = await getMatchById(Number(matchId));

  if (!result.success || !result.data) {
    notFound();
  }

  const match = result.data;
  const sport = match.esports_seasons_stages?.esports_categories?.esports?.name || '';
  const isValorant = sport === 'Valorant';
  const isMlbb = sport === 'Mobile Legends: Bang Bang';

  // Teams
  const p1 = match.match_participants?.[0];
  const p2 = match.match_participants?.[1];
  const team1 = p1?.schools_teams;
  const team2 = p2?.schools_teams;

  if (!team1 || !team2) {
    return <div>Incomplete match data</div>;
  }

  // Determine winner for header trophy
  // Logic from match-card utils repeated here or simple check
  // Assuming score is enough for now, or use `match_winner_id` if exists (check schema later)
  // For UI, we highlight winner if status is finished
  const t1Score = p1?.match_score || 0;
  const t2Score = p2?.match_score || 0;
  const isFinished = match.status === 'finished';
  const t1Win = isFinished && t1Score > t2Score;
  const t2Win = isFinished && t2Score > t1Score;

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Match Header */}
      <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        {/* Background gradient based on sport? */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        <div className="relative p-6 sm:p-10">
          {/* Meta Info */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {match.status}
            </Badge>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString() : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {match.scheduled_at 
                  ? new Date(match.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'TBD'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{match.venue}</span>
            </div>
            <span>•</span>
            <span>{sport}</span>
          </div>

          {/* Scoreboard */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
             {/* Team 1 */}
             <div className="flex flex-col items-center gap-4 text-center">
                 <div className="relative">
                   <Image 
                     src={team1.school?.logo_url || '/placeholder.png'} 
                     alt={team1.name} 
                     width={80} 
                     height={80} 
                     className="rounded-full object-cover border-4 border-background shadow-lg"
                   />
                   {t1Win && (
                     <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow border">
                       <Trophy className="h-5 w-5 text-yellow-500" />
                     </div>
                   )}
                </div>
                <div>
                   <h2 className="text-2xl font-bold font-mango-grotesque">{team1.school?.abbreviation}</h2>
                   <p className="text-sm text-muted-foreground font-roboto">{team1.name}</p>
                </div>
             </div>

             {/* Score */}
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                   <span className={cn("text-6xl font-bold font-mango-grotesque", t1Win ? "text-primary" : "")}>
                     {t1Score}
                   </span>
                   <span className="text-2xl text-muted-foreground font-light">vs</span>
                   <span className={cn("text-6xl font-bold font-mango-grotesque", t2Win ? "text-primary" : "")}>
                     {t2Score}
                   </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                   Best of {match.best_of || '?'}
                </div>
             </div>

             {/* Team 2 */}
             <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                   <Image 
                     src={team2.school?.logo_url || '/placeholder.png'} 
                     alt={team2.name} 
                     width={80} 
                     height={80} 
                     className="rounded-full object-cover border-4 border-background shadow-lg"
                   />
                   {t2Win && (
                     <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow border">
                       <Trophy className="h-5 w-5 text-yellow-500" />
                     </div>
                   )}
                </div>
                <div>
                   <h2 className="text-2xl font-bold font-mango-grotesque">{team2.school?.abbreviation}</h2>
                   <p className="text-sm text-muted-foreground font-roboto">{team2.name}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Content Area (Stats) */}
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-mango-grotesque">Game Statistics</h2>
            {match.games && match.games.length > 0 ? (
              <PublicMatchStats games={match.games} sport={sport} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No match data available yet.
                </CardContent>
              </Card>
            )}
         </div>

         {/* Sidebar (Veto/Draft/Rosters) */}
         <div className="space-y-6">
            {isValorant && (
               <>
                 <h2 className="text-xl font-bold font-mango-grotesque">Map Veto</h2>
                 <MapVetoPanel 
                   matchId={match.id}
                   bestOf={match.best_of || 3}
                   team1={{
                     id: team1.id,
                     name: team1.name,
                     abbreviation: team1.school?.abbreviation || 'T1',
                     logoUrl: team1.school?.logo_url,
                   }}
                   team2={{
                     id: team2.id,
                     name: team2.name,
                     abbreviation: team2.school?.abbreviation || 'T2',
                     logoUrl: team2.school?.logo_url,
                   }}
                   isPublicView={true}
                 />
               </>
            )}

            {/* TODO: Add Rosters or Draft for MLBB here */}
         </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
