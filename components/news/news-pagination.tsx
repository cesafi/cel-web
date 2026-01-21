'use client';

import { Button } from '@/components/ui/button';
import { roboto } from '@/lib/fonts';
import { Pagination } from '../ui/pagination';

interface NewsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
}

export default function NewsPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize
}: NewsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalCount}
      itemsPerPage={pageSize}
      onPageChange={onPageChange}
      showPageSizeSelector={false}
      resourceName="articles"
      className={`mt-12 ${roboto.className}`}
    />
  );
}

