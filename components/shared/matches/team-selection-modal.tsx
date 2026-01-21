'use client';

import { useState, useEffect } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Trophy, Users } from 'lucide-react';
import { MatchParticipantWithFullDetails } from '@/lib/types/match-participants';
import { useStageTeams } from '@/hooks/use-stage-teams';
import { useCreateMatchParticipant } from '@/hooks/use-match-participants';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamSelectionModalProps {
  matchId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded: () => void;
  existingParticipants: MatchParticipantWithFullDetails[];
}

export function TeamSelectionModal({
  matchId,
  open,
  onOpenChange,
  onTeamAdded,
  existingParticipants
}: TeamSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Get available teams for the match's stage
  const { data: availableTeams = [], isLoading } = useStageTeams(matchId);

  // Create participant mutation
  const createParticipantMutation = useCreateMatchParticipant();

  // Filter out teams that are already participating
  const existingTeamIds = existingParticipants.map(p => p.team_id);
  const eligibleTeams = availableTeams.filter(team => !existingTeamIds.includes(team.id));

  // Filter teams based on search term
  const filteredTeams = eligibleTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.schools?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.schools?.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeams(prev => [...prev, teamId]);
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    }
  };

  const handleSubmit = async () => {
    if (selectedTeams.length === 0) {
      toast.error('Please select at least one team');
      return;
    }

    try {
      // Add each selected team as a participant
      for (const teamId of selectedTeams) {
        const result = await createParticipantMutation.mutateAsync({
          match_id: matchId,
          team_id: teamId
        });
        
        if (!result.success) {
          toast.error(result.error || 'Failed to add team to match');
          return;
        }
      }
      
      toast.success(`Successfully added ${selectedTeams.length} team(s) to match`);
      onTeamAdded();
      handleClose();
    } catch (_error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleClose = () => {
    setSelectedTeams([]);
    setSearchTerm('');
    onOpenChange(false);
  };

  // Reset selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTeams([]);
      setSearchTerm('');
    }
  }, [open]);


  return (
    <ModalLayout
      open={open}
      onOpenChange={handleClose}
      title={
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Add Teams to Match</span>
        </div>
      }
      footer={
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedTeams.length === 0 || createParticipantMutation.isPending}
          >
            {createParticipantMutation.isPending ? 'Adding...' : `Add ${selectedTeams.length} Team(s)`}
          </Button>
        </div>
      }
      maxWidth="max-w-2xl"
    >
        <div className="flex flex-col space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                Search Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamSearch">Search Teams</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="teamSearch"
                    placeholder="Search by team name or school..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Selected teams count */}
              {selectedTeams.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {selectedTeams.length} team(s) selected
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teams list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Available Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading teams...</p>
                    </div>
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {eligibleTeams.length === 0 
                          ? 'No eligible teams available for this match'
                          : 'No teams found matching your search'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTeams.map((team) => (
                      <div key={team.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={`team-${team.id}`}
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={(checked) => handleTeamSelection(team.id, checked as boolean)}
                        />
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <Label htmlFor={`team-${team.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{team.schools?.abbreviation} {team.name}</div>
                          <div className="text-sm text-muted-foreground">{team.schools?.name}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
    </ModalLayout>
  );
}