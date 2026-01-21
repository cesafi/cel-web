'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  Trophy,
  Square,
  Play,
  Building,
  Hash
} from 'lucide-react';
import { MatchWithFullDetails } from '@/lib/types/matches';
import { formatDetailedDate, formatSmartDate } from '@/lib/utils/date';
import { formatCategoryName } from '@/lib/utils/sports';

interface MatchInfoCardProps {
  match: MatchWithFullDetails;
  onManageStatus?: () => void;
}

export function MatchInfoCard({ match, onManageStatus: _onManageStatus }: MatchInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Building className="h-6 w-6 text-primary" />
          <span>Match Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Competition Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">Competition Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{match.esports_seasons_stages?.esports_categories?.esports?.name ?? 'Unknown Esport'}</p>
                  <p className="text-sm text-muted-foreground">
                    {match.esports_seasons_stages?.esports_categories
                      ? formatCategoryName(
                          match.esports_seasons_stages.esports_categories.division,
                          match.esports_seasons_stages.esports_categories.levels
                        )
                      : 'Unknown Category'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Stage</p>
                  <p className="text-sm text-muted-foreground">
                    {match.esports_seasons_stages?.competition_stage
                      ? match.esports_seasons_stages.competition_stage
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())
                      : 'Unknown Stage'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Venue & Timing */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">Location & Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">{match.venue}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Scheduled Date</p>
                  <p className="text-sm text-muted-foreground">
                    {match.scheduled_at ? formatDetailedDate(match.scheduled_at) : 'Not scheduled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Match Progress */}
        {(match.start_at || match.end_at) && (
          <>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Match Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {match.start_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Play className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Started</p>
                      <p className="text-sm text-muted-foreground">{formatSmartDate(match.start_at, { showTime: true })}</p>
                    </div>
                  </div>
                )}
                {match.end_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Square className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Ended</p>
                      <p className="text-sm text-muted-foreground">{formatSmartDate(match.end_at, { showTime: true })}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Description */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">Description</h4>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground leading-relaxed">{match.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
