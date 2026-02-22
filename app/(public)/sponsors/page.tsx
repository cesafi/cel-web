import { getActiveSponsors } from '@/actions/sponsors';
import { Sponsor } from '@/lib/types/sponsors';
import { moderniz, roboto } from '@/lib/fonts';
import { Handshake, MapPin, CalendarCheck } from 'lucide-react';
import PartnersGrid from '@/components/sponsors/partners-grid';

export default async function SponsorsPage() {
  // Fetch active sponsors server-side
  const sponsorsResult = await getActiveSponsors();
  const sponsors: Sponsor[] = sponsorsResult.success && sponsorsResult.data ? sponsorsResult.data : [];

  // Calculate stats per type
  const titleCount = sponsors.filter((s) => s.type === 'title').length;
  const venueCount = sponsors.filter((s) => s.type === 'venue').length;
  const eventCount = sponsors.filter((s) => s.type === 'event').length;

  const stats = [
    {
      icon: Handshake,
      value: titleCount.toString(),
      label: 'Title Partners',
    },
    {
      icon: MapPin,
      value: venueCount.toString(),
      label: 'Venue Partners',
    },
    {
      icon: CalendarCheck,
      value: eventCount.toString(),
      label: 'Event Partners',
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
              Our
              <span className="block text-primary">Sponsors</span>
            </h1>

            {/* Subtitle */}
            <p className={`${roboto.className} text-base text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed sm:text-lg sm:mb-12 md:text-xl`}>
              The organizations and companies that power the CESAFI Esports League
              through their commitment to student-athletes and competitive gaming.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 max-w-4xl mx-auto mb-8 sm:gap-8 sm:mb-12">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center group"
                >
                  <div className="p-2 sm:p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300 mb-2 sm:mb-4">
                    <stat.icon className="h-4 w-4 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div className={`${moderniz.className} text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-0.5 sm:mb-2`}>
                    {stat.value}
                  </div>
                  <div className={`${roboto.className} text-muted-foreground text-[10px] sm:text-sm font-medium text-center`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Grid */}
      <PartnersGrid sponsors={sponsors} />
    </>
  );
}
