'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="p-0 text-muted-foreground hover:text-foreground transition-colors duration-200"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            suppressHydrationWarning
          >
            {resolvedTheme === 'dark' ? (
              <SunIcon className="h-6 w-auto" />
            ) : (
              <MoonIcon className="h-6 w-auto" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{resolvedTheme === 'dark' ? 'Toggle Light Mode' : 'Toggle Dark Mode'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider >
  );
}
