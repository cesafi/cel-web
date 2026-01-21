'use client';

import { motion } from 'framer-motion';
import VolunteerCard from './volunteer-card';
import { Users, Building2 } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import type { Volunteer } from '@/lib/types/volunteers';
import type { Department } from '@/lib/types/departments';

interface DepartmentGroup {
  department: Department;
  volunteers: Volunteer[];
}

interface DepartmentGroupsProps {
  departmentGroups: DepartmentGroup[];
  isLoading: boolean;
}

export default function DepartmentGroups({ departmentGroups, isLoading }: DepartmentGroupsProps) {
  if (isLoading) {
    return (
      <div className="space-y-12">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-6">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-80 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!departmentGroups || departmentGroups.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center gap-3 p-8 bg-muted/30 rounded-lg">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className={`${moderniz.className} text-lg font-semibold text-foreground mb-1`}>
              No Volunteers Yet
            </p>
            <p className={`${roboto.className} text-muted-foreground text-sm`}>
              Volunteers for this season will be displayed here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {departmentGroups.map((group, groupIndex) => (
        <motion.div
          key={group.department.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
          className="space-y-8"
        >
          {/* Department Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-border/30">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className={`${moderniz.className} text-2xl md:text-3xl font-bold text-foreground`}>
                {group.department.name}
              </h3>
              <p className={`${roboto.className} text-muted-foreground`}>
                {group.volunteers.length} volunteer{group.volunteers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Volunteers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {group.volunteers.map((volunteer, volunteerIndex) => (
              <motion.div
                key={volunteer.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: groupIndex * 0.1 + volunteerIndex * 0.05 
                }}
              >
                <VolunteerCard volunteer={volunteer} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
