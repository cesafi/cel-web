'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { ImageUpload } from '@/components/shared/image-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValorantMap, ValorantMapInsert, ValorantMapUpdate } from '@/lib/types/valorant-maps';
import { toast } from 'sonner';
import { Map, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  map?: ValorantMap;
  onSubmit: (data: ValorantMapInsert | ValorantMapUpdate) => void;
  isSubmitting: boolean;
}

export function MapModal({
  open,
  onOpenChange,
  mode,
  map,
  onSubmit,
  isSubmitting
}: MapModalProps) {
  const [formData, setFormData] = useState<ValorantMapInsert | ValorantMapUpdate>({
    name: '',
    splash_image_url: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedSubmitting = useRef(false);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && map) {
        setFormData({
          id: map.id,
          name: map.name,
          splash_image_url: map.splash_image_url || '',
          is_active: map.is_active
        });
      } else {
        setFormData({
          name: '',
          splash_image_url: '',
          is_active: true
        });
      }
      setErrors({});
      hasStartedSubmitting.current = false;
    }
  }, [open, mode, map]);

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

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
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
      title={mode === 'add' ? 'Add Map' : 'Edit Map'}
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
            form="map-form"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Map' : 'Update Map'}
          </Button>
        </div>
      }
    >
      <form id="map-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5" />
              Map Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Splash Image Upload or URL */}
            <div className="space-y-4">
              <Label>Map Image/Splash</Label>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  <TabsTrigger value="url">Enter URL</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <ImageUpload
                    preset="VALORANT_MAP"
                    currentImageUrl={formData.splash_image_url || undefined}
                    onUpload={(url) => handleInputChange('splash_image_url', url)}
                    onRemove={() => handleInputChange('splash_image_url', '')}
                    placeholder="Upload map image"
                    description="Upload a landscape image (recommended: 1920x1080px)"
                    showPreview={true}
                    showRemoveButton={true}
                  />
                </TabsContent>

                <TabsContent value="url" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="splash_image_url" className="text-sm text-muted-foreground">
                      Image URL
                    </Label>
                    <Input
                      id="splash_image_url"
                      type="url"
                      placeholder="https://example.com/map.png"
                      value={formData.splash_image_url || ''}
                      onChange={(e) => handleInputChange('splash_image_url', e.target.value)}
                    />
                  </div>
                  {formData.splash_image_url && typeof formData.splash_image_url === 'string' && formData.splash_image_url.startsWith('http') && (
                    <div className="flex flex-col items-center gap-2 mt-4">
                      <span className="text-sm font-medium text-muted-foreground self-start">Preview:</span>
                      <img
                        src={formData.splash_image_url}
                        alt="Map preview"
                        className="w-full h-32 object-cover rounded-md border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter map name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Is Active Toggle */}
            <div className="flex items-center justify-between space-x-2 pt-2">
              <Label htmlFor="is-active" className="flex flex-col space-y-1">
                <span>Active Status</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Allow this map to be played in matches.
                </span>
              </Label>
              <Switch
                id="is-active"
                checked={!!formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
