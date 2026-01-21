'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Pencil, Trash2, Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import { Timeline } from '@/lib/types/timeline';
import { getPaginatedTimeline, deleteTimelineById, updateTimelineById } from '@/actions/timeline';

interface TimelineTableProps {
  initialData?: {
    data: Timeline[];
    totalCount: number;
  };
  initialPagination?: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export function TimelineTable({ initialData, initialPagination }: TimelineTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(initialPagination?.page || 1);
  const [pageSize] = useState(initialPagination?.pageSize || 10);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', page, pageSize, search],
    queryFn: async () => {
      const result = await getPaginatedTimeline({
        page,
        pageSize,
        searchQuery: search,
        sortBy: 'year',
        sortOrder: 'desc'
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    initialData: initialData ? {
      data: initialData.data,
      totalCount: initialData.totalCount,
      currentPage: page,
      pageCount: Math.ceil(initialData.totalCount / pageSize)
    } : undefined
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTimelineById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      toast.success('Timeline event deleted');
    },
    onError: () => {
      toast.error('Failed to delete timeline event');
    }
  });

  const toggleHighlightMutation = useMutation({
    mutationFn: ({ id, is_highlight }: { id: number; is_highlight: boolean }) =>
      updateTimelineById({ id, is_highlight: !is_highlight }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      toast.success('Highlight status updated');
    },
    onError: () => {
      toast.error('Failed to update highlight');
    }
  });

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      founding: 'bg-blue-500/10 text-blue-500',
      milestone: 'bg-green-500/10 text-green-500',
      award: 'bg-yellow-500/10 text-yellow-500',
      expansion: 'bg-purple-500/10 text-purple-500',
      achievement: 'bg-orange-500/10 text-orange-500'
    };
    return (
      <Badge variant="secondary" className={colors[category] || ''}>
        {category}
      </Badge>
    );
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search timeline events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Year</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[100px]">Highlight</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.year}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {event.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{getCategoryBadge(event.category)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleHighlightMutation.mutate({
                        id: event.id,
                        is_highlight: event.is_highlight
                      })
                    }
                  >
                    {event.is_highlight ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(event.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {data?.data.length || 0} of {data?.totalCount || 0} events
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.pageCount || page >= data.pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
