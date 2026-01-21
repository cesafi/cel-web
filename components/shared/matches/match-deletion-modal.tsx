'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { getMatchDeletionPreview } from '@/actions/matches';
import { MatchWithStageDetails } from '@/lib/types/matches';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

interface MatchDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  match: MatchWithStageDetails | undefined;
  isDeleting: boolean;
  onDeleted?: () => void;
}

export function MatchDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  match,
  isDeleting,
  onDeleted: _onDeleted
}: MatchDeletionModalProps) {
  const [preview, setPreview] = useState<{
    gamesCount: number;
    gameScoresCount: number;
    participantsCount: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadDeletionPreview = useCallback(async () => {
    if (!match) return;

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const result = await getMatchDeletionPreview(match.id);
      if (result.success) {
        setPreview({
          gamesCount: result.data.gamesCount,
          gameScoresCount: result.data.gameScoresCount,
          participantsCount: result.data.participantsCount
        });
      } else {
        setPreviewError(result.error || 'Failed to load deletion preview');
      }
    } catch (_error) {
      setPreviewError('An unexpected error occurred while loading preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [match]);

  useEffect(() => {
    if (isOpen && match) {
      loadDeletionPreview();
    } else {
      setPreview(null);
      setPreviewError(null);
    }
  }, [isOpen, match, loadDeletionPreview]);

  const renderPreviewContent = () => {
    if (isLoadingPreview) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading deletion preview...</span>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="text-sm bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
          <p className="font-medium text-red-800 dark:text-red-200">Error loading preview</p>
          <p className="text-red-700 dark:text-red-300 mt-1">{previewError}</p>
        </div>
      );
    }

    if (!preview) {
      return null;
    }

    const totalItems = preview.gamesCount + preview.gameScoresCount + preview.participantsCount + 1; // +1 for the match itself

    return (
      <div className="space-y-3">
        <p>Are you sure you want to delete the match <strong>&ldquo;{match?.name}&rdquo;</strong>?</p>
        
        <div className="text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
            <p className="font-medium text-amber-800 dark:text-amber-200">Cascade Deletion Active</p>
          </div>
          <p className="text-amber-700 dark:text-amber-300 mb-3">
            This will permanently delete <strong>{totalItems} items</strong> from the database:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-700">
              <div className="text-lg font-bold text-amber-800 dark:text-amber-200">{preview.gamesCount}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Games</div>
            </div>
            <div className="bg-white dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-700">
              <div className="text-lg font-bold text-amber-800 dark:text-amber-200">{preview.gameScoresCount}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Game Scores</div>
            </div>
            <div className="bg-white dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-700">
              <div className="text-lg font-bold text-amber-800 dark:text-amber-200">{preview.participantsCount}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Participants</div>
            </div>
            <div className="bg-white dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-700">
              <div className="text-lg font-bold text-amber-800 dark:text-amber-200">1</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Match</div>
            </div>
          </div>
        </div>

        <div className="text-sm bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
            <p className="font-medium text-red-800 dark:text-red-200">This action cannot be undone!</p>
          </div>
          <p className="text-red-700 dark:text-red-300">
            All match data will be permanently removed from the system.
          </p>
        </div>
      </div>
    );
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="delete"
      title="Delete Match & All Related Data"
      message={renderPreviewContent()}
      confirmText={preview ? `Delete ${preview.gamesCount + preview.gameScoresCount + preview.participantsCount + 1} Items` : "Delete Match"}
      cancelText="Cancel"
      destructive={true}
      isLoading={isDeleting}
      disabled={isLoadingPreview || !!previewError}
    />
  );
}