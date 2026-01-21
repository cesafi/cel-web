'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SchoolsSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export default function SchoolsSearch({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search schools by name or abbreviation..." 
}: SchoolsSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`pl-10 pr-10 h-12 text-base border-2 transition-all duration-200 ${
            isFocused 
              ? 'border-primary shadow-lg shadow-primary/20' 
              : 'border-border hover:border-primary/50'
          }`}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Search results count indicator */}
      {searchTerm && (
        <div className="mt-2 text-sm text-muted-foreground text-center">
          <span className="inline-flex items-center gap-1">
            <Search className="h-3 w-3" />
            Searching for &quot;{searchTerm}&quot;
          </span>
        </div>
      )}
    </div>
  );
}

