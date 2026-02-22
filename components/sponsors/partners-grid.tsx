'use client';

import { useTheme } from 'next-themes';
import { Sponsor } from '@/lib/types/sponsors';
import { roboto } from '@/lib/fonts';

interface PartnersGridProps {
    sponsors: Sponsor[];
}

const TIER_CONFIG = {
    title: {
        label: 'Title Sponsors',
        subtitle: 'The organizations powering the CESAFI Esports League all season long.',
        logoSize: 'w-36 h-24 md:w-48 md:h-32 lg:w-56 lg:h-36',
        cardStyle: 'bg-card border border-primary/20 hover:border-primary/50 shadow-lg hover:shadow-primary/10',
    },
    venue: {
        label: 'Venue Sponsors',
        subtitle: 'Providing world-class venues for our competitions.',
        logoSize: 'w-28 h-20 md:w-36 md:h-24 lg:w-44 lg:h-28',
        cardStyle: 'bg-card border border-border hover:border-primary/30 shadow-md hover:shadow-lg',
    },
    event: {
        label: 'Event Sponsors',
        subtitle: 'Supporting our opening and finale events.',
        logoSize: 'w-24 h-16 md:w-32 md:h-20 lg:w-40 lg:h-24',
        cardStyle: 'bg-card border border-border hover:border-primary/30 shadow-md hover:shadow-lg',
    },
} as const;

type SponsorType = keyof typeof TIER_CONFIG;

export default function PartnersGrid({ sponsors }: PartnersGridProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Group sponsors by type
    const grouped: Record<SponsorType, Sponsor[]> = { title: [], venue: [], event: [] };
    const uncategorized: Sponsor[] = [];

    sponsors.forEach((sponsor) => {
        if (sponsor.type && sponsor.type in grouped) {
            grouped[sponsor.type as SponsorType].push(sponsor);
        } else {
            uncategorized.push(sponsor);
        }
    });

    const getLogoSrc = (sponsor: Sponsor) => {
        if (isDark && sponsor.dark_logo_url) return sponsor.dark_logo_url;
        return sponsor.logo_url || '/img/cesafi-logo.webp';
    };

    const tierOrder: SponsorType[] = ['title', 'venue', 'event'];

    return (
        <section className="bg-background py-16 sm:py-20 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {tierOrder.map((tier) => {
                    const sponsorsInTier = grouped[tier];
                    if (sponsorsInTier.length === 0) return null;
                    const config = TIER_CONFIG[tier];

                    return (
                        <div key={tier} className="mb-10 sm:mb-16 last:mb-0">
                            {/* Section Header */}
                            <div className="text-center mb-6 sm:mb-10">
                                <h2 className="text-2xl font-bold text-foreground mb-2 sm:text-3xl">
                                    {config.label}
                                </h2>
                                <p className={`${roboto.className} text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto`}>
                                    {config.subtitle}
                                </p>
                            </div>

                            {/* Sponsor Cards */}
                            <div className={`flex flex-wrap justify-center gap-4 sm:gap-8 lg:gap-10`}>
                                {sponsorsInTier.map((sponsor) => (
                                    <div
                                        key={sponsor.id}
                                        className={`group rounded-xl sm:rounded-2xl p-4 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${config.cardStyle}`}
                                    >
                                        <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                                            {/* Logo */}
                                            <div className={`${config.logoSize} relative transition-transform duration-300 group-hover:scale-105`}>
                                                <img
                                                    src={getLogoSrc(sponsor)}
                                                    alt={sponsor.title}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-1 max-w-[180px] sm:max-w-[240px]">
                                                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                                    {sponsor.title}
                                                </h3>
                                                <p className={`${roboto.className} text-xs text-muted-foreground sm:text-sm line-clamp-2`}>
                                                    {sponsor.tagline}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Uncategorized sponsors (if any) */}
                {uncategorized.length > 0 && (
                    <div className="mb-16 last:mb-0">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-foreground mb-2 sm:text-3xl">
                                Our Supporters
                            </h2>
                            <p className={`${roboto.className} text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto`}>
                                Additional organizations supporting the league.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-10">
                            {uncategorized.map((sponsor) => (
                                <div
                                    key={sponsor.id}
                                    className="group rounded-2xl p-6 sm:p-8 bg-card border border-border hover:border-primary/30 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-24 h-16 md:w-32 md:h-20 lg:w-40 lg:h-24 relative transition-transform duration-300 group-hover:scale-105">
                                            <img
                                                src={getLogoSrc(sponsor)}
                                                alt={sponsor.title}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="space-y-1 max-w-[240px]">
                                            <h3 className="text-base font-semibold text-foreground sm:text-lg">
                                                {sponsor.title}
                                            </h3>
                                            <p className={`${roboto.className} text-xs text-muted-foreground sm:text-sm line-clamp-2`}>
                                                {sponsor.tagline}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
