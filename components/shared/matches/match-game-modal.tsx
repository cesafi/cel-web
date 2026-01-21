'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GameWithDetails, GameInsert, GameUpdate } from '@/lib/types/games';
import { ZodError } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  game?: GameWithDetails;
  matchId: number;
  onSubmit: (data: GameInsert | GameUpdate) => Promise<void>;
  isSubmitting: boolean;
}

export function MatchGameModal({
  open,
  onOpenChange,
  mode,
  game,
  matchId,
  onSubmit,
  isSubmitting
}: MatchGameModalProps) {
  const [formData, setFormData] = useState<GameInsert | GameUpdate>(() => {
    if (mode === 'edit' && game) {
      return {
        id: game.id,
        match_id: game.match_id,
        game_number: game.game_number,
        duration: game.duration,
        start_at: game.start_at,
        end_at: game.end_at
      } as GameUpdate;
    } else {
      return {
        match_id: matchId,
        game_number: 1,
        duration: '00:00:00',
        start_at: null,
        end_at: null
      } as GameInsert;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Form reset on modal open/close
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && game) {
        setFormData({
          id: game.id,
          match_id: game.match_id,
          game_number: game.game_number,
          duration: game.duration,
          start_at: game.start_at,
          end_at: game.end_at
        } as GameUpdate);
      } else {
        setFormData({
          match_id: matchId,
          game_number: 1,
          duration: '00:00:00',
          start_at: null,
          end_at: null
        } as GameInsert);
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, game, matchId]);

  const handleDateChange = (field: 'start_at', value: string) => {
    const dateValue = value ? new Date(value).toISOString() : null;
    setFormData(prev => ({ ...prev, [field]: dateValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Basic validation
      if (!formData.game_number || formData.game_number < 1) {
        setErrors({ game_number: 'Game number must be at least 1' });
        return;
      }

      if (mode === 'add') {
        hasStartedCreating.current = true;
      } else {
        hasStartedUpdating.current = true;
      }

      await onSubmit(formData);
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

  const handleGameNumberChange = (value: string) => {
    setFormData(prev => ({ ...prev, game_number: parseInt(value) || 1 }));
  };

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onOpenChange(false);
  }, [isSubmitting, onOpenChange]);

  return (
    <ModalLayout
      open={open}
      onOpenChange={handleClose}
      title={mode === 'add' ? 'Add New Game' : 'Edit Game'}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="game-form"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{mode === 'add' ? 'Creating...' : 'Updating...'}</span>
              </div>
            ) : (
              mode === 'add' ? 'Create Game' : 'Update Game'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {mode === 'add' ? 'Create a new game for this match' : 'Update game information'}
        </p>
        
        <form id="game-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Game Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Game Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Game Number */}
              <div className="space-y-2">
                <Label htmlFor="gameNumber">Game Number *</Label>
                <Select 
                  value={formData.game_number?.toString()} 
                  onValueChange={handleGameNumberChange}
                >
                  <SelectTrigger className={errors.game_number ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select game number" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Game {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.game_number && (
                  <p className="text-sm text-red-500">{errors.game_number}</p>
                )}
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="startAt">Start Time</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.start_at ? new Date(formData.start_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleDateChange('start_at', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  When the game actually started (optional)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Note */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> You can set the start time now or edit it later. End time and duration can be added when editing the game after it&apos;s created.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ModalLayout>
  );
}