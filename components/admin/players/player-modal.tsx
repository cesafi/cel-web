'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { ImageUpload } from '@/components/shared/image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Player, PlayerInsert, PlayerUpdate, PlayerWithTeam } from '@/lib/types/players';
import { createPlayerSchema, updatePlayerSchema } from '@/lib/validations/players';
import { useAllSchoolsTeams } from '@/hooks/use-schools-teams';
import { toast } from 'sonner';
import { ZodError } from 'zod';

interface PlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  player?: PlayerWithTeam;
  onSubmit: (data: PlayerInsert | PlayerUpdate) => void;
  isSubmitting: boolean;
}

export function PlayerModal({
  open,
  onOpenChange,
  mode,
  player,
  onSubmit,
  isSubmitting
}: PlayerModalProps) {
  const [formData, setFormData] = useState<PlayerInsert | PlayerUpdate>({
    ign: '',
    first_name: '',
    last_name: '',
    photo_url: '',
    role: '',
    team_id: null,
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  const { data: teams = [] } = useAllSchoolsTeams();

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && player) {
        setFormData({
          id: player.id,
          ign: player.ign,
          first_name: player.first_name || '',
          last_name: player.last_name || '',
          photo_url: player.photo_url || '',
          role: player.role || '',
          team_id: player.team_id,
          is_active: player.is_active ?? true
        });
      } else {
        setFormData({
          ign: '',
          first_name: '',
          last_name: '',
          photo_url: '',
          role: '',
          team_id: null,
          is_active: true
        });
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, player]);

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
      const schema = mode === 'add' ? createPlayerSchema : updatePlayerSchema;
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

  const handleInputChange = (field: string, value: string | boolean | null) => {
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
      title={mode === 'add' ? 'Add New Player' : 'Edit Player'}
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
            form="player-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Player' : 'Update Player'}
          </Button>
        </div>
      }
    >
      <form id="player-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Player Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                preset="PLAYER_PHOTO"
                currentImageUrl={formData.photo_url || undefined}
                onUpload={(url) => handleInputChange('photo_url', url)}
                onRemove={() => handleInputChange('photo_url', '')}
                placeholder="Upload player photo"
                description="Upload a photo of the player. Recommended: 300x300px."
                showPreview={true}
                showRemoveButton={true}
                error={errors.photo_url}
              />
            </div>

            {/* IGN Field */}
            <div className="space-y-2">
              <Label htmlFor="ign">In-Game Name (IGN) *</Label>
              <Input
                id="ign"
                value={formData.ign || ''}
                onChange={(e) => handleInputChange('ign', e.target.value)}
                placeholder="Enter player's in-game name"
                className={errors.ign ? 'border-red-500' : ''}
              />
              {errors.ign && <p className="text-sm text-red-500">{errors.ign}</p>}
            </div>

            {/* First Name Field */}
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role || ''}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="e.g., Mid, Carry, Support"
                className={errors.role ? 'border-red-500' : ''}
              />
              {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
            </div>

            {/* Team Selector */}
            <div className="space-y-2">
              <Label htmlFor="team_id">Team</Label>
              <Select
                value={formData.team_id || ''}
                onValueChange={(value) => handleInputChange('team_id', value || null)}
              >
                <SelectTrigger className={errors.team_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team_id && <p className="text-sm text-red-500">{errors.team_id}</p>}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Player</Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
