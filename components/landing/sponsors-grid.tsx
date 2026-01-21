
import { getActiveSponsors } from '@/actions/sponsors';
import { Sponsor } from '@/lib/types/sponsors';

export default async function SponsorsGrid() {
  const sponsorsResponse = await getActiveSponsors();

  // Handle the case where the API call fails
  if (!sponsorsResponse.success || !sponsorsResponse.data) {
    return (
      <section className="overflow-hidden">
        <div className="py-8 w-full text-center text-gray-500">
          Unable to load sponsors
        </div>
      </section>
    );
  }

  const sponsors = sponsorsResponse.data;

  const logos = sponsors.map((sponsor: Sponsor) => ({
    src: sponsor.logo_url || '/img/cesafi-logo.webp',
    alt: sponsor.logo_url ? sponsor.title : `${sponsor.title} - CESAFI Logo`
  }));

  return (
    <section className="bg-muted/30 py-12 overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 font-moderniz uppercase tracking-wider">
          <span className="text-emerald">Our</span> <span className="text-teal">Partners</span>
        </h2>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
          {logos.map((sponsor, index) => (
            <div key={`${sponsor.src}-${index}`} className="group relative">
               <div className="w-24 h-16 md:w-32 md:h-20 lg:w-40 lg:h-24 relative transition-all duration-300 transform hover:scale-105">
                  <img
                    src={sponsor.src}
                    alt={sponsor.alt}
                    className="w-full h-full object-contain"
                  />
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
