'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { useHighlightedFaq } from '@/hooks/use-faq';
import { Faq } from '@/lib/types/faq';
import Link from 'next/link';

interface LandingFaqProps {
  initialFaqs?: Faq[];
}

export default function LandingFaq({ initialFaqs = [] }: LandingFaqProps) {
  const { data: faqResponse, isLoading } = useHighlightedFaq();

  // Get top 3 highlighted FAQs for landing page
  const topFaqs = useMemo(() => {
    // Use client-side data if available, otherwise fall back to initial data
    if (faqResponse?.success && 'data' in faqResponse && Array.isArray(faqResponse.data)) {
      return faqResponse.data.slice(0, 3); // Limit to 3 items for cleaner landing page
    }
    // Fallback to server-side initial data
    return initialFaqs.slice(0, 3);
  }, [faqResponse, initialFaqs]);

  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Don't render if no highlighted FAQs (but allow loading state with initial data)
  if (topFaqs.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="py-16 sm:py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            Quick answers to the most common questions about CESAFI
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-2 sm:space-y-4 mb-8 sm:mb-12">
          {topFaqs.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-muted/50 transition-all duration-300 group"
              >
                <span className={`${moderniz.className} text-sm sm:text-base font-semibold text-foreground transition-colors duration-300 pr-3 ${openItems.includes(item.id) ? 'text-primary' : 'group-hover:text-primary/80'
                  }`}>
                  {item.question}
                </span>
                <motion.div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${openItems.includes(item.id)
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
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className={`${roboto.className} text-muted-foreground leading-relaxed text-sm sm:text-base`}
                      >
                        {item.answer}
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* View More FAQs Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <div className="text-center mt-10 md:mt-12 flex flex-col gap-3 sm:gap-4 justify-center">
            <Link href="/faq">
                <button className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center`}>
                  View All FAQs
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            <p className={`${roboto.className} text-sm text-muted-foreground`}>
              Find more detailed answers and organization-specific information
            </p>
        </div>
        </motion.div>
      </div>
    </section>
  );
}