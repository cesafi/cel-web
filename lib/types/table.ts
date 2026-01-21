import { ReactNode } from 'react';
import { PaginationOptions, FilterValue } from './base';

// Base interface that all entities must implement
export interface BaseEntity {
  id: string | number;
  [key: string]: unknown; // Allow additional properties
}

export interface TableColumn<T extends BaseEntity> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string | number;
  render: (item: T, index: number) => ReactNode;
  headerRender?: (column: TableColumn<T>) => ReactNode;
}

export interface TableAction<T extends BaseEntity> {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: (item: T) => void;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'destructive' | 'outline' | 'primary-outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: (item: T) => boolean;
  hidden?: (item: T) => boolean;
}

export interface TableFilters {
  search?: string;
  [key: string]: FilterValue | string | undefined;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  filters: TableFilters;
}

export interface TableProps<T extends BaseEntity> {
  // Data
  data: T[];
  totalCount: number;
  loading?: boolean;
  tableBodyLoading?: boolean;
  error?: string | null;

  // Columns and Actions
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];

  // Pagination
  currentPage: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions?: number[];

  // State management
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: TableFilters) => void;

  // UI customization
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  addButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };

  // Styling
  className?: string;
  emptyMessage?: string;

  // Initial sort state
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';

  // Refetch function for keeping data in sync with mutations
  refetch?: () => void;
}

export interface UseTableOptions<_T extends BaseEntity = BaseEntity> {
  initialPage?: number;
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialFilters?: TableFilters;
  pageSizeOptions?: number[];
}

export interface UseTableReturn<_T extends BaseEntity> {
  // State
  tableState: TableState;

  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSortBy: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  setFilters: (filters: TableFilters) => void;
  resetFilters: () => void;

  // Computed values
  paginationOptions: PaginationOptions<TableFilters>;

  // Table props
  tableProps: Omit<
    TableProps<_T>,
    'data' | 'totalCount' | 'currentPage' | 'pageCount' | 'pageSize' | 'columns' | 'actions'
  >;
}

export interface SortableHeaderProps<_T extends BaseEntity> {
  column: TableColumn<_T>;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string, order: 'asc' | 'desc') => void;
}

export interface PaginationProps {
  currentPage: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: TableFilters) => void;
  searchPlaceholder?: string;
  showFilters?: boolean;
  addButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}
