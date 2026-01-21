'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { isToday, formatDateHeader } from './utils';

interface DateNavigationProps {
  readonly currentDate: Date;
  readonly onDateChange: (date: Date) => void;
  readonly _hasMatches: boolean;
  readonly onPreviousDay?: () => void;
  readonly onNextDay?: () => void;
  readonly selectedSport?: string;
  readonly onSportChange?: (sport: string) => void;
  readonly availableSports?: string[];
  readonly availableDates?: Date[];
  readonly hasMorePast?: boolean;
  readonly hasMoreFuture?: boolean;
}

export default function DateNavigation({
  currentDate,
  onDateChange,
  _hasMatches,
  onPreviousDay,
  onNextDay,
  selectedSport = 'all',
  onSportChange,
  availableSports = [
    'Basketball',
    'Volleyball',
    'Football',
    'Tennis',
    'Badminton',
    'Track and Field',
    'Swimming'
  ],
  availableDates = [],
  hasMorePast = false,
  hasMoreFuture = false
}: DateNavigationProps) {
  const goToPreviousDay = () => {
    if (onPreviousDay) {
      onPreviousDay();
    } else if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(
        (date) => date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
      );
      if (currentIndex > 0) {
        onDateChange(availableDates[currentIndex - 1]);
      }
    }
  };

  const goToNextDay = () => {
    if (onNextDay) {
      onNextDay();
    } else if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(
        (date) => date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
      );
      if (currentIndex < availableDates.length - 1) {
        onDateChange(availableDates[currentIndex + 1]);
      }
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    onDateChange(today);
  };

  return (
    <Card className="border-border bg-card sticky top-24 z-10 mt-6 shadow-sm overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between overflow-x-auto">
          {/* Left side: Current date display */}
          <div className="flex items-center">
            <div className="flex flex-col">
              <div className="font-mango-grotesque text-foreground text-sm font-medium uppercase tracking-wide">
                {isToday(currentDate) ? 'TODAY' : formatDateHeader(currentDate).weekday}
              </div>
              <div className="font-mango-grotesque text-foreground text-2xl font-bold">
                {isToday(currentDate) ? formatDateHeader(new Date()).date : formatDateHeader(currentDate).date}
              </div>
            </div>
          </div>

          {/* Right side: Date navigation and filters */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* Date Navigation - Unified button style */}
            <div className="flex items-center">
              <Button
                variant="outline"
                size="default"
                onClick={goToPreviousDay}
                disabled={
                  !hasMorePast &&
                  availableDates.length > 0 &&
                  availableDates.findIndex(
                    (date) =>
                      date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
                  ) <= 0
                }
                className="h-9 rounded-r-none border-r-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={handleGoToToday}
                className="h-9 rounded-none border-r-0 border-l-0"
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={goToNextDay}
                disabled={
                  !hasMoreFuture &&
                  availableDates.length > 0 &&
                  availableDates.findIndex(
                    (date) =>
                      date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
                  ) >=
                    availableDates.length - 1
                }
                className="h-9 rounded-l-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Sport Filter */}
            <Select value={selectedSport} onValueChange={onSportChange}>
              <SelectTrigger className="bg-background border-border h-9 w-full sm:w-[180px]">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {availableSports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="text-muted-foreground p-2 text-sm">Settings coming soon...</div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
