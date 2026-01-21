'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarIcon, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';

import { SeasonInsert, SeasonUpdate } from '@/lib/types/seasons';
import { Season } from '@/lib/types/seasons';
import { toast } from 'sonner';
import { createSeasonSchema, updateSeasonSchema } from '@/lib/validations/seasons';
import { z } from 'zod';

interface SeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  season?: Season;
  onSubmit: (data: SeasonInsert | SeasonUpdate) => Promise<void>;
  isSubmitting: boolean;
}

export function SeasonModal({
  open,
  onOpenChange,
  mode,
  season,
  onSubmit,
  isSubmitting
}: SeasonModalProps) {
  const [formData, setFormData] = useState<SeasonInsert | SeasonUpdate>({
    id: 1,
    start_at: new Date().toISOString().split('T')[0],
    end_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  } as SeasonInsert | SeasonUpdate);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track when mutations start to detect completion
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Memoize handleClose to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle modal open/close
  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Handle date changes
  const handleStartDateChange = useCallback((dateString: string) => {
    setFormData((prev) => ({
      ...prev,
      start_at: dateString
    }));
  }, []);

  const handleEndDateChange = useCallback((dateString: string) => {
    setFormData((prev) => ({
      ...prev,
      end_at: dateString
    }));
  }, []);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
             if (mode === 'edit' && season) {
         const editData = {
           id: season.id,
           start_at: season.start_at,
           end_at: season.end_at
         };
         setFormData(editData);
       } else {
         const now = new Date();
         const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
         const addData = {
           id: 1,
           start_at: now.toISOString().split('T')[0],
           end_at: tomorrow.toISOString().split('T')[0]
         };
         setFormData(addData);
       }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, season]);

  // Track when mutations start
  useEffect(() => {
    if (isSubmitting && mode === 'add' && !hasStartedCreating.current) {
      hasStartedCreating.current = true;
    }
    if (isSubmitting && mode === 'edit' && !hasStartedUpdating.current) {
      hasStartedUpdating.current = true;
    }
  }, [isSubmitting, mode]);

  // Handle successful mutations - only trigger when mutations complete
  useEffect(() => {
    // Check if create mutation just completed (was started and now finished)
    if (hasStartedCreating.current && !isSubmitting && mode === 'add') {
      hasStartedCreating.current = false;
      handleClose();
    }

    // Check if update mutation just completed (was started and now finished)
    if (hasStartedUpdating.current && !isSubmitting && mode === 'edit') {
      hasStartedUpdating.current = false;
      handleClose();
    }
  }, [isSubmitting, mode, handleClose]);

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createSeasonSchema : updateSeasonSchema;
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

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific database constraint errors
        if (
          error.message.includes('unique constraint') ||
          error.message.includes('duplicate key')
        ) {
                   if (error.message.toLowerCase().includes('id') || error.message.toLowerCase().includes('number')) {
           setErrors({
             id: 'Season number already exists. Please choose a different number.'
           });
         } else {
           setErrors({ general: error.message });
         }
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={handleModalOpenChange}
      title={mode === 'add' ? 'Add New Season' : 'Edit Season'}
      maxWidth="max-w-2xl"
      height="h-[500px]"
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
          <Button type="submit" form="season-form" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Season' : 'Update Season'}
          </Button>
        </div>
      }
    >
      <form id="season-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Season Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5" />
              Season Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="space-y-2">
               <label className="text-sm font-medium">Season Number *</label>
               <Input
                 type="number"
                 min="1"
                 value={formData.id}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                   setFormData((prev) => ({ ...prev, id: parseInt(e.target.value) || 1 }))
                 }
                 placeholder="Enter season number (must be unique)"
                 className={errors.id ? 'border-red-500' : ''}
               />
               {errors.id && <p className="text-sm text-red-500">{errors.id}</p>}
               <p className="text-muted-foreground text-xs">
                 Each season number must be unique across all seasons.
               </p>
             </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium px-1">
                Start Date *
              </label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_at || ''}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className={errors.start_at ? 'border-red-500' : ''}
                required
              />
              {errors.start_at && <p className="text-sm text-red-500">{errors.start_at}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium px-1">
                End Date *
              </label>
              <Input
                id="end-date"
                type="date"
                value={formData.end_at || ''}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className={errors.end_at ? 'border-red-500' : ''}
                required
              />
              {errors.end_at && <p className="text-sm text-red-500">{errors.end_at}</p>}
            </div>

            {errors.end_at && errors.end_at.includes('Start date must be before end date') && (
              <p className="text-sm text-red-500">Start date must be before end date</p>
            )}

            {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

            <p className="text-muted-foreground text-xs">
              The season will be automatically marked as active, upcoming, or completed based on
              these dates.
            </p>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
