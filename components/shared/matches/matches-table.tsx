'use client';

import { DataTable } from '@/components/table';
import { useMatchesTable } from '@/hooks/use-matches';
import {
  getMatchesTableColumns,
  getMatchesTableActions
} from '@/components/shared/matches';
import { MatchWithStageDetails } from '@/lib/types/matches';
import { MatchModal } from '@/components/shared/matches';
import { LeagueStageSelector } from '@/components/shared/matches';
import { MatchDeletionModal } from '@/components/shared/matches/match-deletion-modal';
import {
  MatchInsert,
  MatchUpdate
} from '@/lib/types/matches';
import { useRouter } from 'next/navigation';
import { useSeason } from '@/components/contexts/season-provider';
import { useState } from 'react';
import { toast } from 'sonner';
import { useMatchRefetch } from '@/hooks/use-matches';

interface MatchesTableProps {
  userRole: 'admin' | 'league_operator';
  showLeagueStageSelector?: boolean;
}

export function MatchesTable({ userRole, showLeagueStageSelector = true }: MatchesTableProps) {
  const { currentSeason } = useSeason();
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [selectedSportCategoryId, setSelectedSportCategoryId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMatch, setEditingMatch] = useState<MatchWithStageDetails | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<MatchWithStageDetails | undefined>();
  const router = useRouter();
  const { refetchAllMatchData } = useMatchRefetch();

  const {
    matches,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    createMatch,
    updateMatch,
    deleteMatch,
    isCreating,
    isUpdating,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange,
    refetch
  } = useMatchesTable(selectedStageId);

  // Show message when no season is selected
  if (!currentSeason) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">No Season Selected</h2>
            <p className="text-muted-foreground">Please select a season from the season switcher to view matches.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleViewMatchDetails = (match: MatchWithStageDetails) => {
    const basePath = userRole === 'admin' ? '/admin/matches' : '/league-operator/matches';
    router.push(`${basePath}/${match.id}`);
  }

  const handleEditMatch = (match: MatchWithStageDetails) => {
    setEditingMatch(match);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteMatch = (match: MatchWithStageDetails) => {
    setMatchToDelete(match);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;

    try {
      deleteMatch(matchToDelete.id);
      setIsDeleteModalOpen(false);
      setMatchToDelete(undefined);
      
      // Force comprehensive refetch after deletion
      setTimeout(() => {
        refetchAllMatchData();
      }, 500); // Small delay to ensure server-side revalidation completes
    } catch {
      setIsDeleteModalOpen(false);
      setMatchToDelete(undefined);
    }
  };

  const handleSubmit = async (data: MatchInsert | MatchUpdate, participantTeamIds?: string[]) => {
    if (modalMode === 'add') {
      // For add mode, we need to handle participants
      createMatch(data as MatchInsert, participantTeamIds);
    } else {
      updateMatch(data as MatchUpdate);
    }
  };

  const columns = getMatchesTableColumns();
  const actions = getMatchesTableActions(handleEditMatch, handleDeleteMatch, handleViewMatchDetails);

  // Show loading state while waiting for initial data
  if (!selectedStageId) {
    return (
      <div className="w-full space-y-6">
        {showLeagueStageSelector && (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Select League Stage</h2>
            <LeagueStageSelector
              selectedSportId={selectedSportId}
              selectedCategoryId={selectedSportCategoryId}
              selectedStageId={selectedStageId}
              onSportChange={setSelectedSportId}
              onCategoryChange={setSelectedSportCategoryId}
              onStageChange={setSelectedStageId}
              className="max-w-2xl"
            />
          </div>
        )}

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Waiting for league stage selection...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please select a sport, category, and stage above
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* League Stage Selector */}
      {showLeagueStageSelector && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Select League Stage</h2>
          <LeagueStageSelector
            selectedSportId={selectedSportId}
            selectedCategoryId={selectedSportCategoryId}
            selectedStageId={selectedStageId}
            onSportChange={setSelectedSportId}
            onCategoryChange={setSelectedSportCategoryId}
            onStageChange={setSelectedStageId}
            className="max-w-2xl"
          />
        </div>
      )}

      {/* Matches Table */}
      <DataTable
        data={matches}
        totalCount={totalCount}
        loading={loading}
        tableBodyLoading={tableBodyLoading}
        error={error}
        columns={columns}
        actions={actions}
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        title="Matches Management"
        subtitle={`Managing matches for the selected league stage. Currently showing ${matches.length} matches.`}
        searchPlaceholder="Search matches..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Match',
          onClick: () => {
            if (!selectedStageId) {
              toast.error('Please select a league stage first before adding a match.');
              return;
            }
            setModalMode('add');
            setEditingMatch(undefined);
            setIsModalOpen(true);
          }
        }}
        className=""
        emptyMessage="No matches found for the selected league stage"
        refetch={refetch}
      />

      {/* Match Modal */}
      <MatchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        match={editingMatch}
        selectedStageId={selectedStageId}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Enhanced Deletion Modal */}
      <MatchDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMatchToDelete(undefined);
        }}
        onConfirm={confirmDeleteMatch}
        match={matchToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
