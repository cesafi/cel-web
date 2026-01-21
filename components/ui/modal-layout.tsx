import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface ModalLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode | string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  height?: string;

}

export function ModalLayout({
  open,
  onOpenChange,
  title,
  children,
  footer,
  maxWidth = "max-w-2xl",
  height = "h-[600px]",

}: ModalLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} ${height} flex flex-col`}>
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>

        {/* Fixed Footer - only render if footer prop is provided */}
        {footer && (
          <div className="flex-shrink-0 pt-4 border-t bg-background">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
