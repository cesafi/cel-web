import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TableSearchAndFilters } from './table-search-filters';
import { TablePagination } from './table-pagination';
import { SortableHeader } from './sortable-header';
import { TableSkeleton } from './table-skeleton';
import { TableProps, TableColumn, BaseEntity } from '@/lib/types/table';

export function DataTable<T extends BaseEntity>({
  // Data
  data,
  totalCount,
  loading = false,
  tableBodyLoading = false,
  error = null,

  // Columns and Actions
  columns,
  actions = [],

  // Pagination
  currentPage,
  pageCount,
  pageSize,
  pageSizeOptions = [5, 10, 25, 50, 100],

  // State management
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onFiltersChange,

  // UI customization
  title,
  subtitle,
  searchPlaceholder,
  showSearch = true,
  showFilters = true,
  addButton,

  // Styling
  className = '',
  emptyMessage = 'No data available',

  // Initial sort state
  initialSortBy,
  initialSortOrder = 'asc',

  // Refetch function for keeping data in sync
  refetch
}: TableProps<T>) {
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  // Update local sort state when initial sort props change
  useEffect(() => {
    if (initialSortBy !== undefined) {
      setSortBy(initialSortBy);
    }
    if (initialSortOrder !== undefined) {
      setSortOrder(initialSortOrder);
    }
  }, [initialSortBy, initialSortOrder]);

  // Auto-refetch data when component mounts or when data changes
  useEffect(() => {
    if (refetch && !loading) {
      // Small delay to ensure any pending mutations have completed
      const timer = setTimeout(() => {
        refetch();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [refetch, loading]);

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
    onSortChange(key, order);
  };

  const renderCell = (item: T, column: TableColumn<T>, index: number) => {
    if (column.render) {
      return column.render(item, index);
    }
    return null;
  };

  const renderActions = (item: T) => {
    return (
      <div className="flex items-center space-x-2">
        {actions.map((action) => {
          if (action.hidden && action.hidden(item)) return null;

          return (
            <Button
              key={action.key}
              variant={action.variant || 'ghost'}
              size={action.size || 'sm'}
              onClick={() => action.onClick(item)}
              disabled={action.disabled ? action.disabled(item) : false}
              className="h-8 w-8 p-0"
              title={action.label}
            >
              {action.icon}
            </Button>
          );
        })}
      </div>
    );
  };

  // Remove the full page loading check - we'll handle loading in the table body

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Search and Filters */}
      {showSearch && (
        <TableSearchAndFilters
          search=""
          onSearchChange={onSearchChange}
          onFiltersChange={onFiltersChange}
          searchPlaceholder={searchPlaceholder}
          showFilters={showFilters}
          addButton={addButton}
        />
      )}

      {/* Table */}
      <div className="border-border overflow-x-auto rounded-t-lg border">
        <table className="w-full">
          <thead>
            <tr className="from-background/5 to-background/10 border-border border-b bg-gradient-to-r">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-sm font-semibold first:rounded-tl-lg last:rounded-tr-lg"
                  style={{ width: column.width }}
                >
                  <SortableHeader
                    column={column}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </th>
              ))}
              {actions.length > 0 && (
                <th className="w-28 px-6 py-4 text-left text-sm font-semibold">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-background">
            {(loading || tableBodyLoading) ? (
              <TableSkeleton 
                columns={columns} 
                actions={actions} 
                rowCount={Math.min(5, pageSize || 10)} 
              />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                      <svg
                        className="text-muted-foreground h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="text-muted-foreground font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={`border-border border-b transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                  } hover:bg-primary/5 hover:shadow-sm`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm">
                      {renderCell(item, column, index)}
                    </td>
                  ))}
                  {actions.length > 0 && <td className="px-6 py-4">{renderActions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          pageCount={pageCount}
          pageSize={pageSize}
          totalCount={totalCount}
          pageSizeOptions={pageSizeOptions}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </Card>
  );
}
