'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MatchWithStageDetails, MatchInsert, MatchUpdate } from '@/lib/types/matches';
import { ZodError } from 'zod';
import { useAllEsportsSeasonsStages } from '@/hooks/use-esports-seasons-stages';
import { useStageTeams } from '@/hooks/use-stage-teams';
import { generateMatchName, generateMatchDescription } from '@/lib/utils/match-naming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { Power } from 'lucide-react';
import { utcToLocal } from '@/lib/utils/utc-time';

interface MatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  match?: MatchWithStageDetails;
  selectedStageId: number | null;
  onSubmit: (data: MatchInsert | MatchUpdate, participantTeamIds?: string[]) => Promise<void>;
  isSubmitting: boolean;
}

export function MatchModal({
  open,
  onOpenChange,
  mode,
  match,
  selectedStageId,
  onSubmit,
  isSubmitting
}: MatchModalProps) {
  const { data: stages } = useAllEsportsSeasonsStages();
  const { data: availableTeams = [], isLoading: teamsLoading } = useStageTeams(selectedStageId || 0);

  const [formData, setFormData] = useState<MatchInsert | MatchUpdate>({
    name: '',
    description: '',
    venue: '',
    stage_id: selectedStageId || 0,
    scheduled_at: null,
    start_at: null,
    end_at: null,
    best_of: 1,
    status: 'upcoming'
  });
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  const selectedStage = stages?.find(stage => stage.id === selectedStageId);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Auto-generate match details when teams are selected
  useEffect(() => {
    if (mode === 'add' && selectedTeamIds.length > 0 && availableTeams.length > 0) {
      const selectedTeams = availableTeams.filter(team => selectedTeamIds.includes(team.id));

      if (selectedTeams.length > 0 && selectedStage) {
        // Filter out teams without schools data
        const teamsWithSchools = selectedTeams.filter(team => team.schools != null);

        const matchParticipants = teamsWithSchools.map(team => ({
          id: team.id,
          name: team.name,
          schools: {
            name: team.schools!.name,
            abbreviation: team.schools!.abbreviation
          }
        }));

        // Use actual sport and category data from the selected stage
        const sportName = selectedStage.esports_categories?.esports?.name || 'Unknown Sport';
        const division = selectedStage.esports_categories?.division || 'mixed';
        const level = selectedStage.esports_categories?.levels || 'college';

        const generatedName = generateMatchName(matchParticipants);
        const generatedDescription = generateMatchDescription(
          matchParticipants,
          selectedStage.competition_stage,
          sportName,
          division,
          level
        );

        setFormData(prev => ({
          ...prev,
          name: generatedName,
          description: generatedDescription
        }));
      }
    }
  }, [selectedTeamIds, availableTeams, selectedStage, mode]);

  // Form reset on modal open/close
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && match) {
        setFormData({
          id: match.id,
          name: match.name,
          description: match.description,
          venue: match.venue,
          stage_id: match.stage_id,
          stream_url: match.stream_url || '',
          scheduled_at: match.scheduled_at ? utcToLocal(match.scheduled_at).toISOString().slice(0, 16) : null,
          start_at: match.start_at ? utcToLocal(match.start_at).toISOString().slice(0, 16) : null,
          end_at: match.end_at ? utcToLocal(match.end_at).toISOString().slice(0, 16) : null,
          best_of: match.best_of,
          coin_toss_winner_id: match.coin_toss_winner_id || null,
          coin_toss_result: match.coin_toss_result || null,
          status: 'upcoming'
        });
        setSelectedTeamIds(
          ((match.match_participants as any[]) || [])
            .map((p: any) => p?.schools_teams?.id)
            .filter(Boolean) as string[]
        );
      } else {
        setFormData({
          name: '',
          description: '',
          venue: '',
          stream_url: '',
          stage_id: selectedStageId || 0,
          scheduled_at: null,
          start_at: null,
          end_at: null,
          best_of: 1,
          coin_toss_winner_id: null,
          coin_toss_result: null,
          status: 'upcoming'
        });
        setSelectedTeamIds([]);
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, match, selectedStageId]);

  // Handle mutation completion
  useEffect(() => {
    if (hasStartedCreating.current && !isSubmitting && mode === 'add') {
      handleClose();
    }
  }, [isSubmitting, mode, handleClose]);

  useEffect(() => {
    if (hasStartedUpdating.current && !isSubmitting && mode === 'edit') {
      handleClose();
    }
  }, [isSubmitting, mode, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Basic validation
      if (!formData.venue?.trim()) {
        setErrors({ venue: 'Venue is required' });
        return;
      }
      if (!formData.stage_id) {
        setErrors({ stage_id: 'League stage is required' });
        return;
      }
      if (selectedTeamIds.length < 2) {
        setErrors({ participants: 'At least 2 teams must be selected for a match' });
        return;
      }

      if (mode === 'add') {
        hasStartedCreating.current = true;
      } else {
        hasStartedUpdating.current = true;
      }

      await onSubmit(formData, selectedTeamIds);
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleDateChange = (field: 'scheduled_at' | 'start_at' | 'end_at', value: string) => {
    // The datetime-local input gives us local time, we'll let the validation schema convert to UTC
    const dateValue = value || null;
    setFormData(prev => ({ ...prev, [field]: dateValue }));
  };

  const handleBestOfChange = (value: string) => {
    setFormData(prev => ({ ...prev, best_of: parseInt(value) }));
  };

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds(prev => {
      if (checked) {
        return [...prev, teamId];
      } else {
        return prev.filter(id => id !== teamId);
      }
    });
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add New Match' : 'Edit Match'}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="match-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Match' : 'Update Match'}
          </Button>
        </div>
      }
    >
      <form id="match-form" onSubmit={handleSubmit} className="space-y-6">
        {/* League Stage Display */}
        {selectedStage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                League Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium">
                  {selectedStage.competition_stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-muted-foreground">
                  Stage ID: {selectedStage.id}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Match Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">


            {teamsLoading ? (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                Loading available teams...
              </div>
            ) : availableTeams.length === 0 ? (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                No teams available for this stage. Please ensure teams are registered for this sport category and season.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {availableTeams.filter(team => team.schools != null).map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={(checked) => handleTeamSelection(team.id, checked as boolean)}
                    />
                    <Label htmlFor={`team-${team.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.schools!.name}</div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {errors.participants && (
              <p className="text-sm text-red-500">{errors.participants}</p>
            )}
          </CardContent>
        </Card>
        {/* Match Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Match Name */}
            <div className="space-y-2">
              <Label htmlFor="matchName">Match Name *</Label>
              <Input
                id="matchName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={mode === 'add' ? 'Auto-generated when teams are selected' : 'Enter match name'}
                className={errors.name ? 'border-red-500' : ''}
              />
              {mode === 'add' && formData.name && (
                <p className="text-xs text-muted-foreground">Auto-generated from selected teams. You can edit this.</p>
              )}
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Match Description */}
            <div className="space-y-2">
              <Label htmlFor="matchDescription">Description *</Label>
              <Textarea
                id="matchDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={mode === 'add' ? 'Auto-generated when teams are selected' : 'Enter match description'}
                className={errors.description ? 'border-red-500' : ''}
                rows={2}
              />
              {mode === 'add' && formData.description && (
                <p className="text-xs text-muted-foreground">Auto-generated from selected teams. You can edit this.</p>
              )}
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                placeholder="Enter venue"
                className={errors.venue ? 'border-red-500' : ''}
              />
              {errors.venue && (
                <p className="text-sm text-red-500">{errors.venue}</p>
              )}
            </div>

            {/* Stream URL */}
            <div className="space-y-2">
              <Label htmlFor="stream_url">Stream URL</Label>
              <Input
                id="stream_url"
                type="url"
                value={formData.stream_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, stream_url: e.target.value }))}
                placeholder="https://twitch.tv/..."
              />
            </div>

            {/* Best of */}
            <div className="space-y-2">
              <Label htmlFor="bestOf">Best of *</Label>
              <Select value={formData.best_of?.toString()} onValueChange={handleBestOfChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select best of" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Date */}
            <DateTimeInput
              id="scheduledAt"
              label="Scheduled Date"
              value={formData.scheduled_at}
              onChange={(utcIsoString) => handleDateChange('scheduled_at', utcIsoString || '')}
              helpText="When the match is scheduled to take place"
            />

            {/* Coin Toss Overrides */}
            {mode === 'edit' && selectedTeamIds.length >= 2 && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="font-semibold text-sm">Coin Toss Overrides (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coin Toss Winner</Label>
                    <Select
                      value={formData.coin_toss_winner_id || 'none'}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, coin_toss_winner_id: val === 'none' ? null : val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
                        {selectedTeamIds.map(tId => {
                          const teamInfo = availableTeams.find(t => t.id === tId) || (match?.match_participants as any[])?.find((p: any) => p.schools_teams?.id === tId)?.schools_teams;
                          if (!teamInfo) return null;
                          return (
                            <SelectItem key={tId} value={tId}>
                              {teamInfo.abbreviation || teamInfo.name || tId}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coin Toss Result</Label>
                    <Select
                      value={formData.coin_toss_result || 'none'}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, coin_toss_result: val === 'none' ? null : val as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
                        <SelectItem value="heads">Heads</SelectItem>
                        <SelectItem value="tails">Tails</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Power className="h-5 w-5" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'add' ? (
              <>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium text-primary">Upcoming</div>
                  <div className="text-muted-foreground text-xs">
                    Status is automatically set to &quot;upcoming&quot; for new matches
                  </div>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Match start and end times will be set when the match actually begins and ends.
                  These can be updated later during match management.
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <Select
                  value={formData.status || 'upcoming'}
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-2 text-xs">
                  Update the match status. This will affect how the match is displayed throughout the application.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
