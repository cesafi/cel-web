'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FilterTabsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function FilterTabs({
  options,
  value,
  onChange,
  label,
  className
}: FilterTabsProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "group relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300",
                "border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground border-border/60 hover:border-primary/30"
              )}
            >
              <span className="relative z-10">
                {opt.label}
              </span>

              {/* Active Background Animation */}
              {isActive && (
                <motion.div
                  layoutId={`active-indicator-${label || 'tabs'}`}
                  className="absolute inset-0 bg-primary -z-0 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
