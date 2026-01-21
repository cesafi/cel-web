import { TableColumn, BaseEntity } from '@/lib/types/table';
import { Skeleton } from '../ui/skeleton';

interface TableSkeletonProps<T extends BaseEntity> {
  columns: TableColumn<T>[];
  actions?: unknown[];
  rowCount?: number;
}

export function TableSkeleton<T extends BaseEntity>({ 
  columns, 
  actions = [], 
  rowCount = 5 
}: TableSkeletonProps<T>) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr
          key={`skeleton-${index}`}
          className={`border-border border-b ${
            index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
          }`}
        >
          {columns.map((column) => (
            <td key={column.key} className="px-6 py-4">
              <div className="flex items-center space-x-2">
                {/* Main skeleton */}
                <Skeleton className="h-4 w-20" />
                
                {/* Secondary skeleton for some columns */}
                {index === 0 && (
                  <Skeleton className="h-4 w-16" />
                )}
                
                {/* Additional skeleton for longer content */}
                {index % 2 === 0 && (
                  <Skeleton className="h-4 w-12" />
                )}
              </div>
            </td>
          ))}
          
          {actions.length > 0 && (
            <td className="px-6 py-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
