'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { ImageUpload } from '@/components/shared/image-upload';
import { Esport, EsportInsert, EsportUpdate } from '@/lib/types/esports';
import { createEsportSchema, updateEsportSchema } from '@/lib/validations/esports';
import { toast } from 'sonner';
import { ZodError } from 'zod';

interface EsportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  esport?: Esport;
  onSubmit: (data: EsportInsert | EsportUpdate) => void;
  isSubmitting: boolean;
}

export function EsportModal({
  open,
  onOpenChange,
  mode,
  esport,
  onSubmit,
  isSubmitting
}: EsportModalProps) {
  const [formData, setFormData] = useState<EsportInsert | EsportUpdate>({
    name: '',
    abbreviation: null,
    logo_url: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && esport) {
        setFormData({
          id: esport.id,
          name: esport.name,
          abbreviation: esport.abbreviation,
          logo_url: esport.logo_url
        });
      } else {
        setFormData({
          name: '',
          abbreviation: null,
          logo_url: null
        });
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, esport]);

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
      const schema = mode === 'add' ? createEsportSchema : updateEsportSchema;
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

  const handleInputChange = (field: keyof (EsportInsert | EsportUpdate), value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
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
      title={mode === 'add' ? 'Add New Esport' : 'Edit Esport'}
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
            form="esport-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Esport' : 'Update Esport'}
          </Button>
        </div>
      }
    >
      <form id="esport-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="h-5 w-5" />
              Esport Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('name', e.target.value)
                }
                placeholder="Enter esport name (e.g., Mobile Legends, Valorant)"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Abbreviation Field */}
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('abbreviation', e.target.value || null)
                }
                placeholder="Enter abbreviation (e.g., MLBB, VAL)"
                maxLength={10}
                className={errors.abbreviation ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Short form of the esport name (max 10 characters)
              </p>
              {errors.abbreviation && <p className="text-sm text-red-500">{errors.abbreviation}</p>}
            </div>

            {/* Logo Upload Field */}
            <div className="space-y-2">
              <Label htmlFor="logo_url">Esport Logo</Label>
              <ImageUpload
                preset="ESPORT_LOGO"
                currentImageUrl={formData.logo_url || undefined}
                onUpload={(url) => handleInputChange('logo_url', url)}
                onRemove={() => handleInputChange('logo_url', null)}
                placeholder="Upload esport logo"
                description="Upload a logo image for the esport. Recommended size: 400x400px (1:1 aspect ratio)."
                showPreview={true}
                showRemoveButton={true}
                error={errors.logo_url}
              />
              {errors.logo_url && (
                <p className="text-sm text-red-500">{errors.logo_url}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
