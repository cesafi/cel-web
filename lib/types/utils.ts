import { Database } from '@/database.types';

// Date Utilities
export interface DateFormatOptions {
  format?: 'short' | 'long' | 'relative' | 'table' | 'input';
  timezone?: string;
  locale?: string;
}

// Match Utilities
export interface StageDetails {
  competition_stage: string;
  sports_categories: {
    sports: { name: string };
    division: string;
    levels: string;
  };
}

export interface MatchStatusConfig {
  variant: 'outline' | 'default' | 'secondary' | 'destructive';
  className: string;
  label: string;
}

// Sports Utilities
export interface SportCategoryConfig {
  name: string;
  division?: string;
  levels?: string;
}

// Table Utilities
export interface FilterValue {
  value: string | number | boolean | null;
  label: string;
  count?: number;
}

// Advanced Filter Operations
export interface FilterOperation {
  eq?: unknown; // equals
  neq?: unknown; // not equals
  gt?: unknown; // greater than
  gte?: unknown; // greater than or equal
  lt?: unknown; // less than
  lte?: unknown; // less than or equal
  in?: unknown[]; // in array
  nin?: unknown[]; // not in array
  like?: string; // LIKE pattern
  ilike?: string; // ILIKE pattern (case insensitive)
  contains?: string; // contains substring
  startsWith?: string; // starts with
  endsWith?: string; // ends with
  isNull?: boolean; // is null
  isNotNull?: boolean; // is not null
  between?: [unknown, unknown]; // between two values
}

// Filter Configuration for Tables
export interface FilterConfig {
  field: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'range';
  operations?: (keyof FilterOperation)[];
  options?: FilterValue[]; // For select/multiselect filters
  defaultValue?: unknown;
  placeholder?: string;
}

// Enhanced Pagination Options
export interface PaginationOptions<T = Record<string, unknown>> {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: T;
  searchQuery?: string;
  searchableFields?: string[];
  searchMode?: 'exact' | 'partial'; // Simplified search modes
  includeCount?: boolean; // Whether to include total count
}

// Search Configuration
export interface SearchConfig {
  fields: string[];
  mode: 'exact' | 'partial';
  caseSensitive?: boolean;
}

// Sort Configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

// Query Builder Result
export interface QueryBuilderResult {
  query: unknown; // Supabase query
  countQuery?: unknown; // Separate count query if needed
}

// Breadcrumb Utilities
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// Filter Types
export interface RangeOrEqualityFilter {
  gte?: unknown;
  lte?: unknown;
  eq?: unknown;
  neq?: unknown;
  gt?: unknown;
  lt?: unknown;
}

export type TableIdType<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']['id'];

export type NonNullPrimitive = string | number | boolean;
