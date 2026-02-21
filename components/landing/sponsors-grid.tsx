
import { getActiveSponsors } from '@/actions/sponsors';
import { Sponsor } from '@/lib/types/sponsors';
import SponsorLogoList from './sponsor-logo-list';

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
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 font-moderniz uppercase tracking-wider">
          <span className="text-emerald">Our</span> <span className="text-teal">Partners</span>
        </h2>

        <SponsorLogoList sponsors={sponsors} />
      </div>
    </section>
  );
}
