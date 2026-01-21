# Schedule Feature Implementation

This document describes the implementation of the schedule feature for the CESAFI Esports League website, inspired by the LOL Esports schedule layout.

## Overview

The schedule feature provides:
- **Infinite scrolling** with cursor-based pagination
- **Date grouping** for organized display
- **Multiple participant support** for sports like track & field and swimming
- **LOL Esports-style scrolling** (down for future, up for past)
- **Comprehensive filtering** by season, sport, category, etc.

## Architecture

### 1. Types (`src/lib/types/matches.ts`)

```typescript
// Schedule-specific types
export interface ScheduleMatch extends MatchWithFullDetails {
  displayDate: string;
  displayTime: string;
  isToday: boolean;
  isPast: boolean;
  isUpcoming: boolean;
}

export interface ScheduleFilters {
  season_id?: number;
  sport_id?: number;
  sport_category_id?: number;
  stage_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SchedulePaginationOptions {
  cursor?: string;
  limit: number;
  direction: 'future' | 'past';
  filters?: ScheduleFilters;
}
```

### 2. Server Actions (`src/actions/matches.ts`)

```typescript
// Get matches with infinite scrolling support
export async function getScheduleMatches(options: SchedulePaginationOptions)

// Get matches grouped by date
export async function getScheduleMatchesByDate(options: ScheduleFilters)
```

### 3. Service Layer (`src/services/matches.ts`)

The `MatchService` class provides two new methods:
- `getScheduleMatches()` - For infinite scrolling with cursor-based pagination
- `getScheduleMatchesByDate()` - For date-grouped views

### 4. Hooks (`src/hooks/use-schedule.ts`)

#### Primary Hooks

```typescript
// Infinite scrolling schedule
const { data, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage } = 
  useInfiniteSchedule({ limit: 20, direction: 'future' });

// Date-grouped schedule
const { data: { groupedMatches, sortedDateKeys } } = 
  useScheduleByDate({ sport_id: 1 });
```

#### Utility Hooks

```typescript
// Get upcoming matches
const upcomingMatches = useUpcomingMatches(10);

// Get today's matches
const todayMatches = useTodayMatches();

// Get this week's matches
const weekMatches = useThisWeekMatches();
```

### 5. Utilities (`src/lib/utils/schedule-utils.ts`)

Helper functions for:
- Date/time formatting
- Match grouping
- Status colors
- Sport information formatting

## Usage Examples

### Basic Infinite Scrolling

```typescript
import { useInfiniteSchedule } from '@/hooks/use-schedule';

function ScheduleComponent() {
  const { 
    data, 
    fetchNextPage, 
    fetchPreviousPage, 
    hasNextPage, 
    hasPreviousPage,
    isLoading 
  } = useInfiniteSchedule({
    limit: 20,
    direction: 'future',
    filters: { sport_id: 1 }
  });

  return (
    <div>
      {/* Past matches - scroll up */}
      {hasPreviousPage && (
        <button onClick={() => fetchPreviousPage()}>
          Load More Past Matches
        </button>
      )}
      
      {/* Current matches */}
      {data?.matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
      
      {/* Future matches - scroll down */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          Load More Future Matches
        </button>
      )}
    </div>
  );
}
```

### Date-Grouped Display

```typescript
import { useScheduleByDate } from '@/hooks/use-schedule';

function CalendarSchedule() {
  const { data, isLoading } = useScheduleByDate({
    sport_id: 1,
    season_id: 1
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.sortedDateKeys.map(dateKey => (
        <div key={dateKey}>
          <h3>{formatScheduleDate(dateKey)}</h3>
          {data.groupedMatches[dateKey].map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Filtering and Search

```typescript
const { data } = useInfiniteSchedule({
  limit: 20,
  direction: 'future',
  filters: {
    sport_id: 1,
    sport_category_id: 2,
    status: 'upcoming',
    search: 'championship',
    date_from: '2024-01-01',
    date_to: '2024-12-31'
  }
});
```

## Key Features

### 1. Infinite Scrolling
- **Cursor-based pagination** for efficient data loading
- **Bidirectional scrolling** (up for past, down for future)
- **Configurable page sizes** for optimal performance

### 2. Multiple Participants Support
- Handles matches with multiple teams (track & field, swimming)
- Each participant shows school logo, abbreviation, and score
- Flexible display for varying participant counts

### 3. Date Grouping
- Automatic grouping by date
- Smart date labels (Today, Tomorrow, Yesterday)
- Chronological sorting within date groups

### 4. Comprehensive Filtering
- Season, sport, and category filtering
- Date range filtering
- Status filtering (upcoming, ongoing, finished, cancelled)
- Text search across match names and descriptions

### 5. Performance Optimizations
- Efficient database queries with proper joins
- Cursor-based pagination reduces memory usage
- React Query caching for better UX
- Lazy loading of match details

## Database Queries

The schedule feature uses optimized Supabase queries that:
- Join multiple tables for complete match information
- Apply filters at the database level
- Use proper indexing on `scheduled_at` field
- Support cursor-based pagination efficiently

## Error Handling

All hooks and server actions include proper error handling:
- Network errors are caught and displayed
- Validation errors are handled gracefully
- Fallback states for loading and error conditions

## Future Enhancements

Potential improvements for the schedule feature:
- **Spoiler hiding** functionality
- **Real-time updates** for live matches
- **Advanced filtering** (venue, team-based)
- **Export functionality** (calendar, PDF)
- **Mobile-optimized** scrolling behavior
- **Accessibility improvements** for screen readers

## Notes

- The feature follows the LOL Esports scrolling pattern (opposite to CESAFI Esports League)
- All matches include complete participant information
- The system automatically handles timezone conversions
- Season context is automatically applied to all queries
- Infinite scrolling is optimized for large datasets
