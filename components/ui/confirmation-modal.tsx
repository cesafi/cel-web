'use client';

import { AlertTriangle, Trash2, AlertCircle, Info } from 'lucide-react';
import { Button } from './button';
import { ModalLayout } from './modal-layout';
import { ReactNode } from 'react';

export type ConfirmationType = 'delete' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

const getConfirmationConfig = (type: ConfirmationType) => {
  switch (type) {
    case 'delete':
      return {
        icon: <Trash2 className="h-6 w-6 text-red-500" />,
        confirmVariant: 'destructive' as const,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        confirmVariant: 'default' as const,
        confirmText: 'Continue',
        cancelText: 'Cancel'
      };
    case 'info':
      return {
        icon: <Info className="h-6 w-6 text-blue-500" />,
        confirmVariant: 'default' as const,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      };
    default:
      return {
        icon: <AlertCircle className="h-6 w-6 text-muted-foreground" />,
        confirmVariant: 'default' as const,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      };
  }
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'delete',
  confirmText,
  cancelText,
  isLoading = false,
  destructive = true,
  disabled = false
}: ConfirmationModalProps) {
  const config = getConfirmationConfig(type);
  
  const handleConfirm = () => {
    if (!isLoading && !disabled) {
      onConfirm();
    }
  };

  return (
    <ModalLayout
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      maxWidth="max-w-md"
      height="auto"
      footer={
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText || config.cancelText}
          </Button>
          <Button 
            type="button" 
            variant={destructive ? config.confirmVariant : 'default'}
            onClick={handleConfirm}
            className="flex-1"
            disabled={isLoading || disabled}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </div>
            ) : (
              confirmText || config.confirmText
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex-1">
            {typeof message === 'string' ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalLayout>
  );
}
