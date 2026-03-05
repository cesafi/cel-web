
import { getActiveSponsors } from '@/actions/sponsors';
import { Sponsor } from '@/lib/types/sponsors';
import SponsorLogoList from './sponsor-logo-list';
import { moderniz, roboto } from '@/lib/fonts';

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

  return (
    <section className="bg-background py-12 overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 md:mb-20">
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Our <span className="text-primary">Partners</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            Proudly supported by our valued sponsors and partners
          </p>
        </div>

        <SponsorLogoList sponsors={sponsors} />
      </div>
    </section>
  );
}
