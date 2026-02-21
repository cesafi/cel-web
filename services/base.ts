import {
  NonNullPrimitive,
  PaginatedResponse,
  PaginationOptions,
  RangeOrEqualityFilter,
  ServiceResponse,
  FilterValue
} from '../lib/types/base';
import { Database } from '../database.types';
import { AdminSupabaseClient } from '../lib/supabase/admin';
import { getSupabaseClient } from '../lib/supabase/client';
import { getSupabaseServer } from '../lib/supabase/server';
import { createAdminClient } from '../lib/supabase/admin';

export abstract class BaseService {
  protected static async getClient() {
    const isServer = typeof window === 'undefined';

    if (isServer) {
      return getSupabaseServer();
    } else {
      return getSupabaseClient();
    }
  }

  protected static async getAdminClient(): Promise<AdminSupabaseClient> {
    return createAdminClient();
  }

  protected static formatError<T>(error: unknown, message: string): ServiceResponse<T> {
    // Log the full error for debugging
    console.error(`[Service Error] ${message}:`, error);

    let errorMessage = message;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      // Handle Supabase PostgrestError (not an Error instance, but has message/details/hint/code)
      const pgError = error as { message: string; details?: string; hint?: string; code?: string };
      errorMessage = pgError.message;
      if (pgError.details) {
        errorMessage += ` Details: ${pgError.details}`;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }

  private static applyFiltersToQuery<TFilters extends Record<string, FilterValue>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    filters: TFilters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'search') return;

      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          const nonNullValues = value.filter((item): item is NonNullPrimitive => item !== null);

          if (nonNullValues.length > 0) {
            query = query.in(key, nonNullValues);
          }
        } else if (typeof value === 'object' && value !== null) {
          const { gte, lte, eq } = value as RangeOrEqualityFilter;

          if (gte !== undefined) query = query.gte(key, gte);
          if (lte !== undefined) query = query.lte(key, lte);
          if (eq !== undefined && eq !== null) query = query.eq(key, eq);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    return query;
  }

  protected static async getPaginatedData<
    T,
    TableName extends keyof Database['public']['Tables'],
    TFilters extends Record<string, FilterValue> = Record<string, FilterValue>
  >(
    tableName: TableName,
    options: PaginationOptions<TFilters>,
    selectQuery: string = '*'
  ): Promise<ServiceResponse<PaginatedResponse<T>>> {
    try {
      const { page, pageSize, filters, searchQuery, searchableFields, sortBy, sortOrder } = options;

      const supabase = await this.getClient();

      const offset = (page - 1) * pageSize;

      let query = supabase.from(tableName).select(selectQuery, { count: 'exact' });

      if (filters) {
        // Apply filters using a more type-safe approach
        query = this.applyFiltersToQuery(query, filters);
      }

      if (searchQuery && searchQuery.trim() && searchableFields && searchableFields.length > 0) {
        const searchConditions = searchableFields.map((field) => {
          const numericValue = Number(searchQuery);
          if (!isNaN(numericValue)) {
            return `or(${field}.eq.${numericValue},${field}.ilike.%${searchQuery}%)`;
          } else {
            return `${field}.ilike.%${searchQuery}%`;
          }
        });
        query = query.or(searchConditions.join(','));
      }

      if (sortBy) {
        query = query.order(sortBy, { ascending: sortOrder !== 'desc' });
      }

      const { data, error, count } = await query.range(offset, offset + pageSize - 1);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      const totalCount = count || 0;
      const pageCount = Math.ceil(totalCount / pageSize);

      const result = {
        success: true as const,
        data: {
          data: data as T[],
          totalCount,
          pageCount,
          currentPage: page
        }
      };
      return result;
    } catch (error) {
      console.error('BaseService.getPaginatedData error:', error);
      return this.formatError(error, `Failed to fetch paginated ${String(tableName)}`);
    }
  }
}
