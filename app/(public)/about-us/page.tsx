import AboutUsFaq from '@/components/about-us/about-us-faq';
import AboutUsArticles from '@/components/about-us/about-us-articles';
import AboutUsArticlesLoading from '@/components/about-us/about-us-articles-loading';
import CesafiTimeline from '@/components/about-us/cesafi-timeline';
import { getAboutUsFaq } from '@/actions/faq';
import { Faq } from '@/lib/types/faq';
import { moderniz, roboto } from '@/lib/fonts';
import Image from 'next/image';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | CESAFI Esports League',
  description: 'Learn about the CESAFI Esports League - the official esports league of the Cebu Schools Athletic Foundation, Inc.',
};

export default async function AboutUsPage() {
  // Fetch About Us FAQs server-side
  let aboutUsFaqs: Faq[] = [];

  try {
    const faqResult = await getAboutUsFaq();
    if (faqResult.success && 'data' in faqResult && Array.isArray(faqResult.data)) {
      aboutUsFaqs = faqResult.data;
    }
  } catch (error) {
    console.error('Error fetching About Us FAQ items:', error);
    // aboutUsFaqs remains empty array
  }

  return (
    <>
      {/* Hero Section */}
      <section className="bg-background relative flex min-h-[60vh] sm:min-h-screen items-center overflow-hidden pt-20 pb-12 sm:pb-0">
        {/* Background with dynamic light streaks */}
        <div className="absolute inset-0">
          <div className="from-background via-muted/20 to-background h-full w-full bg-gradient-to-br" />

          {/* Static light streaks */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="via-primary absolute top-1/4 left-0 h-1 w-full bg-gradient-to-r from-transparent to-transparent opacity-30 blur-sm" />
            <div className="via-secondary absolute top-1/2 left-0 h-1 w-full bg-gradient-to-r from-transparent to-transparent opacity-20 blur-sm" />
            <div className="via-accent absolute top-3/4 left-0 h-1 w-full bg-gradient-to-r from-transparent to-transparent opacity-40 blur-sm" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2">
            {/* Left Section - Text Content */}
            <div className="space-y-4 sm:space-y-8 text-center md:text-left">
              <div>
                <h1
                  className={`${moderniz.className} text-foreground mb-3 sm:mb-6 text-3xl sm:text-5xl leading-tight font-bold lg:text-6xl xl:text-7xl`}
                >
                  CESAFI
                  <br />
                  <span className="text-primary">ESPORTS</span>
                </h1>
              </div>

              <div>
                <p
                  className={`${roboto.className} text-muted-foreground text-base sm:text-xl leading-relaxed lg:text-2xl`}
                >
                  The Official Esports League of the Cebu Schools Athletic Foundation, Inc.
                  — where student-gamers compete, grow, and lead.
                </p>
              </div>

              <div>
                <p className={`${roboto.className} text-muted-foreground text-sm sm:text-lg leading-relaxed`}>
                  Born from a vision to bring competitive gaming into the collegiate spotlight, CEL
                  is a student-led initiative that provides a platform for esports student-athletes
                  to showcase their skills in Mobile Legends: Bang Bang and Valorant.
                </p>
              </div>
            </div>

            {/* Right Section - Visual Elements */}
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative">
                <div className="from-primary/20 via-primary/10 to-secondary/20 border-primary/20 rounded-2xl sm:rounded-3xl border bg-gradient-to-br p-3 sm:p-8">
                  <div className="bg-muted/30 relative h-48 sm:h-96 overflow-hidden rounded-xl sm:rounded-2xl">
                    <Image
                      src="/img/cesafi-crowd-check-s4.jpg"
                      alt="CESAFI Esports League"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Overlay Text */}
                    <div className="absolute right-4 bottom-4 left-4 sm:right-6 sm:bottom-6 sm:left-6">
                      <h3 className={`${moderniz.className} mb-1 sm:mb-2 text-lg sm:text-2xl font-bold text-white`}>
                        Collegiate Esports Excellence
                      </h3>
                      <p className={`${roboto.className} text-white/90 text-xs sm:text-base`}>
                        The largest student-oriented esports league in Cebu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Award/Trophy Element - Hidden on mobile */}
                <div className="bg-accent absolute -top-4 -right-4 hidden sm:flex h-20 w-20 items-center justify-center rounded-full shadow-lg">
                  <div className="bg-accent-foreground flex h-12 w-12 items-center justify-center rounded-full">
                    <span className={`${moderniz.className} text-accent text-lg font-bold`}>
                      🏆
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <AboutUsFaq initialFaqs={aboutUsFaqs} />

      {/* CESAFI Timeline Section */}
      <CesafiTimeline />

      {/* Latest Articles Section with Suspense */}
      <Suspense fallback={<AboutUsArticlesLoading />}>
        <AboutUsArticles />
      </Suspense>
    </>
  );
}
