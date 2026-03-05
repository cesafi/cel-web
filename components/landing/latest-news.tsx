'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { moderniz, roboto } from '@/lib/fonts';
import { Article } from '@/lib/types/articles';
import { extractPlainText } from '@/lib/utils/content-renderer';
import { calculateSportsReadTime } from '@/lib/utils/read-time';
import { ArticleCard } from '@/components/shared';
import { ArrowRight } from 'lucide-react';

interface LatestNewsProps {
  initialArticles: Article[];
}

export default function LatestNews({ initialArticles }: LatestNewsProps) {
  const newsArticles = initialArticles.map((article, index) => {
    const readTimeResult = calculateSportsReadTime(article.content);
    return {
      id: article.id.toString(),
      title: article.title,
      slug: article.slug,
      excerpt: (article.content as { excerpt?: string })?.excerpt || extractPlainText(article.content, 150),
      author: article.authored_by || 'CESAFI Media Team',
      publishedAt: article.published_at || article.created_at,
      category: (article.content as { category?: string })?.category || 'General',
      readTime: readTimeResult.formattedTime,
      image: article.cover_image_url || '/img/cesafi-banner.jpg',
      featured: (article.content as { featured?: boolean })?.featured || index === 0
    };
  });

  // Removed hydration handling as it's not needed

  const featuredArticle = newsArticles.find(article => article.featured);
  const regularArticles = newsArticles.filter(article => !article.featured);

  return (
    <section className="py-32 bg-background relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Latest <span className="text-gradient-cel">News</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            Stay updated with the latest happenings in CESAFI
          </p>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <div className="mb-20">
            <ArticleCard article={featuredArticle} variant="featured" />
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularArticles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="default"
              index={index}
            />
          ))}
        </div>

        {/* View All News Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="text-center mt-10 md:mt-12 flex flex-col gap-3 sm:gap-4 justify-center">
          <Link href="/news">
              <button className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-5 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center`}>
                View Full News
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <p className={`${roboto.className} text-sm text-muted-foreground`}>
            Read the latest updates, announcements, and match recaps
          </p>
        </div>
        </motion.div>
      </div>
    </section>
  );
}