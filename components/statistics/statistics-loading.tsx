'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatisticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Game Mode Selector Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Navigation Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Filter Panel Skeleton */}
      <div className="flex gap-4 p-4 rounded-lg bg-muted/30">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Top 3 Cards Skeleton */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center">
                <Skeleton className="w-16 h-16 rounded-full mb-3" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-3 gap-4 w-full">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 pb-3 border-b">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Rows */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
