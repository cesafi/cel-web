'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MatchStatusModal } from './match-status-modal';
import { MatchWithFullDetails, MatchUpdate } from '@/lib/types/matches';
import { updateMatchById } from '@/actions/matches';

// Example usage of the MatchStatusModal with scores
export function MatchStatusModalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Example match data - in real usage this would come from your database
  const exampleMatch: MatchWithFullDetails = {
    id: 1,
    name: 'USC vs UC',
    description: 'Basketball match between USC and UC',
    venue: 'USC Gymnasium',
    scheduled_at: '2024-01-15T14:00:00Z',
    start_at: null,
    end_at: null,
    stream_url: null,
    best_of: 1,
    stage_id: 1,
    status: 'upcoming',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    esports_seasons_stages: {
      id: 1,
      name: 'Playoff Stage',
      competition_stage: 'playoffs',
      season_id: 1,
      esports_categories: {
        id: 1,
        division: 'men',
        levels: 'college',
        esports: {
          id: 1,
          name: 'Basketball'
        }
      },
      esports_seasons: {
        id: 1,
        name: 'Season 2024',
        year: '2024'
      }
    },
    games: [],
    match_participants: [
      {
        id: 1,
        match_id: 1,
        team_id: 'team-1',
        match_score: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        schools_teams: {
          id: 'team-1',
          name: 'Trojans',
          logo_url: null,
          school: {
            id: 1,
            name: 'University of San Carlos',
            abbreviation: 'USC',
            logo_url: null
          }
        }
      },
      {
        id: 2,
        match_id: 1,
        team_id: 'team-2',
        match_score: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        schools_teams: {
          id: 'team-2',
          name: 'Warriors',
          logo_url: null,
          school: {
            id: 2,
            name: 'University of Cebu',
            abbreviation: 'UC',
            logo_url: null
          }
        }
      }
    ]
  };

  const handleUpdateMatch = async (data: MatchUpdate) => {
    setIsSubmitting(true);
    try {
      await updateMatchById({ ...data, id: exampleMatch.id });
      // Handle success
    } catch (error) {
      console.error('Failed to update match:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Match Status Modal Example</h2>
      <p className="text-muted-foreground mb-4">
        This example shows how to use the MatchStatusModal with integrated score management.
      </p>
      
      <Button onClick={() => setIsModalOpen(true)}>
        Open Match Status Modal
      </Button>

      <MatchStatusModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        match={exampleMatch}
        onUpdateMatch={handleUpdateMatch}
        isSubmitting={isSubmitting}
      />

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>✅ Match status management (upcoming, ongoing, finished, cancelled)</li>
          <li>✅ Timing controls (scheduled, start, end times)</li>
          <li>✅ Score input for each team</li>
          <li>✅ Automatic winner calculation</li>
          <li>✅ Real-time score validation</li>
          <li>✅ Database integration for score updates</li>
        </ul>
      </div>
    </div>
  );
}
