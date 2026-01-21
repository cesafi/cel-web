'use client';

import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAllSchools } from '@/hooks/use-schools';
import Image from 'next/image';

interface SchoolSelectorProps {
  selectedSchoolId: string | null;
  onSchoolChange: (schoolId: string) => void;
  className?: string;
}

export function SchoolSelector({
  selectedSchoolId,
  onSchoolChange,
  className
}: SchoolSelectorProps) {
  const { data: schools, isLoading } = useAllSchools();

  // Auto-select first school if none selected and schools are available
  useEffect(() => {
    if (!selectedSchoolId && schools && schools.length > 0) {
      onSchoolChange(schools[0].id);
    }
  }, [selectedSchoolId, schools, onSchoolChange]);

  const selectedSchool = schools?.find((school) => school.id === selectedSchoolId);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>Select School</Label>
        <div className="bg-muted h-10 animate-pulse rounded-md" />
      </div>
    );
  }

  if (!schools || schools.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>Select School</Label>
        <div className="text-muted-foreground text-sm">No schools available</div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="school-selector">Select School</Label>
      <Select value={selectedSchoolId || ''} onValueChange={onSchoolChange}>
        <SelectTrigger id="school-selector" className="w-full">
          <SelectValue placeholder="Choose a school" />
        </SelectTrigger>
        <SelectContent>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              <div className="flex items-center space-x-2">
                {school.logo_url && (
                  <Image
                    src={school.logo_url || '/img/cesafi-logo.webp'}
                    alt={`${school.name} logo`}
                    className="h-4 w-4 rounded-sm"
                    width={64}
                    height={64}
                  />
                )}
                <span>{school.name}</span>
                {school.abbreviation && (
                  <span className="text-muted-foreground text-xs">({school.abbreviation})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSchool && (
        <div className="text-muted-foreground text-sm">
          Managing teams for <span className="font-medium">{selectedSchool.name}</span>
        </div>
      )}
    </div>
  );
}
