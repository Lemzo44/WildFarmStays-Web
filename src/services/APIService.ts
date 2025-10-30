import { supabase, useSupabase } from '../lib/supabase';
import { LocalStorageService } from './LocalStorageService';

/**
 * APIService - Centralized API layer that can switch between Supabase and localStorage
 * Uses feature flag VITE_USE_SUPABASE to determine backend
 */
export class APIService {
  /**
   * Check if Supabase should be used
   */
  private static shouldUseSupabase(): boolean {
    return useSupabase;
  }

  /**
   * Get data from a table
   */
  static async get<T>(table: string, options?: {
    select?: string;
    filter?: { column: string; operator: string; value: any };
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<T[]> {
    if (!this.shouldUseSupabase()) {
      // Fallback to localStorage
      return (await LocalStorageService.getAll(table)) as T[];
    }

    if (!supabase) {
      console.warn('Supabase not initialized, falling back to localStorage');
      return (await LocalStorageService.getAll(table)) as T[];
    }

    try {
      let query = supabase.from(table).select(options?.select || '*');

      // Apply filters
      if (options?.filter) {
        query = query.filter(
          options.filter.column,
          options.filter.operator as any,
          options.filter.value
        );
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching from ${table}:`, error);
        throw error;
      }

      return (data || []) as T[];
    } catch (error) {
      console.error(`Error in APIService.get for ${table}:`, error);
      // Fallback to localStorage on error
      return (await LocalStorageService.getAll(table)) as T[];
    }
  }

  /**
   * Get a single record by ID
   */
  static async getById<T>(table: string, id: string): Promise<T | null> {
    if (!this.shouldUseSupabase()) {
      return (await LocalStorageService.getById(table, id)) as T | null;
    }

    if (!supabase) {
      console.warn('Supabase not initialized, falling back to localStorage');
      return (await LocalStorageService.getById(table, id)) as T | null;
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error(`Error fetching ${table} by id:`, error);
        throw error;
      }

      return data as T;
    } catch (error) {
      console.error(`Error in APIService.getById for ${table}:`, error);
      return LocalStorageService.getById(table, id) as T | null;
    }
  }

  /**
   * Create a new record
   */
  static async create<T>(table: string, data: Partial<T>): Promise<T> {
    if (!this.shouldUseSupabase()) {
      await LocalStorageService.save(table, data as any);
      return data as T;
    }

    if (!supabase) {
      console.warn('Supabase not initialized, falling back to localStorage');
      await LocalStorageService.save(table, data as any);
      return data as T;
    }

    try {
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${table}:`, error);
        throw error;
      }

      return inserted as T;
    } catch (error) {
      console.error(`Error in APIService.create for ${table}:`, error);
      // Do not fallback to localStorage on create when Supabase is enabled
      // so callers can handle errors (e.g., unique constraint violations)
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  static async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    if (!this.shouldUseSupabase()) {
      const existing = await LocalStorageService.getById(table, id);
      if (!existing) {
        throw new Error(`Record not found: ${table}/${id}`);
      }
      const updated = { ...existing, ...updates };
      await LocalStorageService.save(table, updated);
      return updated as T;
    }

    if (!supabase) {
      console.warn('Supabase not initialized, falling back to localStorage');
      const existing = await LocalStorageService.getById(table, id);
      if (!existing) {
        throw new Error(`Record not found: ${table}/${id}`);
      }
      const updated = { ...existing, ...updates };
      await LocalStorageService.save(table, updated);
      return updated as T;
    }

    try {
      const { data, error } = await (supabase as any)
        .from(table)
        .update(updates as unknown as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${table}:`, error);
        throw error;
      }

      return data as T;
    } catch (error) {
      console.error(`Error in APIService.update for ${table}:`, error);
      // Fallback to localStorage
      const existing = await LocalStorageService.getById(table, id);
      if (!existing) {
        throw new Error(`Record not found: ${table}/${id}`);
      }
      const updated = { ...existing, ...updates };
      await LocalStorageService.save(table, updated);
      return updated as T;
    }
  }

  /**
   * Delete a record by ID
   */
  static async delete(table: string, id: string): Promise<void> {
    if (!this.shouldUseSupabase()) {
      await LocalStorageService.delete(table, id);
      return;
    }

    if (!supabase) {
      console.warn('Supabase not initialized, falling back to localStorage');
      await LocalStorageService.delete(table, id);
      return;
    }

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in APIService.delete for ${table}:`, error);
      // Fallback to localStorage
      await LocalStorageService.delete(table, id);
    }
  }

  /**
   * Execute a custom query (for complex operations)
   */
  static async query<T>(queryFn: (client: any) => Promise<T>): Promise<T> {
    if (!this.shouldUseSupabase() || !supabase) {
      throw new Error('Supabase not available for custom queries');
    }

    try {
      return await queryFn(supabase);
    } catch (error) {
      console.error('Error in custom query:', error);
      throw error;
    }
  }
}


