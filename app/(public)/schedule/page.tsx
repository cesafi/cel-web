import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { SeasonProvider } from '@/components/contexts/season-provider';
import { ScheduleContent } from '@/components/schedule';
import { getScheduleMatchesAroundDate, getAvailableSportCategories, getAvailableSeasons, getAvailableStages } from '@/actions/matches';
import { ScheduleMatch } from '@/lib/types/matches';
import { moderniz, roboto } from '@/lib/fonts';

export default async function SchedulePage() {
  // Fetch initial data server-side using bidirectional loading
  const [matchesResult, categoriesResult, seasonsResult, stagesResult] = await Promise.all([
    getScheduleMatchesAroundDate({
      totalLimit: 40,
      filters: {}
    }),
    getAvailableSportCategories(),
    getAvailableSeasons(),
    getAvailableStages()
  ]);

  const matches = matchesResult.success && matchesResult.data ? matchesResult.data.matches : [];
  const hasMorePast = matchesResult.success && matchesResult.data ? matchesResult.data.hasMorePast : false;
  const hasMoreFuture = matchesResult.success && matchesResult.data ? matchesResult.data.hasMoreFuture : false;
  const pastCursor = matchesResult.success && matchesResult.data ? matchesResult.data.pastCursor : null;
  const futureCursor = matchesResult.success && matchesResult.data ? matchesResult.data.futureCursor : null;
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];
  const seasons = seasonsResult.success && seasonsResult.data ? seasonsResult.data : [];
  const stages = stagesResult.success && stagesResult.data ? stagesResult.data : [];

  // Calculate stats
  const liveMatches = matches.filter((m) => m.status === 'live').length;
  const todaysMatches = matches.filter((m) => m.isToday).length;
  const upcomingMatches = matches.filter((m) => !m.isPast).length;

  const stats = [
    {
      icon: TrendingUp,
      value: liveMatches.toString(),
      label: 'Live Matches',
      colorClass: 'text-emerald-500'
    },
    {
      icon: Calendar,
      value: todaysMatches.toString(),
      label: "Today's Matches",
      colorClass: 'text-primary'
    },
    {
      icon: Clock,
      value: upcomingMatches.toString(),
      label: 'Upcoming',
      colorClass: 'text-amber-500'
    }
  ];

  return (
    <SeasonProvider>
      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <section className="from-primary/10 via-background to-secondary/10 relative bg-gradient-to-br pt-20 pb-12 sm:pt-24 sm:pb-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Main Heading */}
              <h1
                className={`${moderniz.className} text-foreground mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-6xl lg:text-7xl`}
              >
                Match <span className="text-gradient-cel">Schedule</span>
              </h1>

              {/* Subtitle */}
              <p
                className={`${roboto.className} text-muted-foreground mx-auto mb-8 max-w-3xl text-base leading-relaxed sm:mb-12 sm:text-lg md:text-xl`}
              >
                Follow all CESAFI matches with real-time updates and live scores across all sports
                and categories.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 max-w-4xl mx-auto sm:gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center group">
                    <div className="p-2 sm:p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300 mb-2 sm:mb-4">
                      <stat.icon className={`h-4 w-4 sm:h-8 sm:w-8 ${stat.colorClass}`} />
                    </div>
                    <div
                      className={`${moderniz.className} text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-0.5 sm:mb-2`}
                    >
                      {stat.value}
                    </div>
                    <div
                      className={`${roboto.className} text-muted-foreground text-[10px] sm:text-sm font-medium text-center`}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto max-w-[1000px] px-4 py-6 sm:py-8">
          <ScheduleContent 
            initialMatches={matches} 
            initialHasMorePast={hasMorePast}
            initialHasMoreFuture={hasMoreFuture}
            initialPastCursor={pastCursor}
            initialFutureCursor={futureCursor}
            availableCategories={categories}
            availableSeasons={seasons}
            availableStages={stages}
          />
        </div>
      </div>
    </SeasonProvider>
  );
}

