import SeasonalTabs from '@/components/volunteers/seasonal-tabs';
import { getAllSeasons } from '@/actions/seasons';
import { getAllVolunteers } from '@/actions/volunteers';
import { getAllDepartments } from '@/actions/departments';
import { Season } from '@/lib/types/seasons';
import { Volunteer } from '@/lib/types/volunteers';
import { Department } from '@/lib/types/departments';
import { moderniz, roboto } from '@/lib/fonts';
import { Users, Briefcase, Calendar } from 'lucide-react';

export default async function VolunteersPage() {
  // Fetch initial data server-side
  const [seasonsResult, volunteersResult, departmentsResult] = await Promise.all([
    getAllSeasons(),
    getAllVolunteers(),
    getAllDepartments()
  ]);

  const seasons: Season[] = seasonsResult.success && seasonsResult.data ? seasonsResult.data : [];
  const volunteers: Volunteer[] = volunteersResult.success && volunteersResult.data ? volunteersResult.data : [];
  const departments: Department[] = departmentsResult.success && departmentsResult.data ? departmentsResult.data : [];

  // Calculate metrics server-side
  const activeVolunteers = volunteers.filter(volunteer => volunteer.is_active !== false);
  const totalActiveVolunteers = activeVolunteers.length;
  const totalDepartments = departments.length;
  const totalSeasons = seasons.length;

  const stats = [
    { 
      icon: Users, 
      value: totalActiveVolunteers.toString(), 
      label: 'Active Volunteers',
    },
    { 
      icon: Briefcase, 
      value: totalDepartments.toString(), 
      label: 'Departments',
    },
    { 
      icon: Calendar, 
      value: totalSeasons.toString(), 
      label: 'Seasons',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-16 sm:min-h-[70vh] sm:pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className={`${moderniz.className} text-3xl font-bold text-foreground mb-4 sm:text-4xl sm:mb-6 md:text-6xl lg:text-7xl`}>
              Meet Our
              <span className="block text-primary">Volunteers</span>
            </h1>

            {/* Subtitle */}
            <p className={`${roboto.className} text-base text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed sm:text-lg sm:mb-12 md:text-xl`}>
              Dedicated individuals who make CESAFI possible through their passion, 
              commitment, and unwavering support for student athletics across all seasons.
            </p>

            {/* Main Stats */}
            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto mb-8 sm:gap-8 sm:mb-12 sm:grid-cols-2 md:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center group"
                >
                  <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300 mb-3 sm:p-4 sm:mb-4">
                    <stat.icon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                  </div>
                  <div className={`${moderniz.className} text-2xl font-bold text-foreground mb-1 sm:text-3xl sm:mb-2 md:text-4xl`}>
                    {stat.value}
                  </div>
                  <div className={`${roboto.className} text-muted-foreground text-xs font-medium text-center sm:text-sm`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SeasonalTabs 
        initialSeasons={seasons}
        initialVolunteers={volunteers}
        initialDepartments={departments}
      />
    </>
  );
}
