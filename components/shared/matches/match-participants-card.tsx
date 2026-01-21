'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users } from 'lucide-react';
import { MatchParticipantWithFullDetails } from '@/lib/types/match-participants';

interface MatchParticipantsCardProps {
  participants: MatchParticipantWithFullDetails[];
  isLoading?: boolean;
}

export function MatchParticipantsCard({ participants, isLoading }: MatchParticipantsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Participating Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading participants...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Participating Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No participating teams found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Participating Teams</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{participant.schools_teams.schools.abbreviation} {participant.schools_teams.name}</p>
                  <p className="text-sm text-muted-foreground">{participant.schools_teams.schools.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}