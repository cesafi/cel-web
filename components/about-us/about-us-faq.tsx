'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { useAboutUsFaq } from '@/hooks/use-faq';
import { Faq } from '@/lib/types/faq';
import dynamic from 'next/dynamic';

// Dynamically import scroll effects only on client side
const ScrollEffects = dynamic(
  () => import('./scroll-effects').then(mod => mod.ScrollEffects),
  { ssr: false }
);

interface AboutUsFaqProps {
  initialFaqs?: Faq[];
}

export default function AboutUsFaq({ initialFaqs = [] }: AboutUsFaqProps) {
  const ref = useRef<HTMLElement>(null);

  const { data: faqResponse, isLoading, error } = useAboutUsFaq();
  // Get About Us specific FAQs (use client data if available, otherwise use initial data)
  const faqItems = useMemo(() => {
    if (faqResponse?.success && 'data' in faqResponse && Array.isArray(faqResponse.data)) {
      return faqResponse.data;
    }
    // Fallback to server-side initial data
    return initialFaqs;
  }, [faqResponse, initialFaqs]);

  const [openItems, setOpenItems] = useState<number[]>([]);

  // Initialize open items based on database is_open values
  useEffect(() => {
    if (faqItems && faqItems.length > 0) {
      const defaultOpenItems = faqItems
        .filter(item => item.is_open)
        .map(item => item.id);
      setOpenItems(defaultOpenItems);
    }
  }, [faqItems]);

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="py-40 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              {/* Loading animation */}
              <div className="w-24 h-24 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>

              {/* Loading text */}
              <h3 className={`${moderniz.className} text-2xl font-bold text-foreground mb-4`}>
                Loading FAQ
              </h3>
              <p className={`${roboto.className} text-muted-foreground text-lg`}>
                Please wait while we fetch the frequently asked questions...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-40 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center max-w-md">
              {/* Error icon */}
              <div className="w-24 h-24 mx-auto mb-8 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>

              {/* Error title */}
              <h3 className={`${moderniz.className} text-2xl font-bold text-foreground mb-4`}>
                Unable to Load FAQ
              </h3>

              {/* Error description */}
              <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed mb-6`}>
                We encountered an issue while loading the frequently asked questions. Please try again later.
              </p>

              {/* Retry button */}
              <button
                onClick={() => window.location.reload()}
                className={`${moderniz.className} inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition-colors duration-200`}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Empty state (but allow loading state with initial data)
  if (faqItems.length === 0 && !isLoading) {
    return (
      <section className="py-40 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center max-w-md">
              {/* Icon */}
              <div className="w-24 h-24 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">❓</span>
              </div>

              {/* Title */}
              <h3 className={`${moderniz.className} text-2xl font-bold text-foreground mb-4`}>
                No FAQ Items Yet
              </h3>

              {/* Description */}
              <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed mb-6`}>
                We&apos;re working on adding frequently asked questions to help you learn more about CESAFI. Check back soon!
              </p>

              {/* Call to action */}
              <div className="space-y-3">
                <p className={`${roboto.className} text-sm text-muted-foreground`}>
                  In the meantime, you can:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="/about-us"
                    className={`${moderniz.className} inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition-colors duration-200`}
                  >
                    Learn About CESAFI
                  </a>
                  <a
                    href="/contact"
                    className={`${moderniz.className} inline-flex items-center justify-center px-6 py-3 border border-border hover:bg-muted text-foreground rounded-lg font-semibold text-sm transition-colors duration-200`}
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-40 bg-muted/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

          {/* Left Column - FAQ */}
          <ScrollEffects ref={ref}>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-8 text-left flex items-center justify-between hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <span className={`${moderniz.className} text-xl font-semibold text-foreground transition-colors duration-300 ${openItems.includes(item.id) ? 'text-primary' : 'group-hover:text-primary/80'
                      }`}>
                      {item.question}
                    </span>
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${openItems.includes(item.id)
                        ? 'bg-primary text-primary-foreground scale-110'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                        }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        animate={{ rotate: openItems.includes(item.id) ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        {openItems.includes(item.id) ? (
                          <Minus className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </motion.div>
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {openItems.includes(item.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: 'auto',
                          transition: {
                            height: { duration: 0.4, ease: "easeInOut" },
                            opacity: { duration: 0.3, delay: 0.1 }
                          }
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          transition: {
                            opacity: { duration: 0.2 },
                            height: { duration: 0.3, delay: 0.1, ease: "easeInOut" }
                          }
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-8">
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className={`${roboto.className} text-muted-foreground leading-relaxed mb-6 text-lg`}
                          >
                            {item.answer}
                          </motion.p>
                          {item.id === 2 && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.3 }}
                              className={`${moderniz.className} bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}
                            >
                              WATCH HERE
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </ScrollEffects>

          {/* Right Column - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative lg:sticky lg:top-32"
          >
            <div className="bg-background/50 backdrop-blur-sm rounded-3xl p-12 border border-border/50 shadow-xl">
              <div className="relative h-[500px] bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="w-40 h-40 bg-primary/20 rounded-full flex items-center justify-center mb-8 mx-auto shadow-lg"
                    >
                      <span className="text-7xl">🏆</span>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      viewport={{ once: true }}
                      className={`${moderniz.className} text-3xl font-bold text-foreground mb-4`}
                    >
                      CESAFI Excellence
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                      className={`${roboto.className} text-muted-foreground text-lg mb-6`}
                    >
                      Celebrating athletic achievement
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      viewport={{ once: true }}
                    >
                      <a
                        href="/faq"
                        className={`${moderniz.className} inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition-colors duration-200`}
                      >
                        More FAQs
                      </a>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Link to Comprehensive FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className={`${roboto.className} text-muted-foreground mb-4`}>
            Looking for more detailed information?
          </p>
          <a
            href="/faq"
            className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-8 py-4 rounded-xl font-semibold text-lg uppercase tracking-wide transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center gap-3`}
          >
            View Complete FAQ
            <span className="text-xl">📚</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
