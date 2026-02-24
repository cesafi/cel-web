import { validatePublicVetoAccess } from '@/actions/veto-public';
import { MapVetoPanel } from '@/components/veto/map-veto-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';

interface PublicVetoPageProps {
  params: Promise<{
    matchId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Map Veto | CESAFI Esports',
  description: 'Map Veto for CESAFI Esports Match',
};

export default async function PublicVetoPage({ params, searchParams }: PublicVetoPageProps) {
  const { matchId } = await params;
  const { team } = await searchParams;
  
  const teamIdStr = typeof team === 'string' ? team : Array.isArray(team) ? team[0] : null;

  if (!teamIdStr || isNaN(parseInt(matchId))) {
    return notFound();
  }

  // Validate token and get context
  const validation = await validatePublicVetoAccess(parseInt(matchId), teamIdStr);

  if (!validation.success) {
    return (
      <div className="container max-w-4xl py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid or Expired Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This veto link is invalid or has expired. Please contact the tournament administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = (validation as any).data;
  if (!data) return notFound();

  const { match, teamId, teamSide } = data;

  // Transform team data for component
  const team1 = match.match_participants?.[0]?.schools_teams;
  const team2 = match.match_participants?.[1]?.schools_teams;

  if (!team1 || !team2) {
    return notFound();
  }

  // Calculate Best Of
  // Using levels/division to guess? Or stored in match?
  // match schema has best_of column? Check types.
  // MatchWithFullDetails includes match schema fields.
  // Assuming match.best_of exists or default to 3.
  const bestOf = match.best_of || 3;

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 py-8 space-y-8 max-w-[1920px] mx-auto">
      {/* ── Veto Match Scoreboard Header ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-primary/50 text-primary">Map Veto</Badge>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              {match.esports_seasons_stages?.competition_stage?.replace(/_/g, ' ') || 'Stage'}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Best of {bestOf}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium bg-muted">
              You are: <span className="ml-1 text-primary">{teamSide === 'team1' ? team1.name : team2.name}</span>
            </Badge>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-3 items-center gap-4 max-w-2xl mx-auto">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                {team1?.school?.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={team1.school.logo_url}
                    alt={team1.school.abbreviation || 'T1'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold text-muted-foreground">
                    {team1?.school?.abbreviation?.substring(0, 3) || 'T1'}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm md:text-base">{team1?.name || 'Team 1'}</p>
                <p className="text-xs text-muted-foreground">{team1?.school?.name || 'TBD'}</p>
              </div>
            </div>

            {/* Score VS */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3 md:gap-5">
                <span className="text-3xl md:text-5xl font-bold tabular-nums text-muted-foreground/40">VS</span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                {team2?.school?.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={team2.school.logo_url}
                    alt={team2.school.abbreviation || 'T2'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold text-muted-foreground">
                    {team2?.school?.abbreviation?.substring(0, 3) || 'T2'}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm md:text-base">{team2?.name || 'Team 2'}</p>
                <p className="text-xs text-muted-foreground">{team2?.school?.name || 'TBD'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MapVetoPanel
        matchId={match.id}
        bestOf={bestOf}
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
        publicTeamId={teamIdStr}
        userSide={teamSide}
      />
    </div>
  );
}
