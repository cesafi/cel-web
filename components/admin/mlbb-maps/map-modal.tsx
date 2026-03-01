'use client';

import { useState, useEffect } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';
import { MlbbMap, MlbbMapInsert, MlbbMapUpdate } from '@/lib/types/mlbb-maps';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  map?: MlbbMap;
  onSubmit: (data: MlbbMapInsert | MlbbMapUpdate) => void;
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
  const [formData, setFormData] = useState<Partial<MlbbMapInsert | MlbbMapUpdate>>({
    name: '',
    description: '',
    splash_image_url: '',
    is_active: true
  });
  const [activeTab, setActiveTab] = useState('upload');
  const [urlInput, setUrlInput] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && map) {
        setFormData({
          name: map.name,
          description: map.description || '',
          splash_image_url: map.splash_image_url,
          is_active: map.is_active
        });
        if (map.splash_image_url) {
          setUrlInput(map.splash_image_url);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          splash_image_url: '',
          is_active: true
        });
        setUrlInput('');
      }
      setActiveTab('upload');
    }
  }, [open, mode, map]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Map name is required');
      return;
    }

    // Determine the final image URL based on the active tab
    const finalImageUrl = activeTab === 'url' ? urlInput : formData.splash_image_url;

    onSubmit({
      ...formData,
      splash_image_url: finalImageUrl || null,
      description: formData.description || null
    } as MlbbMapInsert | MlbbMapUpdate);
  };

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, splash_image_url: url }));
    setUrlInput(url);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, splash_image_url: '' }));
    setUrlInput('');
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add New Map' : 'Edit Map'}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="map-form"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{mode === 'add' ? 'Adding...' : 'Saving...'}</span>
              </div>
            ) : (
              mode === 'add' ? 'Add Map' : 'Save Changes'
            )}
          </Button>
        </div>
      }
    >
      <form id="map-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Map Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Dangerous Grass"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Gimmick / Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the unique mechanics of this map..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Splash Image</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="url">Enter URL</TabsTrigger>
              </TabsList>
              <div className="mt-4 border rounded-md p-4">
                <TabsContent value="upload" className="mt-0">
                  <ImageUpload
                    onUpload={handleImageUploaded}
                    onRemove={handleRemoveImage}
                    currentImageUrl={activeTab === 'upload' ? (formData.splash_image_url || undefined) : undefined}
                    preset="VALORANT_MAP"
                    placeholder="Upload Splash Image"
                    description="Recommended: 16:9 aspect ratio webp format."
                  />
                </TabsContent>
                <TabsContent value="url" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setFormData(prev => ({ ...prev, splash_image_url: e.target.value }));
                      }}
                      placeholder="https://example.com/image.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a direct link to an image file. The image will be displayed directly from this URL.
                    </p>
                  </div>
                  {urlInput && (
                    <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlInput}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="active-status" className="text-base">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">
                Active maps will be available for map vetoes.
              </p>
            </div>
            <Switch
              id="active-status"
              checked={formData.is_active || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </div>
      </form>
    </ModalLayout>
  );
}
