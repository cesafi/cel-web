'use client';

import { moderniz, roboto } from '@/lib/fonts';
import { useAllTimelineEntries } from '@/hooks/use-timeline';
import { Timeline } from '@/lib/types/timeline';

export default function CesafiTimeline() {
  const { data: timelineEvents, isLoading, error } = useAllTimelineEntries();

  const getCategoryColor = (_category: Timeline['category']) => {
    // All categories now use primary color for consistency
    return 'bg-primary text-primary-foreground';
  };

  const getCategoryLabel = (category: Timeline['category']) => {
    switch (category) {
      case 'founding':
        return 'Founding';
      case 'milestone':
        return 'Milestone';
      case 'award':
        return 'Award';
      case 'expansion':
        return 'Expansion';
      case 'achievement':
        return 'Achievement';
      default:
        return 'Event';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <section className="bg-background relative overflow-hidden py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-muted/50 rounded-lg mb-8 mx-auto w-3/4"></div>
              <div className="h-6 bg-muted/50 rounded-lg mx-auto w-1/2"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="bg-background relative overflow-hidden py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={`${moderniz.className} text-foreground mb-8 text-4xl leading-tight font-bold lg:text-5xl xl:text-6xl`}>
              CESAFI
              <br />
              <span className="text-primary">TIMELINE</span>
            </h2>
            <p className={`${roboto.className} text-muted-foreground mx-auto max-w-4xl text-xl leading-relaxed lg:text-2xl`}>
              Unable to load timeline events. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Show empty state
  if (!timelineEvents || timelineEvents.length === 0) {
    return (
      <section className="bg-background relative overflow-hidden py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={`${moderniz.className} text-foreground mb-8 text-4xl leading-tight font-bold lg:text-5xl xl:text-6xl`}>
              CESAFI
              <br />
              <span className="text-primary">TIMELINE</span>
            </h2>
            <p className={`${roboto.className} text-muted-foreground mx-auto max-w-4xl text-xl leading-relaxed lg:text-2xl`}>
              No timeline events available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center sm:mb-16 lg:mb-20">
          <h2
            className={`${moderniz.className} text-foreground mb-6 text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl xl:text-6xl`}
          >
            CESAFI
            <br />
            <span className="text-primary">TIMELINE</span>
          </h2>

          <p
            className={`${roboto.className} text-muted-foreground mx-auto max-w-4xl text-lg leading-relaxed sm:text-xl lg:text-2xl`}
          >
            A journey through 25 years of excellence in Cebu collegiate sports, celebrating
            milestones, achievements, and the spirit of competition.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line - Hidden on mobile, visible on larger screens */}
          <div className="hidden md:block absolute left-1/2 h-full w-2 -translate-x-1/2 transform">
            <div className="from-secondary via-primary to-accent h-full w-full rounded-full bg-gradient-to-b opacity-60"></div>
            <div className="from-secondary via-primary to-accent absolute inset-0 h-full w-full animate-pulse rounded-full bg-gradient-to-b opacity-30"></div>
          </div>

          {/* Timeline Events */}
          <div className="space-y-8 sm:space-y-12 lg:space-y-20">
            {timelineEvents.map((event, index) => (
              <div
                key={event.id}
                className={`relative flex flex-col items-center md:flex-row ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline Dot - Mobile: centered, Desktop: positioned */}
                <div className="relative z-10 mb-6 md:absolute md:left-1/2 md:-translate-x-1/2 md:transform md:mb-0">
                  {/* Main Dot */}
                  <div className={`w-12 h-12 rounded-full ${getCategoryColor(event.category)} flex items-center justify-center text-lg font-bold shadow-2xl border-2 border-background`}>                       
                    <span className="text-xl">🏆</span>
                  </div>
                  
                  {/* Year Badge - Mobile: below dot, Desktop: above */}
                  <div
                    className={`mt-2 md:absolute md:-top-12 md:left-1/2 md:-translate-x-1/2 md:transform md:mt-0 rounded-full px-3 py-1 text-xs font-bold ${getCategoryColor(event.category)} shadow-lg`}
                  >
                    {event.year}
                  </div>
                </div>

                {/* Event Content - Mobile: full width, Desktop: 5/12 width */}
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                  <div
                    className={`bg-background/90 border-border/50 hover:border-primary/30 relative overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${           
                      event.is_highlight ? 'ring-primary/20 shadow-lg ring-2' : ''
                    }`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="from-primary/20 to-secondary/20 absolute inset-0 bg-gradient-to-br via-transparent"></div>
                    </div>

                    {/* Image Placeholder with Enhanced Design */}
                    <div className="from-muted/30 via-muted/20 to-muted/40 relative h-32 overflow-hidden bg-gradient-to-br sm:h-40 lg:h-48">
                      {/* Background Elements */}
                      <div className="absolute inset-0">
                        <div className="bg-primary/10 absolute top-2 right-2 h-12 w-12 rounded-full sm:top-4 sm:right-4 sm:h-20 sm:w-20" />
                        <div className="bg-secondary/10 absolute bottom-2 left-2 h-10 w-10 rounded-full sm:bottom-4 sm:left-4 sm:h-16 sm:w-16" />
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          {/* Icon Container */}
                          <div className="from-primary/20 to-secondary/20 relative mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br shadow-lg sm:mb-4 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
                            <span className="text-lg sm:text-2xl lg:text-3xl">🏆</span>
                          </div>

                          <p className={`${roboto.className} text-muted-foreground px-2 text-xs sm:px-4 sm:text-sm`}>
                            {event.title}
                          </p>
                        </div>
                      </div>

                      {/* Enhanced Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 sm:p-6">
                      {/* Decorative Corner Elements - Hidden on mobile */}
                      <div className="hidden sm:block border-primary/20 absolute top-4 right-4 h-8 w-8 rounded-tr-lg border-t-2 border-r-2"></div>
                      <div className="hidden sm:block border-secondary/20 absolute bottom-4 left-4 h-8 w-8 rounded-bl-lg border-b-2 border-l-2"></div>

                      {/* Year Badge - Hidden on mobile (shown above dot) */}
                      <div
                        className={`hidden md:inline-flex mb-4 items-center rounded-full px-4 py-2 text-sm font-bold ${getCategoryColor(event.category)} shadow-lg`}
                      >
                        {event.year}
                      </div>

                      {/* Category Label */}
                      <div className="mb-2 sm:mb-3">
                        <span
                          className={`${roboto.className} text-muted-foreground text-xs font-medium tracking-wide uppercase`}
                        >
                          {getCategoryLabel(event.category)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className={`${moderniz.className} mb-3 text-lg font-bold sm:mb-4 sm:text-xl lg:text-2xl ${
                          event.is_highlight ? 'text-accent' : 'text-foreground'
                        }`}
                      >
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p
                        className={`${roboto.className} text-muted-foreground mb-4 text-sm leading-relaxed sm:text-base`}
                      >
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Spacer for alternating layout - Hidden on mobile */}
                <div className="hidden md:block w-5/12"></div>

                {/* Connecting Line to Next Event - Hidden on mobile */}
                {index < timelineEvents.length - 1 && (
                  <div
                    className="from-primary/40 to-secondary/40 hidden md:block absolute left-1/2 h-20 w-1 -translate-x-1/2 transform bg-gradient-to-b"
                    style={{ top: '100%' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center sm:mt-16 lg:mt-20">
          <div className="from-primary/10 via-primary/5 to-primary/10 border-primary/20 rounded-2xl border bg-gradient-to-r p-6 sm:rounded-3xl sm:p-8">
            <h3 className={`${moderniz.className} text-foreground mb-3 text-xl font-bold sm:mb-4 sm:text-2xl`}>
              Be Part of Our History
            </h3>
            <p className={`${roboto.className} text-muted-foreground mx-auto mb-4 max-w-2xl text-sm sm:mb-6 sm:text-base`}>
              Join us as we continue to write the next chapter of CESAFI&apos;s legacy. Whether as a
              student-athlete, coach, or supporter, your story matters.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <button
                className={`${roboto.className} bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 sm:rounded-xl sm:px-8 sm:py-3 sm:text-base`}
              >
                Learn More About CESAFI
              </button>
              <button
                className={`${roboto.className} border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg border-2 px-6 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 sm:rounded-xl sm:px-8 sm:py-3 sm:text-base`}
              >
                View Current Season
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
