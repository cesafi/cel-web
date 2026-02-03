'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';
import { useAllEsportCategories } from '@/hooks/use-esports';
import { useAllSeasons } from '@/hooks/use-seasons';
import { createsportsSeasonsStageSchema, updatesportsSeasonsStageSchema } from '@/lib/validations/esports-seasons-stages';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { Database } from '@/database.types';

type EsportsSeasonStageInsert = Database['public']['Tables']['esports_seasons_stages']['Insert'];
type EsportsSeasonStageUpdate = Database['public']['Tables']['esports_seasons_stages']['Update'];

interface LeagueStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  stage?: EsportsSeasonStageWithDetails;
  onSubmit: (data: EsportsSeasonStageInsert | EsportsSeasonStageUpdate) => void;
  isSubmitting: boolean;
  defaultSeasonId?: number | null;
}

export function LeagueStageModal({
  open,
  onOpenChange,
  mode,
  stage,
  onSubmit,
  isSubmitting,
  defaultSeasonId
}: LeagueStageModalProps) {
  const [formData, setFormData] = useState<EsportsSeasonStageInsert | EsportsSeasonStageUpdate>({
    competition_stage: '',
    esport_category_id: null,
    season_id: null,
    stage_type: 'round_robin'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  const { data: categories = [] } = useAllEsportCategories();
  const { data: seasons = [] } = useAllSeasons();

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && stage) {
        setFormData({
          id: stage.id,
          competition_stage: stage.competition_stage,
          esport_category_id: stage.esport_category_id,
          season_id: stage.season_id,
          stage_type: stage.stage_type as "round_robin" | "single_elimination" | "double_elimination"
        });
      } else {
        setFormData({
          competition_stage: '',
          esport_category_id: null,
          season_id: defaultSeasonId || null,
          stage_type: 'round_robin'
        });
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, stage]);

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
      const schema = mode === 'add' ? createsportsSeasonsStageSchema : updatesportsSeasonsStageSchema;
      const validatedData = schema.parse(formData);

      if (mode === 'add') {
        hasStartedCreating.current = true;
      } else {
        hasStartedUpdating.current = true;
      }

      onSubmit(validatedData);
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

  const handleInputChange = (field: string, value: string | number | null) => {
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

  return (
    <ModalLayout
      open={open}
      onOpenChange={handleClose}
      title={mode === 'add' ? 'Add New League Stage' : 'Edit League Stage'}
      maxWidth="max-w-lg"
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
            form="league-stage-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Stage' : 'Update Stage'}
          </Button>
        </div>
      }
    >
      <form id="league-stage-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Stage Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Competition Stage Name */}
            <div className="space-y-2">
              <Label htmlFor="competition_stage">Stage Name *</Label>
              <Input
                id="competition_stage"
                value={formData.competition_stage || ''}
                onChange={(e) => handleInputChange('competition_stage', e.target.value)}
                placeholder="e.g., Group Stage, Playoffs, Finals"
                className={errors.competition_stage ? 'border-red-500' : ''}
              />
              {errors.competition_stage && <p className="text-sm text-red-500">{errors.competition_stage}</p>}
            </div>

            {/* Stage Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="stage_type">Stage Type *</Label>
              <Select
                value={formData.stage_type || 'round_robin'}
                onValueChange={(value) => handleInputChange('stage_type', value)}
              >
                <SelectTrigger className={errors.stage_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select stage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin (Standings Table)</SelectItem>
                  <SelectItem value="single_elimination">Single Elimination (Bracket)</SelectItem>
                  <SelectItem value="double_elimination">Double Elimination (Bracket)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Determines how the standings are calculated and displayed.
              </p>
              {errors.stage_type && <p className="text-sm text-red-500">{errors.stage_type}</p>}
            </div>

            {/* Season Selector */}
            <div className="space-y-2">
              <Label htmlFor="season_id">Season</Label>
              <Select
                value={formData.season_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('season_id', value ? parseInt(value) : null)}
                disabled={!!defaultSeasonId}
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

            {/* Esport Category Selector */}
            <div className="space-y-2">
              <Label htmlFor="esport_category_id">Esport Category</Label>
              <Select
                value={formData.esport_category_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('esport_category_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger className={errors.esport_category_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select esport category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.esports.name} - {cat.division} ({cat.levels})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Links this stage to a specific esport category
              </p>
              {errors.esport_category_id && <p className="text-sm text-red-500">{errors.esport_category_id}</p>}
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
