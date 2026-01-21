'use server';

import { revalidatePath } from 'next/cache';
import { DepartmentService } from '@/services/departments';
import { DepartmentInsert, DepartmentUpdate } from '@/lib/types/departments';

export async function getAllDepartments() {
  return DepartmentService.getAll();
}

export async function getDepartmentById(id: number) {
  return DepartmentService.getById(id);
}

export async function createDepartment(data: DepartmentInsert) {
  const result = await DepartmentService.insert(data);
  if (result.success) revalidatePath('/dashboard/departments');
  return result;
}

export async function updateDepartmentById(data: DepartmentUpdate) {
  const result = await DepartmentService.updateById(data);
  if (result.success) revalidatePath('/dashboard/departments');
  return result;
}

export async function deleteDepartmentById(id: number) {
  const result = await DepartmentService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/departments');
  return result;
}
