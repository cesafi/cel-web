'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Mail, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalLayout } from '@/components/ui/modal-layout';
import { useAccountsTable } from '@/hooks/use-accounts';
import { CreateAccountFormData, UpdateAccountFormData, createAccountSchema, updateAccountSchema } from '@/lib/validations/accounts';
import { AccountEntity } from '@/lib/types/accounts';
import { toast } from 'sonner';
import { generateSecurePasswordAction } from '@/actions/accounts';
import { z } from 'zod';
import { USER_ROLES } from '@/lib/utils/roles';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  account?: AccountEntity;
  onSuccess?: () => void; // Callback to trigger refetch
}

export function AccountModal({ isOpen, onClose, mode, account, onSuccess }: AccountModalProps) {
  const [formData, setFormData] = useState<CreateAccountFormData | UpdateAccountFormData>({
    displayName: '',
    email: '',
    password: mode === 'add' ? '' : undefined,
    role: 'writer'
  } as CreateAccountFormData | UpdateAccountFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

  const { createAccount, updateAccount, isCreating, isUpdating } = useAccountsTable();
  
  // Track when mutations start to detect completion
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Memoize handleClose to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    // Form will be reset by useEffect when mode/account changes
    setErrors({});
    onClose();
  }, [onClose]);

  // Update form data when account prop changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && account) {
      setFormData({
        displayName: account.displayName || '',
        email: account.email || '',
        password: undefined, // Don't pre-fill password for security
        role: account.role || 'writer'
      } as UpdateAccountFormData);
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        displayName: '',
        email: '',
        password: '',
        role: 'writer'
      } as CreateAccountFormData);
    }
    // Clear errors when switching modes
    setErrors({});
  }, [mode, account]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && account) {
        setFormData({
          displayName: account.displayName || '',
          email: account.email || '',
          password: undefined, // Don't pre-fill password for security
          role: account.role || 'writer'
        } as UpdateAccountFormData);
      } else {
        // Reset form for add mode
        setFormData({
          displayName: '',
          email: '',
          password: '',
          role: 'writer'
        } as CreateAccountFormData);
      }
      // Clear errors and reset mutation tracking
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [isOpen, mode, account]);

  // Track when mutations start
  useEffect(() => {
    if (isCreating && !hasStartedCreating.current) {
      hasStartedCreating.current = true;
      console.log('AccountModal: Create mutation started');
    }
    if (isUpdating && !hasStartedUpdating.current) {
      hasStartedUpdating.current = true;
      console.log('AccountModal: Update mutation started');
    }
  }, [isCreating, isUpdating]);

  // Handle successful mutations - only trigger when mutations complete
  useEffect(() => {
    console.log('AccountModal: Mutation state changed', { 
      isCreating, 
      isUpdating, 
      hasStartedCreating: hasStartedCreating.current, 
      hasStartedUpdating: hasStartedUpdating.current,
      mode 
    });

    // Check if create mutation just completed (was started and now finished)
    if (hasStartedCreating.current && !isCreating) {
      console.log('AccountModal: Create mutation completed, closing modal');
      hasStartedCreating.current = false;
      onSuccess?.();
      handleClose();
    }
    
    // Check if update mutation just completed (was started and now finished)
    if (hasStartedUpdating.current && !isUpdating) {
      console.log('AccountModal: Update mutation completed, closing modal');
      hasStartedUpdating.current = false;
      onSuccess?.();
      handleClose();
    }
  }, [isCreating, isUpdating, onSuccess, handleClose, mode]);

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createAccountSchema : updateAccountSchema;
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'add') {
        createAccount(formData as CreateAccountFormData);
      } else if (mode === 'edit' && account) {
        updateAccount({ userId: account.id, accountData: formData as UpdateAccountFormData });
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error(mode === 'add' ? 'Failed to create account' : 'Failed to update account');
    }
  };

  const generateSecurePassword = async () => {
    setIsGeneratingPassword(true);
    try {
      const result = await generateSecurePasswordAction();
      
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, password: result.data as string }));
        toast.success('Secure password generated successfully');
      } else {
        toast.error(result.error || 'Failed to generate password');
      }
    } catch {
      toast.error('Failed to generate secure password');
    } finally {
      setIsGeneratingPassword(false);
    }
  };

  return (
    <ModalLayout
      open={isOpen}
      onOpenChange={handleClose}
      title={mode === 'add' ? 'Add New Account' : 'Edit Account'}
      maxWidth="max-w-2xl"
      height="h-[600px]"
      footer={
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
            disabled={mode === 'add' ? isCreating : isUpdating}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="flex-1"
            disabled={mode === 'add' ? isCreating : isUpdating}
          >
            {mode === 'add' 
              ? (isCreating ? 'Creating Account...' : 'Create Account')
              : (isUpdating ? 'Updating Account...' : 'Update Account')
            }
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name *</label>
              <Input
                value={formData.displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter display name"
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Password {mode === 'add' ? '*' : '(leave blank to keep current)'}
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.password || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, password: e.target.value || undefined }))}
                  placeholder="Enter password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateSecurePassword}
                  className="whitespace-nowrap"
                  disabled={isGeneratingPassword}
                >
                  {isGeneratingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
                             <p className="text-xs text-muted-foreground">
                 Password must be at least 8 characters long and contain lowercase, uppercase, numbers, and special characters
               </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {USER_ROLES.map((role) => (
                <div
                  key={role.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.role === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                >
                  <div className="font-medium">{role.label}</div>
                  <div className="text-sm text-muted-foreground">{role.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </ModalLayout>
  );
}
