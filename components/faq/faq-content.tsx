'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, Search, Filter } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { Faq } from '@/lib/types/faq';

interface FaqContentProps {
  initialFaqItems: Faq[] | null | undefined;
}

export default function FaqContent({ initialFaqItems }: FaqContentProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize open items based on database is_open values
  useEffect(() => {
    if (Array.isArray(initialFaqItems) && initialFaqItems.length > 0) {
      const defaultOpenItems = initialFaqItems
        .filter(item => item.is_open)
        .map(item => item.id);
      setOpenItems(defaultOpenItems);
    }
  }, [initialFaqItems]);

  // Get unique categories from FAQ items
  const categories = useMemo(() => {
    if (!Array.isArray(initialFaqItems) || initialFaqItems.length === 0) {
      return ['all', 'General'];
    }
    const cats = new Set(initialFaqItems.map(item => item.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [initialFaqItems]);

  // Filter FAQ items based on search and category
  const filteredFaqItems = useMemo(() => {
    if (!Array.isArray(initialFaqItems)) {
      return [];
    }
    return initialFaqItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        (item.category || 'General') === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [initialFaqItems, searchQuery, selectedCategory]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  if (!Array.isArray(initialFaqItems) || initialFaqItems.length === 0) {
    return (
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-24 h-24 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">❓</span>
          </div>
          <h3 className={`${moderniz.className} text-2xl font-bold text-foreground mb-4`}>
            No FAQ Items Yet
          </h3>
          <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed mb-6`}>
            We&apos;re working on adding frequently asked questions. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search and Filter */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${roboto.className} w-full pl-12 pr-4 py-4 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200`}
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className={`${roboto.className} text-sm font-medium`}>Filter by:</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`${roboto.className} px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-8">
            <p className={`${roboto.className} text-muted-foreground`}>
              Found {filteredFaqItems.length} result{filteredFaqItems.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* FAQ Items */}
        <div className="space-y-6">
          {filteredFaqItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className={`${moderniz.className} text-xl font-semibold text-foreground mb-2`}>
                No results found
              </h3>
              <p className={`${roboto.className} text-muted-foreground`}>
                Try adjusting your search terms or category filter.
              </p>
            </div>
          ) : (
            filteredFaqItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-6 text-left flex items-start justify-between hover:bg-muted/30 transition-all duration-300 group"
                >
                  <div className="flex-1 pr-4">
                    <span className={`${moderniz.className} text-lg font-semibold text-foreground transition-colors duration-300 ${
                      openItems.includes(item.id) ? 'text-primary' : 'group-hover:text-primary/80'
                    }`}>
                      {item.question}
                    </span>
                    {item.category && item.category !== 'General' && (
                      <div className="mt-2">
                        <span className={`${roboto.className} text-xs px-2 py-1 bg-primary/10 text-primary rounded-full`}>
                          {item.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <motion.div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      openItems.includes(item.id) 
                        ? 'bg-primary text-primary-foreground' 
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
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
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
                      <div className="px-6 pb-6">
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className={`${roboto.className} text-muted-foreground leading-relaxed`}
                        >
                          {item.answer}
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}