import { getPublicActiveSchools } from '@/actions/schools'
import { School } from '@/lib/types/schools';

export default async function SchoolsGrid() {
  const schoolsResponse = await getPublicActiveSchools();

  if (!schoolsResponse.success || !schoolsResponse.data) {
    return (
      <section className="overflow-hidden">
        <div className="py-8 w-full text-center text-gray-500">
          Unable to load schools
        </div>
      </section>
    );
  }

  const schools = schoolsResponse.data;

  const logos = schools.map((school: School) => ({
    src: school.logo_url || '/img/cesafi-logo.webp',
    alt: school.logo_url ? `${school.name} Logo` : `${school.name} - CESAFI Logo`,
    url: `/schools/${school.abbreviation.toLowerCase()}`
  }));

  return (
    <section className="relative bg-muted pt-16 pb-12 overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 font-moderniz uppercase tracking-wider">
          <span className="text-teal">Participating</span> <span className="text-emerald">Schools</span>
        </h2>
        
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 lg:gap-14">
          {logos.map((school, index) => (
            <div key={`${school.src}-${index}`} className="group relative">
              {school.url ? (
                <a 
                  href={school.url}
                  className="block w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative transition-all duration-300 transform hover:scale-110"
                >
                  <img
                    src={school.src}
                    alt={school.alt}
                    className="w-full h-full object-contain"
                  />
                </a>
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative transition-all duration-300 transform hover:scale-110">
                  <img
                    src={school.src}
                    alt={school.alt}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
