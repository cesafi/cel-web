'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Faq } from '@/lib/types/faq';
import { Calendar, Hash, Eye, EyeOff } from 'lucide-react';

interface FaqViewDialogProps {
  faq?: Faq;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqViewDialog({ faq, open, onOpenChange }: FaqViewDialogProps) {
  if (!faq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>FAQ Item Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Question</h3>
            <p className="text-lg font-medium">{faq.question}</p>
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Answer</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Display Order</h3>
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{faq.display_order}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="flex items-center space-x-2">
                <Badge variant={faq.is_active ? 'default' : 'secondary'}>
                  {faq.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Settings</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {faq.is_open ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {faq.is_open ? 'Default Open' : 'Default Closed'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(faq.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {faq.updated_at && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(faq.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
