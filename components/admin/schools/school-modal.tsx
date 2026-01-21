'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { School, SchoolInsert, SchoolUpdate } from '@/lib/types/schools';
import { createSchoolSchema, updateSchoolSchema } from '@/lib/validations/schools';
import { z } from 'zod';
import { Building2, Image as ImageIcon, Power, Upload, X, Loader2 } from 'lucide-react';
import { useCloudinary } from '@/hooks/use-cloudinary';

interface SchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  school?: School;
  onSubmit: (data: SchoolInsert | SchoolUpdate) => Promise<void>;
  isSubmitting: boolean;
  onSuccess?: () => void; // Callback to trigger refetch
}

export function SchoolModal({
  open,
  onOpenChange,
  mode,
  school,
  onSubmit,
  isSubmitting,
  onSuccess
}: SchoolModalProps) {
  const [formData, setFormData] = useState<SchoolInsert | SchoolUpdate>({
    name: '',
    abbreviation: '',
    logo_url: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [oldLogoUrl, setOldLogoUrl] = useState<string | null>(null); // Track old logo for cleanup

  // Track when mutations start to detect completion
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Cloudinary hook
  const { uploadImage, deleteImage, isUploading } = useCloudinary();

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && school) {
        const editData: SchoolUpdate = {
          id: school.id, // Include the ID for updates
          name: school.name || '',
          abbreviation: school.abbreviation || '',
          logo_url: school.logo_url || '',
          is_active: school.is_active ?? true
        };
        setFormData(editData);
        setOldLogoUrl(school.logo_url); // Track the original logo for cleanup
      } else {
        const addData: SchoolInsert = {
          name: '',
          abbreviation: '',
          logo_url: '',
          is_active: true
        };
        setFormData(addData);
        setOldLogoUrl(null);
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, school]);

  // Track when mutations start
  useEffect(() => {
    if (isSubmitting && mode === 'add' && !hasStartedCreating.current) {
      hasStartedCreating.current = true;
    }
    if (isSubmitting && mode === 'edit' && !hasStartedUpdating.current) {
      hasStartedUpdating.current = true;
    }
  }, [isSubmitting, mode]);

  const cleanupOldImage = useCallback(async (imageUrl: string) => {
    try {
      // Extract public_id from the URL for deletion
      const url = imageUrl;
      // Match the full path after /upload/ or /upload/vX_Y_Z/ and remove extension
      const publicIdMatch = url.match(/\/upload\/(?:v\d+_\d+_\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)$/i);

      if (publicIdMatch) {
        const publicId = publicIdMatch[1]; // This includes the full folder path without extension

        await deleteImage(publicId);
        console.log('Old logo cleaned up successfully:', publicId);
      }
    } catch (error) {
      // Don't block the process if cleanup fails
      console.warn('Failed to cleanup old logo from Cloudinary:', error);
    }
  }, [deleteImage]);

  // Handle successful mutations - only trigger when mutations complete
  useEffect(() => {
    // Check if create mutation just completed (was started and now finished)
    if (hasStartedCreating.current && !isSubmitting && mode === 'add') {
      hasStartedCreating.current = false;
      onSuccess?.();
      handleClose();
    }

    // Check if update mutation just completed (was started and now finished)
    if (hasStartedUpdating.current && !isSubmitting && mode === 'edit') {
      hasStartedUpdating.current = false;

      // Clean up old logo if a new one was uploaded
      if (oldLogoUrl && formData.logo_url && oldLogoUrl !== formData.logo_url) {
        cleanupOldImage(oldLogoUrl);
      }

      onSuccess?.();
      handleClose();
    }
  }, [isSubmitting, mode, onSuccess, handleClose, oldLogoUrl, formData.logo_url, deleteImage, cleanupOldImage]);

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createSchoolSchema : updateSchoolSchema;
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };


  const handleInputChange = (field: string, value: string | boolean | null) => {
    setFormData((prev: SchoolInsert | SchoolUpdate) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = async (file: File) => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      // Generate a unique filename for the school logo
      const schoolName = formData.name || 'school';
      const sanitizedName = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const publicId = `schools/logos/${sanitizedName}-${Date.now()}`;

      // Upload to Cloudinary
      const result = await uploadImage(file, {
        folder: 'schools/logos',
        public_id: publicId
      });

      if (result.success && result.data) {
        // If updating and there was an old logo, mark it for cleanup after successful save
        if (mode === 'edit' && oldLogoUrl && oldLogoUrl !== result.data.secure_url) {
          // We'll cleanup the old image after the school update is successful
          // This will be handled in the submission success logic
        }

        handleInputChange('logo_url', result.data.secure_url);
        toast.success('Logo uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    }
  };

  const removeLogo = async () => {
    // If there's a current logo, we should delete it from Cloudinary
    if (formData.logo_url) {
      try {
        // Extract public_id from the URL for deletion
        const url = formData.logo_url;
        // Match the full path after /upload/ or /upload/vX_Y_Z/ and remove extension
        const publicIdMatch = url.match(/\/upload\/(?:v\d+_\d+_\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)$/i);

        if (publicIdMatch) {
          const publicId = publicIdMatch[1]; // This includes the full folder path without extension

          await deleteImage(publicId);
        }
      } catch (error) {
        // Don't block the UI removal if deletion fails
        console.warn('Failed to delete image from Cloudinary:', error);
      }
    }
    
    handleInputChange('logo_url', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleLogoUpload(file);
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add New School' : 'Edit School'}
      maxWidth="max-w-2xl"
      height="h-[700px]"
      footer={
        <div className="flex gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create School' : 'Update School'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter school name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation *</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                placeholder="e.g., USC, CIT-U"
                className={errors.abbreviation ? 'border-red-500' : ''}
              />
              {errors.abbreviation && <p className="text-sm text-red-500">{errors.abbreviation}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5" />
              School Logo *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.logo_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-dashed border-border">
                    {formData.logo_url && (
                      <Image
                        src={formData.logo_url}
                        alt="School logo"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-muted-foreground truncate text-xs">{formData.logo_url}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    className="text-red-600 hover:border-red-300 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Change Logo
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={`h-32 w-full rounded-lg border-2 border-dashed transition-colors duration-200 ${
                    isDragOver
                      ? 'border-primary bg-primary/10'
                      : errors.logo_url
                      ? 'border-red-500 hover:border-red-400'
                      : 'border-border hover:border-muted-foreground'
                  } flex flex-col items-center justify-center`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <ImageIcon
                    className={`mb-2 h-8 w-8 transition-colors duration-200 ${
                      isDragOver ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <p
                    className={`mb-2 text-sm transition-colors duration-200 ${
                      isDragOver ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {isDragOver ? 'Drop your logo here' : 'Upload school logo'}
                  </p>
                  <p className="text-center text-xs text-muted-foreground">PNG, JPG, or WebP up to 5MB</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleLogoUpload(file);
                }
              }}
            />

            {errors.logo_url && <p className="text-sm text-red-500">{errors.logo_url}</p>}
            <p className="text-muted-foreground text-xs">
              Logo will be automatically optimized and stored in the cloud. Recommended size:
              200x200px or larger.
            </p>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active School</Label>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Active schools are visible in the system and can participate in events.
            </p>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
