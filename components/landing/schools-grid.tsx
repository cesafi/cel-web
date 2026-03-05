import { School } from '@/lib/types/schools';
import Image from 'next/image';
import { moderniz, roboto } from '@/lib/fonts';

interface SchoolsGridProps {
  schools: School[];
}

export default function SchoolsGrid({ schools }: SchoolsGridProps) {
  if (!schools || schools.length === 0) {
    return (
      <section className="overflow-hidden">
        <div className="py-8 w-full text-center text-gray-500">
          Unable to load schools
        </div>
      </section>
    );
  }

  const logos = schools.map((school: School) => ({
    src: school.logo_url || '/img/cesafi-logo.webp',
    alt: school.logo_url ? `${school.name} Logo` : `${school.name} - CESAFI Logo`,
    url: `/schools/${school.abbreviation.toLowerCase()}`
  }));

  return (
    <section id="schools-section" className="relative bg-background pt-16 pb-12 overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <h2 className={`${moderniz.className} text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Participating <span className="text-gradient-cel">Schools</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            The member institutions competing in CESAFI esports
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 lg:gap-14">
          {logos.map((school, index) => (
            <div key={`${school.src}-${index}`} className="group relative">
              {school.url ? (
                <a
                  href={school.url}
                  className="block w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative transition-all duration-300 transform hover:scale-110"
                >
                  <Image
                    src={school.src}
                    alt={school.alt}
                    fill
                    sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 96px"
                    className="object-contain"
                  />
                </a>
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative transition-all duration-300 transform hover:scale-110">
                  <Image
                    src={school.src}
                    alt={school.alt}
                    fill
                    sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 96px"
                    className="object-contain"
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
