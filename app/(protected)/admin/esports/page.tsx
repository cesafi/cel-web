'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useEsportsTable, useCategoriesTable } from '@/hooks/use-esports';
import { 
  getEsportsTableColumns, 
  getEsportsTableActions,
  getCategoriesTableColumns,
  getCategoriesTableActions,
  EsportModal,
  CategoryModal
} from '@/components/admin/esports';
import { Esport, EsportInsert, EsportUpdate, EsportCategoryWithEsport } from '@/lib/types/esports';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Layers } from 'lucide-react';

export default function EsportsManagementPage() {
  // Esports state
  const [isEsportModalOpen, setIsEsportModalOpen] = useState(false);
  const [esportModalMode, setEsportModalMode] = useState<'add' | 'edit'>('add');
  const [editingEsport, setEditingEsport] = useState<Esport | undefined>();
  const [isEsportDeleteModalOpen, setIsEsportDeleteModalOpen] = useState(false);
  const [esportToDelete, setEsportToDelete] = useState<Esport | undefined>();

  // Categories state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add');
  const [editingCategory, setEditingCategory] = useState<EsportCategoryWithEsport | undefined>();
  const [preselectedEsportId, setPreselectedEsportId] = useState<number | undefined>();
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<EsportCategoryWithEsport | undefined>();

  // Pagination state
  const [esportsPage, setEsportsPage] = useState(1);
  const [esportsPageSize, setEsportsPageSize] = useState(10);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [categoriesPageSize, setCategoriesPageSize] = useState(10);

  const {
    esports,
    loading: esportsLoading,
    error: esportsError,
    refetch: refetchEsports,
    createEsport,
    updateEsport,
    deleteEsport,
    isCreating: isCreatingEsport,
    isUpdating: isUpdatingEsport,
    isDeleting: isDeletingEsport
  } = useEsportsTable();

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating: isCreatingCategory,
    isUpdating: isUpdatingCategory,
    isDeleting: isDeletingCategory
  } = useCategoriesTable();

  // Pagination calculation for esports
  const esportsTotalCount = esports.length;
  const esportsPageCount = Math.ceil(esportsTotalCount / esportsPageSize);
  const esportsOffset = (esportsPage - 1) * esportsPageSize;
  const paginatedEsports = esports.slice(esportsOffset, esportsOffset + esportsPageSize);

  // Pagination calculation for categories
  const categoriesTotalCount = categories.length;
  const categoriesPageCount = Math.ceil(categoriesTotalCount / categoriesPageSize);
  const categoriesOffset = (categoriesPage - 1) * categoriesPageSize;
  const paginatedCategories = categories.slice(categoriesOffset, categoriesOffset + categoriesPageSize);

  // Esports handlers
  const handleEditEsport = (esport: Esport) => {
    setEditingEsport(esport);
    setEsportModalMode('edit');
    setIsEsportModalOpen(true);
  };

  const handleDeleteEsport = (esport: Esport) => {
    setEsportToDelete(esport);
    setIsEsportDeleteModalOpen(true);
  };

  const confirmDeleteEsport = async () => {
    if (!esportToDelete) return;
    deleteEsport(esportToDelete.id);
    setIsEsportDeleteModalOpen(false);
    setEsportToDelete(undefined);
  };

  const handleEsportSubmit = (data: EsportInsert | EsportUpdate) => {
    if (esportModalMode === 'add') {
      createEsport(data as EsportInsert);
    } else if (editingEsport) {
      updateEsport({ id: editingEsport.id, data: data as EsportUpdate });
    }
    setIsEsportModalOpen(false);
  };

  // Category handlers
  const handleAddCategory = (esportId?: number) => {
    setPreselectedEsportId(esportId);
    setEditingCategory(undefined);
    setCategoryModalMode('add');
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: EsportCategoryWithEsport) => {
    setEditingCategory(category);
    setCategoryModalMode('edit');
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: EsportCategoryWithEsport) => {
    setCategoryToDelete(category);
    setIsCategoryDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete.id);
    setIsCategoryDeleteModalOpen(false);
    setCategoryToDelete(undefined);
  };

  const handleCategorySubmit = (data: { esport_id: number; division: string; levels: string }) => {
    if (categoryModalMode === 'add') {
      createCategory(data);
    } else if (editingCategory) {
      updateCategory({ id: editingCategory.id, data });
    }
    setIsCategoryModalOpen(false);
  };

  const esportColumns = getEsportsTableColumns();
  const esportActions = getEsportsTableActions(handleEditEsport, handleDeleteEsport);
  const categoryColumns = getCategoriesTableColumns();
  const categoryActions = getCategoriesTableActions(handleEditCategory, handleDeleteCategory);

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="esports" className="w-full">
        <TabsList>
          <TabsTrigger value="esports" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Esports
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="esports" className="mt-6">
          <DataTable
            data={paginatedEsports}
            totalCount={esportsTotalCount}
            loading={esportsLoading}
            tableBodyLoading={false}
            error={esportsError}
            columns={esportColumns}
            actions={esportActions}
            currentPage={esportsPage}
            pageCount={esportsPageCount}
            pageSize={esportsPageSize}
            onPageChange={setEsportsPage}
            onPageSizeChange={setEsportsPageSize}
            onSortChange={() => {}}
            onSearchChange={() => {}}
            onFiltersChange={() => {}}
            title="Esports Management"
            subtitle="Manage the esports titles available in the CESAFI Esports League."
            searchPlaceholder="Search esports..."
            showSearch={true}
            showFilters={false}
            addButton={{
              label: 'Add Esport',
              onClick: () => {
                setEsportModalMode('add');
                setEditingEsport(undefined);
                setIsEsportModalOpen(true);
              }
            }}
            emptyMessage="No esports found"
            refetch={refetchEsports}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <DataTable
            data={paginatedCategories}
            totalCount={categoriesTotalCount}
            loading={categoriesLoading}
            tableBodyLoading={false}
            error={categoriesError}
            columns={categoryColumns}
            actions={categoryActions}
            currentPage={categoriesPage}
            pageCount={categoriesPageCount}
            pageSize={categoriesPageSize}
            onPageChange={setCategoriesPage}
            onPageSizeChange={setCategoriesPageSize}
            onSortChange={() => {}}
            onSearchChange={() => {}}
            onFiltersChange={() => {}}
            title="Categories Management"
            subtitle="Manage divisions (Men's, Women's) and levels (High School, College) for each esport."
            searchPlaceholder="Search categories..."
            showSearch={true}
            showFilters={false}
            addButton={{
              label: 'Add Category',
              onClick: () => {
                setCategoryModalMode('add');
                setEditingCategory(undefined);
                setIsCategoryModalOpen(true);
              }
            }}
            emptyMessage="No categories found. Add an esport first, then create categories."
            refetch={refetchCategories}
          />
        </TabsContent>
      </Tabs>

      {/* Esport Modal */}
      <EsportModal
        open={isEsportModalOpen}
        onOpenChange={setIsEsportModalOpen}
        mode={esportModalMode}
        esport={editingEsport}
        onSubmit={handleEsportSubmit}
        isSubmitting={isCreatingEsport || isUpdatingEsport}
      />

      {/* Category Modal */}
      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        mode={categoryModalMode}
        category={editingCategory}
        preselectedEsportId={preselectedEsportId}
        onSubmit={handleCategorySubmit}
        isSubmitting={isCreatingCategory || isUpdatingCategory}
      />

      {/* Delete Esport Confirmation */}
      <ConfirmationModal
        isOpen={isEsportDeleteModalOpen}
        onClose={() => setIsEsportDeleteModalOpen(false)}
        onConfirm={confirmDeleteEsport}
        type="delete"
        title="Delete Esport"
        message={`Are you sure you want to delete "${esportToDelete?.name}"? This may affect related categories and matches.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeletingEsport}
      />

      {/* Delete Category Confirmation */}
      <ConfirmationModal
        isOpen={isCategoryDeleteModalOpen}
        onClose={() => setIsCategoryDeleteModalOpen(false)}
        onConfirm={confirmDeleteCategory}
        type="delete"
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.division} - ${categoryToDelete?.levels}"? This may affect related matches.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeletingCategory}
      />
    </div>
  );
}
