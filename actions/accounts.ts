'use server';

import { AccountsService } from '@/services/accounts';
import { UpdateAccountFormData, CreateAccountFormData } from '@/lib/validations/accounts';
import { AccountEntity } from '@/lib/types/accounts';
import { PaginationOptions } from '@/lib/types/base';
import { checkAuthAction } from './auth';
import { UserRole } from '@/lib/types/auth';
import { TableFilters } from '@/lib/types/table';
import { RevalidationHelper } from '@/lib/utils/revalidation';
import crypto from 'crypto';

export async function getAllAccouns(): Promise<{ success: boolean; data?: AccountEntity[]; error?: string }> {
  try {
    const result = await AccountsService.getAll();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch accounts'
    };
  }
}

export async function getPaginatedAccounts(options: PaginationOptions<TableFilters>): Promise<{ success: boolean; data?: { data: AccountEntity[]; totalCount: number; pageCount: number; currentPage: number }; error?: string }> {
  try {
    const { page = 1, pageSize = 10, searchQuery, filters } = options;


    const accountsResponse = await AccountsService.getAll();

    if (!accountsResponse.success || !accountsResponse.data) {
      return { success: false, error: accountsResponse.success === false ? accountsResponse.error : 'Failed to fetch accounts' };
    }

    let filteredAccounts = accountsResponse.data;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredAccounts = filteredAccounts.filter(account =>
        account.email.toLowerCase().includes(searchLower) ||
        (account.displayName && account.displayName.toLowerCase().includes(searchLower))
      );
    }

    // Apply role filter
    if (filters?.role && typeof filters.role === 'string' && filters.role !== 'all') {
      filteredAccounts = filteredAccounts.filter(account => account.role === filters.role);
    }

    // Calculate pagination
    const totalCount = filteredAccounts.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);


    return {
      success: true,
      data: {
        data: paginatedAccounts,
        totalCount,
        pageCount: totalPages,
        currentPage: page
      }
    };
  } catch {
    return { success: false, error: 'Failed to fetch paginated accounts' };
  }
}

export async function updateAccount(userId: string, accountData: UpdateAccountFormData): Promise<{ success: boolean; data?: AccountEntity; error?: string }> {
  try {

    const result = await AccountsService.updateAccount(userId, accountData);

    if (result.success) {
      RevalidationHelper.revalidateAdminDashboard(); // Account changes affect admin dashboard
    }

    return result;
  } catch {
    return {
      success: false,
      error: 'Failed to update account'
    };
  }
}

export async function createAccount(accountData: CreateAccountFormData): Promise<{ success: boolean; data?: AccountEntity; error?: string }> {
  try {
    const result = await AccountsService.createAccount(accountData);
    
    if (result.success) {
      RevalidationHelper.revalidateAdminDashboard(); // New accounts affect admin dashboard
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account'
    };
  }
}

export async function updateAccountRole(userId: string, newRole: string): Promise<{ success: boolean; data?: AccountEntity; error?: string }> {
  try {
    const result = await AccountsService.updateAccountRole(userId, newRole as UserRole);
    
    if (result.success) {
      RevalidationHelper.revalidateAdminDashboard(); // Role changes affect admin dashboard
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account role'
    };
  }
}

export async function resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; data?: undefined; error?: string }> {
  try {
    const result = await AccountsService.resetPassword(userId, newPassword);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password'
    };
  }
}

export async function deleteAccount(userId: string): Promise<{ success: boolean; data?: undefined; error?: string }> {
  try {
    const result = await AccountsService.deleteAccount(userId);
    
    if (result.success) {
      RevalidationHelper.revalidateAdminDashboard(); // Account deletion affects admin dashboard
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account'
    };
  }
}

export async function generateSecurePasswordAction() {
  const authCheck = await checkAuthAction(['admin']);

  if (!authCheck.authenticated || !authCheck.authorized) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Use crypto.randomBytes for cryptographically secure random generation
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + special;

    let password = '';

    // Add one character from each required category (ensuring requirements are met)
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];

    // Fill the rest with random characters from all categories
    for (let i = 4; i < 12; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }

    // Shuffle the password using Fisher-Yates algorithm for better randomization
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    const finalPassword = passwordArray.join('');

    return { success: true, data: finalPassword };
  } catch {
    return { success: false, error: 'Failed to generate secure password' };
  }
}
