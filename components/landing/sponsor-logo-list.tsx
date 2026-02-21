'use client';

import { useTheme } from 'next-themes';
import { Sponsor } from '@/lib/types/sponsors';

interface SponsorLogoListProps {
    sponsors: Sponsor[];
}

export default function SponsorLogoList({ sponsors }: SponsorLogoListProps) {
    const { resolvedTheme } = useTheme();

    const logos = sponsors.map((sponsor) => {
        const isDark = resolvedTheme === 'dark';
        const src = isDark && sponsor.dark_logo_url
            ? sponsor.dark_logo_url
            : sponsor.logo_url || '/img/cesafi-logo.webp';
        const alt = sponsor.logo_url ? sponsor.title : `${sponsor.title} - CESAFI Logo`;

        return { src, alt };
    });

    return (
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
    );
}
