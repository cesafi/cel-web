'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { ImageUpload } from '@/components/shared/image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volunteer, VolunteerInsert, VolunteerUpdate } from '@/lib/types/volunteers';
import { createVolunteerSchema, updateVolunteerSchema } from '@/lib/validations/volunteers';
import { useAllDepartments } from '@/hooks/use-departments';
import { useAllSeasons } from '@/hooks/use-seasons';
import { toast } from 'sonner';
import { ZodError } from 'zod';

interface VolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  volunteer?: Volunteer;
  onSubmit: (data: VolunteerInsert | VolunteerUpdate) => void;
  isSubmitting: boolean;
}

export function VolunteerModal({
  open,
  onOpenChange,
  mode,
  volunteer,
  onSubmit,
  isSubmitting
}: VolunteerModalProps) {
  const [formData, setFormData] = useState<VolunteerInsert | VolunteerUpdate>({
    full_name: '',
    image_url: '',
    is_active: true,
    department_id: null,
    season_id: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  const { data: departments = [] } = useAllDepartments();
  const { data: seasons = [] } = useAllSeasons();

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && volunteer) {
        setFormData({
          id: volunteer.id,
          full_name: volunteer.full_name,
          image_url: volunteer.image_url || '',
          is_active: volunteer.is_active ?? true,
          department_id: volunteer.department_id,
          season_id: volunteer.season_id
        });
      } else {
        setFormData({
          full_name: '',
          image_url: '',
          is_active: true,
          department_id: null,
          season_id: null
        });
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, volunteer]);

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
      const schema = mode === 'add' ? createVolunteerSchema : updateVolunteerSchema;
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

  return (
    <ModalLayout
      open={open}
      onOpenChange={handleClose}
      title={mode === 'add' ? 'Add New Volunteer' : 'Edit Volunteer'}
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
            form="volunteer-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Volunteer' : 'Update Volunteer'}
          </Button>
        </div>
      }
    >
      <form id="volunteer-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Volunteer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter volunteer's full name"
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && <p className="text-sm text-red-500">{errors.full_name}</p>}
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo *</Label>
              <ImageUpload
                preset="VOLUNTEER"
                currentImageUrl={formData.image_url || undefined}
                onUpload={(url) => handleInputChange('image_url', url)}
                onRemove={() => handleInputChange('image_url', '')}
                placeholder="Upload volunteer photo"
                description="Upload a photo of the volunteer. Recommended: 400x400px."
                showPreview={true}
                showRemoveButton={true}
                error={errors.image_url}
              />
              {errors.image_url && <p className="text-sm text-red-500">{errors.image_url}</p>}
            </div>

            {/* Department Selector */}
            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
              <Select
                value={formData.department_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('department_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department_id && <p className="text-sm text-red-500">{errors.department_id}</p>}
            </div>

            {/* Season Selector */}
            <div className="space-y-2">
              <Label htmlFor="season_id">Season</Label>
              <Select
                value={formData.season_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('season_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger className={errors.season_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      Season {season.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.season_id && <p className="text-sm text-red-500">{errors.season_id}</p>}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Volunteer</Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
