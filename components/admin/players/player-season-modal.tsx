'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayerSeasonWithDetails, PlayerSeasonInsert, PlayerSeasonUpdate } from '@/lib/types/player-seasons';
import { Database, Constants } from '@/database.types';
import { useAllSeasons } from '@/hooks/use-seasons';
import { useAllSchoolsTeams } from '@/hooks/use-schools-teams';
import { toast } from 'sonner';

interface PlayerSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  playerSeason?: PlayerSeasonWithDetails;
  playerId: string;
  playerName: string;
  onSubmit: (data: PlayerSeasonInsert | PlayerSeasonUpdate) => void;
  isSubmitting: boolean;
}

export function PlayerSeasonModal({
  open,
  onOpenChange,
  mode,
  playerSeason,
  playerId,
  playerName,
  onSubmit,
  isSubmitting
}: PlayerSeasonModalProps) {
  const [formData, setFormData] = useState<{
    id?: number;
    player_id: string;
    season_id: number;
    team_id: string | null;
    is_active: boolean;
    is_team_captain: boolean;
    player_role: string | null;
  }>({
    player_id: playerId,
    season_id: 0,
    team_id: null,
    is_active: true,
    is_team_captain: false,
    player_role: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedSubmitting = useRef(false);

  const { data: seasons = [] } = useAllSeasons();
  const { data: teams = [] } = useAllSchoolsTeams();

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && playerSeason) {
        setFormData({
          id: playerSeason.id,
          player_id: playerSeason.player_id,
          season_id: playerSeason.schools_teams?.season_id || 0,
          team_id: playerSeason.team_id,
          is_active: playerSeason.is_active ?? true,
          is_team_captain: playerSeason.is_team_captain ?? false,
          player_role: playerSeason.player_role ?? null
        });
      } else {
        setFormData({
          player_id: playerId,
          season_id: 0,
          team_id: null,
          is_active: true,
          is_team_captain: false,
          player_role: null
        });
      }
      setErrors({});
      hasStartedSubmitting.current = false;
    }
  }, [open, mode, playerSeason, playerId]);

  useEffect(() => {
    if (hasStartedSubmitting.current && !isSubmitting) {
      handleClose();
    }
  }, [isSubmitting, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!formData.season_id) {
      setErrors({ season_id: 'Season is required' });
      return;
    }
    if (!formData.team_id) {
      setErrors({ team_id: 'Team is required' });
      return;
    }

    try {
      hasStartedSubmitting.current = true;
      if (mode === 'edit' && formData.id) {
        onSubmit({
          id: formData.id,
          team_id: formData.team_id,
          is_active: formData.is_active,
          is_team_captain: formData.is_team_captain,
          player_role: formData.player_role as Database['public']['Enums']['player_role'] | null
        });
      } else {
        onSubmit({
          player_id: formData.player_id,
          team_id: formData.team_id,
          is_active: formData.is_active,
          is_team_captain: formData.is_team_captain,
          player_role: formData.player_role as Database['public']['Enums']['player_role'] | null
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Filter teams by selected season
  const filteredTeams = formData.season_id
    ? teams.filter(team => team.season_id === formData.season_id)
    : teams;

  return (
    <ModalLayout
      open={open}
      onOpenChange={handleClose}
      title={mode === 'add' ? 'Add Team History' : 'Edit Team History'}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="player-season-form"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Entry' : 'Update Entry'}
          </Button>
        </div>
      }
    >
      <form id="player-season-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Team History for {playerName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Season Selector */}
            <div className="space-y-2">
              <Label htmlFor="season_id">Season *</Label>
              <Select
                value={formData.season_id?.toString() || ''}
                onValueChange={(value) => {
                  handleInputChange('season_id', parseInt(value));
                  // Reset team when season changes
                  handleInputChange('team_id', null);
                }}
              >
                <SelectTrigger className={errors.season_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name || `Season ${season.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.season_id && <p className="text-sm text-red-500">{errors.season_id}</p>}
            </div>

            {/* Team Selector */}
            <div className="space-y-2">
              <Label htmlFor="team_id">Team *</Label>
              <Select
                value={formData.team_id || ''}
                onValueChange={(value) => handleInputChange('team_id', value)}
                disabled={!formData.season_id}
              >
                <SelectTrigger className={errors.team_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={formData.season_id ? "Select team" : "Select a season first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} {team.esports_categories?.esports ? `(${team.esports_categories.esports.name} - ${team.esports_categories.division})` : team.esports_categories?.division && `(${team.esports_categories.division})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team_id && <p className="text-sm text-red-500">{errors.team_id}</p>}
              {formData.season_id && filteredTeams.length === 0 && (
                <p className="text-sm text-muted-foreground">No teams found for this season</p>
              )}
            </div>

            {/* Player Role */}
            <div className="space-y-2">
              <Label htmlFor="player_role">Player Role</Label>
              <Select
                value={formData.player_role || 'none'}
                onValueChange={(value) => handleInputChange('player_role', value === 'none' ? null : value)}
                disabled={!formData.team_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Sub</SelectItem>
                  {Constants.public.Enums.player_role.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active in this season</Label>
            </div>

            {/* Team Captain Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_team_captain"
                checked={formData.is_team_captain}
                onCheckedChange={(checked) => handleInputChange('is_team_captain', checked)}
              />
              <Label htmlFor="is_team_captain">Team Captain</Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
