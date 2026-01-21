'use client';

import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface FloatingNavButtonProps {
  readonly isVisible: boolean;
  readonly direction: 'up' | 'down';
  readonly onClick: () => void;
}

export default function FloatingNavButton({ isVisible, direction, onClick }: FloatingNavButtonProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-8 z-[9999] animate-bounce">
      {/* Outer circle effect */}
      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
      <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
      
      {/* Main button */}
      <Button
        onClick={onClick}
        className="relative h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-primary text-primary-foreground"
        size="icon"
      >
        {direction === 'up' ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <ChevronDown className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
