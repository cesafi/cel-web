'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { createFaqSchema, CreateFaqInput } from '@/lib/validations/faq';
import { Faq } from '@/lib/types/faq';
import { useCreateFaq, useUpdateFaq } from '@/hooks/use-faq';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FaqFormDialogProps {
  faq?: Faq;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqFormDialog({ faq, open, onOpenChange }: FaqFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!faq;

  const createMutation = useCreateFaq();
  const updateMutation = useUpdateFaq();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateFaqInput>({
    resolver: zodResolver(createFaqSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      question: '',
      answer: '',
      is_open: false,
      display_order: 0,
      is_active: true,
      category: 'General',
      is_highlight: false,
    },
  });

  const isOpen = watch('is_open');
  const isActive = watch('is_active');
  const isHighlight = watch('is_highlight');

  // Reset form when dialog opens/closes or faq changes
  useEffect(() => {
    if (open) {
      if (faq) {
        reset({
          question: faq.question,
          answer: faq.answer,
          is_open: faq.is_open,
          display_order: faq.display_order,
          is_active: faq.is_active,
          category: faq.category || 'General',
          is_highlight: faq.is_highlight || false,
        });
      } else {
        reset({
          question: '',
          answer: '',
          is_open: false,
          display_order: 0,
          is_active: true,
          category: 'General',
          is_highlight: false,
        });
      }
    }
  }, [open, faq, reset]);

  const onSubmit = async (data: CreateFaqInput) => {
    setIsSubmitting(true);
    try {
      if (isEditing && faq) {
        await updateMutation.mutateAsync({
          id: faq.id,
          data,
        });
        toast.success('FAQ item updated successfully');
      } else {
        await createMutation.mutateAsync(data as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        toast.success('FAQ item created successfully');
      }
      onOpenChange(false);
    } catch (_error) {
      toast.error(isEditing ? 'Failed to update FAQ item' : 'Failed to create FAQ item');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit FAQ Item' : 'Create FAQ Item'}
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
          <Button type="submit" disabled={isSubmitting} form="faq-form">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update' : 'Create'} FAQ Item
          </Button>
        </div>
      }
    >
      <form
        id="faq-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
          <div className="space-y-4">
            {/* Question */}
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                {...register('question')}
                placeholder="Enter the FAQ question..."
                className={errors.question ? 'border-destructive' : ''}
              />
              {errors.question && (
                <p className="text-sm text-destructive">{errors.question.message}</p>
              )}
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                {...register('answer')}
                placeholder="Enter the FAQ answer..."
                rows={4}
                className={errors.answer ? 'border-destructive' : ''}
              />
              {errors.answer && (
                <p className="text-sm text-destructive">{errors.answer.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="Enter category (e.g., General, Sports, Schools)"
                className={errors.category ? 'border-destructive' : ''}
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order *</Label>
              <Input
                id="display_order"
                type="number"
                {...register('display_order', { valueAsNumber: true })}
                placeholder="Enter display order (0 = first)"
                className={errors.display_order ? 'border-destructive' : ''}
              />
              {errors.display_order && (
                <p className="text-sm text-destructive">{errors.display_order.message}</p>
              )}
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_open"
                  checked={isOpen}
                  onCheckedChange={(checked) => setValue('is_open', checked)}
                />
                <Label htmlFor="is_open">Default Open</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_highlight"
                  checked={isHighlight}
                  onCheckedChange={(checked) => setValue('is_highlight', checked)}
                />
                <Label htmlFor="is_highlight">Highlight on Landing</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>
      </form>
    </ModalLayout>
  );
}
