import { useState, useCallback, useMemo } from 'react';
import { PaginationOptions } from '@/lib/types/base';
import { TableState, TableFilters, UseTableOptions, UseTableReturn, BaseEntity } from '@/lib/types/table';

export function useTable<T extends BaseEntity>(options: UseTableOptions<T> = {}): UseTableReturn<T> {
  const {
    initialPage = 1,
    initialPageSize = 5,
    initialSortBy,
    initialSortOrder = 'asc',
    initialFilters = {}
  } = options;

  const [tableState, setTableState] = useState<TableState>({
    page: initialPage,
    pageSize: initialPageSize,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
    filters: initialFilters
  });

  const setPage = useCallback((page: number) => {
    setTableState(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setTableState(prev => ({ ...prev, pageSize, page: 1 })); // Reset to first page when changing page size
  }, []);

  const setSortBy = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setTableState(prev => ({ ...prev, sortBy, sortOrder, page: 1 })); // Reset to first page when sorting
  }, []);

  const setSearch = useCallback((search: string) => {
    setTableState(prev => {
      // Only reset to page 1 if the search term actually changed
      const currentSearch = prev.filters.search || '';
      const shouldResetPage = currentSearch !== search;
      
      // If search is empty, reset all filters and search query
      if (search.trim() === '') {
        return {
          ...prev,
          filters: {},
          page: 1
        };
      }
      
      return {
        ...prev, 
        filters: { ...prev.filters, search },
        page: shouldResetPage ? 1 : prev.page
      };
    });
  }, []);

  const setFilters = useCallback((filters: TableFilters) => {
    setTableState(prev => {
      // Only reset to page 1 if filters actually changed
      const currentFilters = prev.filters;
      const newFilters = { ...currentFilters, ...filters };
      
      // Check if any filter values actually changed
      const filtersChanged = Object.keys(filters).some(
        key => currentFilters[key] !== filters[key]
      );
      
      return {
        ...prev, 
        filters: newFilters,
        page: filtersChanged ? 1 : prev.page
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setTableState(prev => ({
      ...prev,
      filters: {},
      page: 1
    }));
  }, []);

  const paginationOptions = useMemo((): PaginationOptions<TableFilters> => ({
    page: tableState.page,
    pageSize: tableState.pageSize,
    searchQuery: tableState.filters.search,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    filters: tableState.filters
  }), [tableState]);

  const tableProps = useMemo(() => ({
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    onSortChange: setSortBy,
    onSearchChange: setSearch,
    onFiltersChange: setFilters
  }), [setPage, setPageSize, setSortBy, setSearch, setFilters]);

  return {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions,
    tableProps
  };
}
