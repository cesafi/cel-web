import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { SortableHeaderProps, BaseEntity } from '@/lib/types/table';

export function SortableHeader<T extends BaseEntity>({
  column,
  sortBy,
  sortOrder,
  onSort
}: SortableHeaderProps<T>) {
  if (!column.sortable) {
    return <div className="text-sm font-semibold">{column.header}</div>;
  }

  const isSorted = sortBy === column.key;
  const isAsc = isSorted && sortOrder === 'asc';
  const isDesc = isSorted && sortOrder === 'desc';

  const handleClick = () => {
    const newOrder = isAsc ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-auto p-0 text-sm font-semibold transition-all duration-200"
    >
      <div className="flex items-center gap-2">
        {column.header}
        <div className="flex flex-col">
          <ChevronUp
            className={`h-4 w-4 transition-all duration-200 ${
              isAsc ? 'text-foreground' : 'text-muted'
            }`}
          />
          <ChevronDown
            className={`-mt-1 h-4 w-4 transition-all duration-200 ${
              isDesc ? 'text-foreground' : 'text-muted'
            }`}
          />
        </div>
      </div>
    </Button>
  );
}
