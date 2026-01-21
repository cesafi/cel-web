'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
// Removed unused Skeleton import
import { Building2, Plus } from 'lucide-react';
import { roboto } from '@/lib/fonts';
import SchoolsSearch from './schools-search';
import { School } from '@/lib/types/schools';

interface SchoolsGridProps {
  initialSchools: School[];
}

export default function SchoolsGrid({ initialSchools }: SchoolsGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const schools = initialSchools;

  // Filter schools based on search term
  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    
    if (!searchTerm.trim()) return schools;
    
    const term = searchTerm.toLowerCase().trim();
    return schools.filter(school => 
      school.name.toLowerCase().includes(term) ||
      school.abbreviation.toLowerCase().includes(term)
    );
  }, [schools, searchTerm]);

  // Show empty state if no schools
  if (schools.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto" />
            <h3 className="text-xl font-semibold text-foreground">No active schools found</h3>
            <p className="text-muted-foreground">Check back later for updates.</p>
          </div>
        </div>
      </section>
    );
  }

  // Show no search results state
  if (schools.length > 0 && filteredSchools.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mb-12">
            <SchoolsSearch 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
            />
          </div>
          
          {/* No Results */}
          <div className="text-center py-20">
            <div className="space-y-4">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">No schools found</h3>
              <p className="text-muted-foreground">
                No schools match your search for &quot;{searchTerm}&quot;. Try a different search term.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-12">
          <SchoolsSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        </div>

        {/* Results Count */}
        {searchTerm && (
          <div className="mb-8 text-center">
            <p className="text-muted-foreground">
              Showing {filteredSchools.length} of {schools.length} schools
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredSchools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
                       <Link href={`/schools/${school.abbreviation.toLowerCase()}`} className="block">
                <div className="bg-background/40 backdrop-blur-lg rounded-lg shadow-lg border border-border/30 overflow-hidden group-hover:shadow-xl group-hover:bg-background/50 group-hover:backdrop-blur-xl transition-all duration-300">
                  <div className="p-4 md:p-8 text-center h-56 md:h-80 flex flex-col justify-between">
                    {/* School Logo - Responsive size */}
                    <div className="flex justify-center">
                      <div className="relative h-20 w-20 md:h-32 md:w-32 rounded-lg overflow-hidden bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                        {school.logo_url ? (
                          <Image
                            src={school.logo_url}
                            alt={school.name}
                            fill
                            className="object-contain p-2 md:p-4"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Image
                              src="/img/cesafi-logo.webp"
                              alt="CESAFI Logo"
                              width={100}
                              height={100}
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* School Info */}
                    <div className="space-y-1 md:space-y-2">
                      <h2 className={`${roboto.className} text-sm md:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight`} style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {school.name}
                      </h2>
                      <p className={`${roboto.className} text-xs md:text-sm text-muted-foreground`}>
                        {school.abbreviation}
                      </p>
                    </div>

                    {/* View Profile Indicator */}
                    <div className="bg-white/20 rounded-full px-3 py-1.5 md:px-4 md:py-2 inline-flex items-center justify-center gap-1.5 md:gap-2 group-hover:bg-primary/20 transition-colors duration-300">
                      <Plus className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                      <span className={`${roboto.className} text-[10px] md:text-xs text-muted-foreground group-hover:text-primary transition-colors duration-300`}>
                        VIEW PROFILE
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
