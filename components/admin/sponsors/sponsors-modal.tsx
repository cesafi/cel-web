'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { Sponsor, SponsorInsert, SponsorUpdate } from '@/lib/types/sponsors';
import { createSponsorSchema, updateSponsorSchema } from '@/lib/validations/sponsors';
import { ZodError } from 'zod';

interface SponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  sponsor?: Sponsor;
  onSubmit: (data: SponsorInsert | SponsorUpdate) => Promise<void>;
  isSubmitting: boolean;
}

const SPONSOR_TYPE_LABELS: Record<string, string> = {
  title: 'Title Partner',
  venue: 'Venue Partner',
  event: 'Event Partner',
};

export function SponsorModal({
  open,
  onOpenChange,
  mode,
  sponsor,
  onSubmit,
  isSubmitting
}: SponsorModalProps) {
  // State management
  const [formData, setFormData] = useState<SponsorInsert | SponsorUpdate>({
    title: '',
    tagline: '',
    logo_url: null,
    dark_logo_url: null,
    is_active: true,
    type: null,
    display_order: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Form reset on modal open/close
  useEffect(() => {
    if (open) {
      // Reset form data based on mode
      if (mode === 'edit' && sponsor) {
        setFormData({
          id: sponsor.id,
          title: sponsor.title,
          tagline: sponsor.tagline,
          logo_url: sponsor.logo_url,
          dark_logo_url: sponsor.dark_logo_url,
          is_active: sponsor.is_active,
          type: sponsor.type,
          display_order: sponsor.display_order,
        });
      } else {
        setFormData({
          title: '',
          tagline: '',
          logo_url: null,
          dark_logo_url: null,
          is_active: true,
          type: null,
          display_order: null,
        });
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, sponsor]);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

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
      const schema = mode === 'add' ? createSponsorSchema : updateSponsorSchema;
      const validatedData = schema.parse(formData);

      if (mode === 'add') {
        hasStartedCreating.current = true;
      } else {
        hasStartedUpdating.current = true;
      }

      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
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

  const handleInputChange = (field: keyof (SponsorInsert | SponsorUpdate), value: string | boolean | number | null) => {
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
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add New Sponsor' : 'Edit Sponsor'}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="sponsor-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Sponsor' : 'Update Sponsor'}
          </Button>
        </div>
      }
    >
      <form id="sponsor-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="title">Sponsor Title *</Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter sponsor title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Tagline Field */}
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline *</Label>
          <Input
            id="tagline"
            type="text"
            value={formData.tagline}
            onChange={(e) => handleInputChange('tagline', e.target.value)}
            placeholder="Enter sponsor tagline"
            className={errors.tagline ? 'border-red-500' : ''}
          />
          {errors.tagline && (
            <p className="text-sm text-red-500">{errors.tagline}</p>
          )}
        </div>

        {/* Sponsor Type Field */}
        <div className="space-y-2">
          <Label htmlFor="type">Sponsor Type</Label>
          <Select
            value={formData.type || ''}
            onValueChange={(value) => handleInputChange('type', value || null)}
          >
            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select sponsor type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SPONSOR_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type}</p>
          )}
        </div>

        {/* Display Order Field */}
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            min={0}
            value={formData.display_order ?? ''}
            onChange={(e) => handleInputChange('display_order', e.target.value === '' ? null : parseInt(e.target.value, 10))}
            placeholder="e.g. 1, 2, 3..."
            className={errors.display_order ? 'border-red-500' : ''}
          />
          <p className="text-xs text-gray-500">
            Lower numbers appear first. Leave empty for default ordering.
          </p>
          {errors.display_order && (
            <p className="text-sm text-red-500">{errors.display_order}</p>
          )}
        </div>

        {/* Logo Upload Field */}
        <div className="space-y-2">
          <Label htmlFor="logo_url">Sponsor Logo</Label>
          <ImageUpload
            preset="SPONSOR_LOGO"
            currentImageUrl={formData.logo_url || undefined}
            onUpload={(url) => handleInputChange('logo_url', url)}
            onRemove={() => handleInputChange('logo_url', null)}
            placeholder="Upload sponsor logo"
            description="Upload a logo image for the sponsor. Recommended size: 600x300px or 2:1 aspect ratio."
            showPreview={true}
            showRemoveButton={true}
            error={errors.logo_url}
          />
          {errors.logo_url && (
            <p className="text-sm text-red-500">{errors.logo_url}</p>
          )}
        </div>

        {/* Dark Mode Logo Upload Field */}
        <div className="space-y-2">
          <Label htmlFor="dark_logo_url">Dark Mode Logo</Label>
          <ImageUpload
            preset="SPONSOR_LOGO"
            currentImageUrl={formData.dark_logo_url || undefined}
            onUpload={(url) => handleInputChange('dark_logo_url', url)}
            onRemove={() => handleInputChange('dark_logo_url', null)}
            placeholder="Upload dark mode logo"
            description="Optional logo variant for dark mode. Falls back to the main logo if not set."
            showPreview={true}
            showRemoveButton={true}
            error={errors.dark_logo_url}
          />
          {errors.dark_logo_url && (
            <p className="text-sm text-red-500">{errors.dark_logo_url}</p>
          )}
        </div>

        {/* Active Status Field */}
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleInputChange('is_active', checked)}
          />
          <Label htmlFor="is_active">Active Sponsor</Label>
        </div>
        <p className="text-xs text-gray-500">
          Active sponsors will be displayed on the website.
        </p>
      </form>
    </ModalLayout>
  );
}
