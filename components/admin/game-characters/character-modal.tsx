'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { ImageUpload } from '@/components/shared/image-upload';
import { GameCharacter, GameCharacterInsert, GameCharacterUpdate } from '@/lib/types/game-characters';
import { toast } from 'sonner';
import { User } from 'lucide-react';

interface CharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  character?: GameCharacter;
  esportId: number;
  onSubmit: (data: GameCharacterInsert | GameCharacterUpdate) => void;
  isSubmitting: boolean;
}

export function CharacterModal({
  open,
  onOpenChange,
  mode,
  character,
  esportId,
  onSubmit,
  isSubmitting
}: CharacterModalProps) {
  const [formData, setFormData] = useState<GameCharacterInsert | GameCharacterUpdate>({
    name: '',
    role: '',
    icon_url: '',
    esport_id: esportId
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedSubmitting = useRef(false);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && character) {
        setFormData({
          id: character.id,
          name: character.name,
          role: character.role,
          icon_url: character.icon_url || '',
          esport_id: character.esport_id
        });
      } else {
        setFormData({
          name: '',
          role: '',
          icon_url: '',
          esport_id: esportId
        });
      }
      setErrors({});
      hasStartedSubmitting.current = false;
    }
  }, [open, mode, character, esportId]);

  useEffect(() => {
    if (hasStartedSubmitting.current && !isSubmitting) {
      handleClose();
    }
  }, [isSubmitting, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!formData.name?.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    if (!formData.role?.trim()) {
      setErrors({ role: 'Role is required' });
      return;
    }

    try {
      hasStartedSubmitting.current = true;
      onSubmit(formData);
    } catch (error) {
      if (error instanceof Error) {
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
      title={mode === 'add' ? 'Add Character' : 'Edit Character'}
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
            form="character-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Character' : 'Update Character'}
          </Button>
        </div>
      }
    >
      <form id="character-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Character Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Icon Upload */}
            <div className="space-y-2">
              <Label>Character Icon</Label>
              <ImageUpload
                preset="GAME_CHARACTER"
                currentImageUrl={formData.icon_url || undefined}
                onUpload={(url) => handleInputChange('icon_url', url)}
                onRemove={() => handleInputChange('icon_url', '')}
                placeholder="Upload character icon"
                description="Upload a square icon (recommended: 128x128px)"
                showPreview={true}
                showRemoveButton={true}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter character name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role || ''}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="e.g., Assassin, Tank, Support"
                className={errors.role ? 'border-red-500' : ''}
              />
              {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
