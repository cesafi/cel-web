'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { moderniz, roboto } from '@/lib/fonts';
import { Article } from '@/lib/types/articles';
import { extractPlainText } from '@/lib/utils/content-renderer';
import { calculateSportsReadTime } from '@/lib/utils/read-time';
import { ArticleCard } from '@/components/shared';

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
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className={`${moderniz.className} text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight`}>
            LATEST
            <br />
            <span className="text-primary">NEWS</span>
          </h2>
          <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
            Stay updated with the latest happenings in CESAFI. 
            From championship victories to groundbreaking partnerships.
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
          <Link href="/news">
            <button className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-10 py-5 rounded-2xl font-semibold text-xl uppercase tracking-wide transition-all duration-300 hover:scale-105 shadow-lg`}>
              View All News
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}