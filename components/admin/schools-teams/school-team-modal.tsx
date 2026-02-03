'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  SchoolsTeamWithSportDetails,
  SchoolsTeamInsert,
  SchoolsTeamUpdate
} from '@/lib/types/schools-teams';
import { ZodError } from 'zod';
import { useSeason } from '@/components/contexts/season-provider';
import { useAllEsports, useAllEsportCategories } from '@/hooks/use-esports';
import { formatCategoryName } from '@/lib/utils/esports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchoolTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  team?: SchoolsTeamWithSportDetails;
  selectedSchoolId: string | null;
  onSubmit: (data: SchoolsTeamInsert | SchoolsTeamUpdate) => Promise<void>;
  isSubmitting: boolean;
}

export function SchoolTeamModal({
  open,
  onOpenChange,
  mode,
  team,
  selectedSchoolId,
  onSubmit,
  isSubmitting
}: SchoolTeamModalProps) {
  const { currentSeason, availableSeasons } = useSeason();
  const { data: sports } = useAllEsports();
  const { data: sportCategories } = useAllEsportCategories();

  const [formData, setFormData] = useState<SchoolsTeamInsert | SchoolsTeamUpdate>(() => {
    if (mode === 'edit' && team) {
      return {
        id: team.id,
        name: team.name,
        school_id: team.school_id,
        season_id: team.season_id,
        esport_category_id: team.esport_category_id,
        is_active: team.is_active
      } as SchoolsTeamUpdate;
    } else {
      return {
        name: '',
        school_id: selectedSchoolId || '',
        season_id: currentSeason?.id || 0,
        esport_category_id: 0,
        is_active: true
      } as SchoolsTeamInsert;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSportId, setSelectedSportId] = useState<number | undefined>();

  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Filter sport categories by selected sport
  const filteredSportCategories =
    sportCategories?.filter(
      (category) => !selectedSportId || category.esport_id === selectedSportId
    ) || [];

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Form reset on modal open/close
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && team) {
        setFormData({
          id: team.id,
          name: team.name,
          school_id: team.school_id,
          season_id: team.season_id,
          esport_category_id: team.esport_category_id,
          is_active: team.is_active
        });
        // Set the selected sport ID based on the sport category
        if (team.esport_category_id && sportCategories) {
          const category = sportCategories.find((cat) => cat.id === team.esport_category_id);
          setSelectedSportId(category?.esport_id);
        }
      } else {
        setFormData({
          name: '',
          school_id: selectedSchoolId || '',
          season_id: currentSeason?.id || 0,
          esport_category_id: 0,
          is_active: true
        } as SchoolsTeamInsert);
        setSelectedSportId(undefined);
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, team, selectedSchoolId, currentSeason, sportCategories]);

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
      if (!formData.name?.trim()) {
        setErrors({ name: 'Team name is required' });
        return;
      }
      if (!formData.school_id) {
        setErrors({ school_id: 'School is required' });
        return;
      }
      if (!formData.season_id) {
        setErrors({ season_id: 'Season is required' });
        return;
      }
      if (!formData.esport_category_id) {
        setErrors({ esport_category_id: 'Sport category is required' });
        return;
      }

      if (mode === 'add') {
        hasStartedCreating.current = true;
      } else {
        hasStartedUpdating.current = true;
      }

      await onSubmit(formData);
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

  const handleSportChange = (sportId: string) => {
    const numSportId = parseInt(sportId);
    setSelectedSportId(numSportId);
    setFormData((prev) => ({ ...prev, esport_category_id: 0 }));
  };

  const handleSportCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, esport_category_id: parseInt(categoryId) }));
  };

  const handleSeasonChange = (seasonId: string) => {
    setFormData((prev) => ({ ...prev, season_id: parseInt(seasonId) }));
  };

  const handleActiveChange = (isActive: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: isActive }));
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add New Team' : 'Edit Team'}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="school-team-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Team' : 'Update Team'}
          </Button>
        </div>
      }
    >
      <form id="school-team-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Sport Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Sport Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sport Selection */}
            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select value={selectedSportId?.toString()} onValueChange={handleSportChange}>
                <SelectTrigger className={errors.esport_category_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports?.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.esport_category_id && (
                <p className="text-sm text-red-500">{errors.esport_category_id}</p>
              )}
            </div>

            {/* Sport Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="sportCategory">Sport Category *</Label>
              <Select
                value={formData.esport_category_id?.toString()}
                onValueChange={handleSportCategoryChange}
                disabled={!selectedSportId}
              >
                <SelectTrigger className={errors.esport_category_id ? 'border-red-500' : ''}>
                  <SelectValue
                    placeholder={selectedSportId ? 'Select a category' : 'Select a sport first'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSportCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.esport_category_id && (
                <p className="text-sm text-red-500">{errors.esport_category_id}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Season & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Season & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Season Selection */}
            <div className="space-y-2">
              <Label htmlFor="season">Season *</Label>
              <Select value={formData.season_id?.toString()} onValueChange={handleSeasonChange}>
                <SelectTrigger className={errors.season_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a season" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeasons?.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name || `Season ${season.id}`} {season.id === currentSeason?.id ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.season_id && (
                <p className="text-sm text-red-500">{errors.season_id}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={formData.is_active} onCheckedChange={handleActiveChange} />
                <Label htmlFor="isActive">Active Team</Label>
              </div>
              <p className="text-muted-foreground text-xs">
                Active teams are visible in the system and can participate in matches.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
