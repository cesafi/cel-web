'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EsportCategoryWithEsport, Esport } from '@/lib/types/esports';
import { useAllEsports } from '@/hooks/use-esports';
import { createsportCategorySchema, updatesportCategorySchema } from '@/lib/validations/esports';
import { toast } from 'sonner';
import { ZodError } from 'zod';

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  category?: EsportCategoryWithEsport;
  preselectedEsportId?: number;
  onSubmit: (data: { esport_id: number; division: string; levels: string }) => void;
  isSubmitting: boolean;
}

const DIVISIONS = ["Men's", "Women's", "Mixed"];
const LEVELS = ['High School', 'College'];

export function CategoryModal({
  open,
  onOpenChange,
  mode,
  category,
  preselectedEsportId,
  onSubmit,
  isSubmitting
}: CategoryModalProps) {
  const [formData, setFormData] = useState({
    esport_id: 0,
    division: '',
    levels: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedSubmitting = useRef(false);

  const { data: esports = [] } = useAllEsports();

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        setFormData({
          esport_id: category.esport_id,
          division: category.division,
          levels: category.levels
        });
      } else {
        setFormData({
          esport_id: preselectedEsportId || 0,
          division: '',
          levels: ''
        });
      }
      setErrors({});
      hasStartedSubmitting.current = false;
    }
  }, [open, mode, category, preselectedEsportId]);

  useEffect(() => {
    if (hasStartedSubmitting.current && !isSubmitting) {
      handleClose();
    }
  }, [isSubmitting, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const schema = mode === 'add' ? createsportCategorySchema : updatesportCategorySchema;
      schema.parse(formData);

      hasStartedSubmitting.current = true;
      onSubmit(formData);
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

  const handleInputChange = (field: string, value: string | number) => {
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
      title={mode === 'add' ? 'Add Category' : 'Edit Category'}
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
            form="category-form" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </div>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Category Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Esport Selector */}
            <div className="space-y-2">
              <Label htmlFor="esport_id">Esport *</Label>
              <Select
                value={formData.esport_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('esport_id', parseInt(value))}
              >
                <SelectTrigger className={errors.esport_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select esport" />
                </SelectTrigger>
                <SelectContent>
                  {esports.map((esport: Esport) => (
                    <SelectItem key={esport.id} value={esport.id.toString()}>
                      {esport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.esport_id && <p className="text-sm text-red-500">{errors.esport_id}</p>}
            </div>

            {/* Division Selector */}
            <div className="space-y-2">
              <Label htmlFor="division">Division (Gender) *</Label>
              <Select
                value={formData.division}
                onValueChange={(value) => handleInputChange('division', value)}
              >
                <SelectTrigger className={errors.division ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((div) => (
                    <SelectItem key={div} value={div}>
                      {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.division && <p className="text-sm text-red-500">{errors.division}</p>}
            </div>

            {/* Level Selector */}
            <div className="space-y-2">
              <Label htmlFor="levels">Level (Education) *</Label>
              <Select
                value={formData.levels}
                onValueChange={(value) => handleInputChange('levels', value)}
              >
                <SelectTrigger className={errors.levels ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.levels && <p className="text-sm text-red-500">{errors.levels}</p>}
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
