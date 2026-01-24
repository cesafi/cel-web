'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { ImageUpload } from '@/components/shared/image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timeline, TimelineInsert, TimelineUpdate } from '@/lib/types/timeline';
import { createTimelineSchema, updateTimelineSchema } from '@/lib/validations/timeline';
import { toast } from 'sonner';
import { ZodError } from 'zod';

interface TimelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  entry?: Timeline;
  onSubmit: (data: TimelineInsert | TimelineUpdate) => void;
  isSubmitting: boolean;
}

const CATEGORIES = [
  { value: 'founding', label: 'Founding' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'award', label: 'Award' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'achievement', label: 'Achievement' }
];

export function TimelineModal({
  open,
  onOpenChange,
  mode,
  entry,
  onSubmit,
  isSubmitting
}: TimelineModalProps) {
  const [formData, setFormData] = useState<TimelineInsert | TimelineUpdate>({
    title: '',
    description: '',
    year: '',
    category: 'milestone',
    image_url: '',
    is_highlight: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedSubmitting = useRef(false);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && entry) {
        setFormData({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          year: entry.year,
          category: entry.category as TimelineInsert['category'],
          image_url: entry.image_url || '',
          is_highlight: entry.is_highlight
        });
      } else {
        setFormData({
          title: '',
          description: '',
          year: '',
          category: 'milestone',
          image_url: '',
          is_highlight: false
        });
      }
      setErrors({});
      hasStartedSubmitting.current = false;
    }
  }, [open, mode, entry]);

  useEffect(() => {
    if (hasStartedSubmitting.current && !isSubmitting) {
      handleClose();
    }
  }, [isSubmitting, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const schema = mode === 'add' ? createTimelineSchema : updateTimelineSchema;
      const validatedData = schema.parse(formData);

      hasStartedSubmitting.current = true;
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

  const handleInputChange = (field: string, value: string | boolean) => {
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
      title={mode === 'add' ? 'Add Timeline Event' : 'Edit Timeline Event'}
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
            form="timeline-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Event' : 'Update Event'}
          </Button>
        </div>
      }
    >
      <form id="timeline-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the event"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Year and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  value={formData.year || ''}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="e.g., 2001, 2025+"
                  className={errors.year ? 'border-red-500' : ''}
                />
                {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Event Image *</Label>
              <ImageUpload
                preset="TIMELINE"
                currentImageUrl={formData.image_url || undefined}
                onUpload={(url) => handleInputChange('image_url', url)}
                onRemove={() => handleInputChange('image_url', '')}
                placeholder="Upload event image"
                description="Upload an image for this timeline event. Recommended: 800x600px."
                showPreview={true}
                showRemoveButton={true}
                error={errors.image_url}
              />
              {errors.image_url && <p className="text-sm text-red-500">{errors.image_url}</p>}
            </div>

            {/* Highlight Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_highlight"
                checked={formData.is_highlight ?? false}
                onCheckedChange={(checked) => handleInputChange('is_highlight', checked)}
              />
              <Label htmlFor="is_highlight">Mark as Highlight</Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
