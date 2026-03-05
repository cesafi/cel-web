'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DepartmentGroups from './department-groups';
import VolunteerSearch from './volunteer-search';
import { Calendar, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { moderniz, roboto } from '@/lib/fonts';
import { Season } from '@/lib/types/seasons';
import { Volunteer } from '@/lib/types/volunteers';
import { Department } from '@/lib/types/departments';

interface SeasonalTabsProps {
  initialSeasons: Season[];
  initialVolunteers: Volunteer[];
  initialDepartments: Department[];
}

export default function SeasonalTabs({
  initialSeasons,
  initialVolunteers,
  initialDepartments
}: SeasonalTabsProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const seasons = initialSeasons;
  const volunteers = initialVolunteers;
  const departments = initialDepartments;

  // Set the first season as default when seasons load
  if (!selectedSeasonId && seasons && seasons.length > 0) {
    setSelectedSeasonId(seasons[0].id);
  }

  // Handle Debounce for Search Term
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter volunteers by selected season and search term
  const filteredVolunteers = volunteers?.filter(volunteer => {
      // 1. Filter by season and active status
      if (volunteer.season_id !== selectedSeasonId || volunteer.is_active === false) return false;
      
      // 2. Filter by search term
      if (!debouncedSearchTerm.trim()) return true;
      const term = debouncedSearchTerm.toLowerCase().trim();
      
      return (
        volunteer.full_name?.toLowerCase().includes(term) ||
        volunteer.title?.toLowerCase().includes(term)
      );
    }
  ) || [];

  // Group volunteers by department, sort: titled first, then alphabetically by name
  const groupedVolunteers = departments?.map(department => ({
    department,
    volunteers: filteredVolunteers
      .filter(volunteer => volunteer.department_id === department.id)
      .sort((a, b) => {
        // Volunteers with title come first
        const aHasTitle = a.title ? 0 : 1;
        const bHasTitle = b.title ? 0 : 1;
        if (aHasTitle !== bHasTitle) return aHasTitle - bHasTitle;
        // Then alphabetically by name
        return a.full_name.localeCompare(b.full_name);
      })
  })).filter(group => group.volunteers.length > 0).sort((a, b) => {
    // Executive department always comes first
    const aIsExec = a.department.name?.toLowerCase().includes('executive') ? 0 : 1;
    const bIsExec = b.department.name?.toLowerCase().includes('executive') ? 0 : 1;
    return aIsExec - bIsExec;
  }) || [];

  if (!seasons || seasons.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 p-6 bg-muted/30 rounded-lg">
            <Calendar className="h-6 w-6 text-muted-foreground" />
            <span className={`${roboto.className} text-muted-foreground`}>
              No seasons available yet.
            </span>
          </div>
        </div>
      </section>
    );
  }

  const selectedSeason = seasons.find(season => season.id === selectedSeasonId);

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Unified Search and Filters Container */}
        <div className="w-full bg-card/40 backdrop-blur-md border border-border/50 shadow-lg rounded-xl overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4">
            
            {/* Left: Season Select Dropdown */}
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select
                value={selectedSeasonId?.toString() || ""}
                onValueChange={(val) => setSelectedSeasonId(Number(val))}
              >
                <SelectTrigger className="h-10 w-full bg-background shadow-sm font-medium text-sm border-border/50">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id.toString()}>
                        {season.name || `Season ${season.id}`}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Right: Search Bar */}
            <div className="w-full sm:w-[300px]">
              <VolunteerSearch 
                searchTerm={searchTerm} 
                onSearchChange={setSearchTerm} 
              />
            </div>
            
          </div>
        </div>

        {/* Results count text matching players page */}
        <p className={`${roboto.className} text-xs text-muted-foreground/50 mb-8`}>
          {filteredVolunteers.length} volunteer{filteredVolunteers.length !== 1 ? 's' : ''} found in {groupedVolunteers.length} department{groupedVolunteers.length !== 1 ? 's' : ''}
        </p>

        {/* Department Groups */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSeasonId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <DepartmentGroups
              departmentGroups={groupedVolunteers}
              isLoading={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
