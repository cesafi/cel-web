'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { MlbbMap, MlbbMapUpdate, MlbbMapInsert } from '@/lib/types/mlbb-maps';

export async function getMlbbMaps() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mlbb_maps')
    .select('*')
    .order('name');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getActiveMlbbMaps() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mlbb_maps')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getMlbbMapById(id: number) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mlbb_maps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function createMlbbMap(map: MlbbMapInsert) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mlbb_maps')
    .insert(map)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/league-operator');
  return { success: true, data };
}

export async function updateMlbbMap(map: MlbbMapUpdate & { id: number }) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mlbb_maps')
    .update(map)
    .eq('id', map.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/league-operator');
  return { success: true, data };
}

export async function deleteMlbbMap(id: number) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('mlbb_maps')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/league-operator');
  return { success: true };
}
