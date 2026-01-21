import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PaginationProps } from '@/lib/types/table';

const MAX_VISIBLE_PAGES = 7;

export function TablePagination({
  currentPage,
  pageCount,
  pageSize,
  totalCount,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];

    if (pageCount <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pageCount);
      } else if (currentPage >= pageCount - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = pageCount - 4; i <= pageCount; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pageCount);
      }
    }

    return pages;
  };

  return (
    <div className="bg-muted/50 border-border flex items-center justify-between border-t px-6 py-4">
      <div className="flex items-center space-x-3">
        <p className="text-muted-foreground text-sm font-medium">Rows per page</p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="border-border bg-background h-9 w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">
          {startItem}-{endItem} of {totalCount}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="border-border hover:bg-primary/5"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-border hover:bg-primary/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {generatePageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="text-muted-foreground px-3 py-2 text-sm">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={`h-9 w-9 p-0 ${
                    currentPage === page
                      ? 'bg-primary hover:bg-primary/90 border-primary'
                      : 'border-border hover:bg-primary/5'
                  }`}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          className="border-border hover:bg-primary/5"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageCount)}
          disabled={currentPage === pageCount}
          className="border-border hover:bg-primary/5"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
