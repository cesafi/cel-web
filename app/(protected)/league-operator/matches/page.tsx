'use client';

import { MatchesTable } from '@/components/shared';

export default function LeagueOperatorMatchesPage() {
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Matches Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage matches for the league. Select a league stage to view and manage matches.
        </p>
      </div>

      {/* Matches Table */}
      <MatchesTable 
        userRole="league_operator" 
        showLeagueStageSelector={true}
      />
    </div>
  );
}
