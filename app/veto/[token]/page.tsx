import { validateVetoToken } from '@/actions/veto-public';
import { MapVetoPanel } from '@/components/veto/map-veto-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMatchById } from '@/actions/matches';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PublicVetoPageProps {
  params: Promise<{
    token: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Map Veto | CESAFI Esports',
  description: 'Map Veto for CESAFI Esports Match',
};

export default async function PublicVetoPage({ params }: PublicVetoPageProps) {
  const { token } = await params;
  
  // Validate token and get context
  const validation = await validateVetoToken(token);

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
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Map Veto</h1>
        <p className="text-muted-foreground">
          {team1.school?.name} vs {team2.school?.name}
        </p>
        <p className="text-sm font-medium">
          You are acting as: <span className="text-primary">{teamSide === 'team1' ? team1.name : team2.name}</span>
        </p>
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
        publicToken={token}
        userSide={teamSide}
      />
    </div>
  );
}
