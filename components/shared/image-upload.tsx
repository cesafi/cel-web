'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useCloudinary } from '@/hooks/use-cloudinary';
import { toast } from 'sonner';

// Upload presets for different use cases
export const UPLOAD_PRESETS = {
  VOLUNTEER: {
    folder: 'volunteers/images',
    maxWidth: 800,
    maxHeight: 800,
    aspectRatio: 1,
    quality: 'auto',
    format: 'auto',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  SCHOOL_LOGO: {
    folder: 'schools/logos',
    maxWidth: 400,
    maxHeight: 400,
    aspectRatio: 1,
    quality: 'auto',
    format: 'auto',
    maxFileSize: 2 * 1024 * 1024, // 2MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  },
  ARTICLE_COVER: {
    folder: 'articles/cover-images',
    maxWidth: 1200,
    maxHeight: 675,
    aspectRatio: 16 / 9,
    quality: 'auto',
    format: 'auto',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  TIMELINE: {
    folder: 'timeline/events',
    maxWidth: 1200,
    maxHeight: 800,
    aspectRatio: 3 / 2,
    quality: 'auto',
    format: 'auto',
    maxFileSize: 8 * 1024 * 1024, // 8MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  SPONSOR_LOGO: {
    folder: 'sponsors/logos',
    maxWidth: 600,
    maxHeight: 300,
    aspectRatio: 2,
    quality: 'auto',
    format: 'auto',
    maxFileSize: 3 * 1024 * 1024, // 3MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  },
  GENERAL: {
    folder: 'general',
    maxWidth: 1200,
    maxHeight: 800,
    aspectRatio: 16 / 9,
    quality: 'auto',
    format: 'auto',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
} as const;

export type UploadPreset = keyof typeof UPLOAD_PRESETS;

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onError?: (error: string) => void;
  onRemove?: () => void;
  className?: string;
  preset?: UploadPreset;
  customPreset?: Partial<typeof UPLOAD_PRESETS.GENERAL>;
  currentImageUrl?: string;
  showPreview?: boolean;
  showRemoveButton?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  required?: boolean;
  error?: string;
}

export function ImageUpload({
  onUpload,
  onUploadStart,
  onUploadEnd,
  onError,
  onRemove,
  className = '',
  preset = 'GENERAL',
  customPreset,
  currentImageUrl,
  showPreview = true,
  showRemoveButton = true,
  disabled = false,
  placeholder = 'Upload an image',
  description,
  required = false,
  error
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage, isUploading, uploadError } = useCloudinary();
  
  // Get the effective preset configuration
  const effectivePreset = useMemo(() => 
    customPreset ? { ...UPLOAD_PRESETS.GENERAL, ...customPreset } : UPLOAD_PRESETS[preset],
    [customPreset, preset]
  );
  
  const handleFileValidation = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > effectivePreset.maxFileSize) {
      return `File size must be less than ${Math.round(effectivePreset.maxFileSize / (1024 * 1024))}MB`;
    }
    
    // Check file type
    if (!effectivePreset.acceptedTypes.includes(file.type as any)) { // eslint-disable-line @typescript-eslint/no-explicit-any
      return `File type must be one of: ${effectivePreset.acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`;
    }
    
    return null;
  }, [effectivePreset]);

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = handleFileValidation(file);
    if (validationError) {
      toast.error(validationError);
      onError?.(validationError);
      return;
    }

    try {
      onUploadStart?.();
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const filename = `${sanitizedName.split('.')[0]}-${timestamp}`;
      
      const result = await uploadImage(file, {
        folder: effectivePreset.folder,
        public_id: filename,
        quality: effectivePreset.quality,
        format: effectivePreset.format
      });

      if (result.success && result.data) {
        onUpload(result.data.secure_url);
        setPreviewUrl(result.data.secure_url);
        toast.success('Image uploaded successfully');
      } else {
        const errorMsg = result.error || 'Upload failed';
        toast.error(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMsg);
      onError?.(errorMsg);
    } finally {
      onUploadEnd?.();
    }
  }, [handleFileValidation, uploadImage, effectivePreset, onUpload, onUploadStart, onUploadEnd, onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [disabled, handleFileUpload]);

  const handleRemove = useCallback(() => {
    setPreviewUrl('');
    onRemove?.();
  }, [onRemove]);

  const handleButtonClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const displayImageUrl = currentImageUrl || previewUrl;
  const isUploadingOrProcessing = isUploading;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Preview Section */}
        {showPreview && displayImageUrl && (
          <div className="space-y-3">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-border">
                <Image
                  src={displayImageUrl}
                  alt="Preview"
                  width={400}
                  height={Math.round(400 / effectivePreset.aspectRatio)}
                  className="w-full h-auto object-cover"
                />
                {showRemoveButton && !disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground truncate">
                  {displayImageUrl.split('/').pop()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!displayImageUrl && (
          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors duration-200 ${
              isDragOver
                ? 'border-primary bg-primary/10'
                : error
                ? 'border-red-500 hover:border-red-400'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <ImageIcon
                className={`h-12 w-12 mb-4 transition-colors duration-200 ${
                  isDragOver ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <div className="space-y-2">
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  isDragOver ? 'text-primary' : 'text-foreground'
                }`}>
                  {isDragOver ? 'Drop your image here' : placeholder}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isDragOver ? 'Release to upload' : 'Click to browse or drag and drop'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {displayImageUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={disabled || isUploadingOrProcessing}
            className="w-full"
          >
            {isUploadingOrProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {displayImageUrl ? 'Change Image' : 'Choose Image'}
              </>
            )}
          </Button>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={effectivePreset.acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Error Display */}
        {(error || uploadError) && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error || uploadError}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {/* Requirements */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Max size: {Math.round(effectivePreset.maxFileSize / (1024 * 1024))}MB
          </p>
          <p>
            Recommended: {effectivePreset.maxWidth}×{effectivePreset.maxHeight}px
            {effectivePreset.aspectRatio !== 16/9 && ` (${effectivePreset.aspectRatio}:1 ratio)`}
          </p>
          <p>
            Formats: {effectivePreset.acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
          </p>
          {required && <p className="text-red-500">* Required</p>}
        </div>
      </div>
    </Card>
  );
}
