'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface GameOption {
  id: string; // We can cast numbers to string for consistency
  name: string;
  shortName: string;
  logoUrl?: string | null;
}

interface CompactGameSelectorProps {
  options: GameOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'all' | 'dropdown' | 'buttons';
}

export function CompactGameSelector({
  options,
  value,
  onChange,
  className,
  variant = 'all',
}: CompactGameSelectorProps) {
  if (!options || options.length === 0) {
    return null;
  }

  const showDropdown = variant === 'all' || variant === 'dropdown';
  const showButtons = variant === 'all' || variant === 'buttons';

  const getActiveColors = (id: string) => {
    if (id === 'mlbb') {
      return {
        borderBg: "border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20",
        circle: "bg-blue-500 text-white",
        text: "text-blue-500 group-hover:text-blue-400"
      };
    }
    if (id === 'valorant') {
      return {
        borderBg: "border-red-500 bg-red-500/10 shadow-sm shadow-red-500/20",
        circle: "bg-red-500 text-white",
        text: "text-red-500 group-hover:text-red-400"
      };
    }
    // all or defaults
    return {
      borderBg: "border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/20",
      circle: "bg-amber-500 text-white",
      text: "text-amber-500 group-hover:text-amber-400"
    };
  };

  return (
    <>
      {/* Selection Box */}
      {showDropdown && (
      <div className={cn(variant === 'all' ? "sm:hidden w-full" : "w-full", className)}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9 w-full bg-background shadow-sm font-bold tracking-wide text-xs">
             <SelectValue placeholder="Select Game" />
          </SelectTrigger>
          <SelectContent>
             {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                     {option.logoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={option.logoUrl} alt={option.name} className="w-4 h-4 object-contain" />
                     ) : (
                         <div className="w-4 h-4 bg-muted text-muted-foreground rounded flex items-center justify-center text-[8px] font-bold">
                           {option.shortName.substring(0,2)}
                         </div>
                     )}
                     <span className="font-bold text-xs uppercase text-foreground">{option.shortName}</span>
                  </div>
                </SelectItem>
             ))}
          </SelectContent>
        </Select>
      </div>
      )}

      {/* Buttons */}
      {showButtons && (
      <div className={cn(variant === 'all' ? "hidden sm:flex items-center gap-2" : "flex items-center gap-2", className)}>
        {options.map((option) => {
          const isActive = value === option.id;
          const activeColors = getActiveColors(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              title={option.name}
              className={cn(
                "relative group flex items-center justify-center p-[2px] rounded-lg transition-all duration-200 ease-in-out border outline-none",
                isActive 
                  ? activeColors.borderBg
                  : "border-border/50 bg-background hover:bg-muted/50 hover:border-border"
              )}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 h-9">
                {option.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={option.logoUrl} 
                    alt={option.name} 
                    className={cn(
                      "w-5 h-5 object-contain transition-transform duration-200", 
                      isActive ? "scale-105" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
                    )} 
                  />
                ) : (
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-200",
                    isActive ? activeColors.circle : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  )}>
                    {option.shortName.substring(0, 2)}
                  </div>
                )}
                <span className={cn(
                  "font-bold text-xs tracking-wide uppercase transition-colors duration-200",
                  isActive ? activeColors.text : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {option.shortName}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      )}
    </>
  );
}
