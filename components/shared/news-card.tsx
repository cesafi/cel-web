'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moderniz, roboto } from '@/lib/fonts';
import { Article } from '@/lib/types/articles';
import { extractPlainText } from '@/lib/utils/content-renderer';
import { formatSmartDate } from '@/lib/utils/date';
import { calculateSportsReadTime } from '@/lib/utils/read-time';

interface NewsCardProps {
  article: Article;
  index: number;
  className?: string;
}

export default function NewsCard({ article, index, className = '' }: NewsCardProps) {
  // Transform article to match the expected format
  const readTimeResult = calculateSportsReadTime(article.content);
  const newsArticle = {
    id: article.id.toString(),
    title: article.title,
    slug: article.slug,
    excerpt: (article.content as { excerpt?: string })?.excerpt || extractPlainText(article.content, 150),
    image: article.cover_image_url || '/img/cesafi-banner.jpg',
    publishedAt: article.published_at || article.created_at,
    author: article.authored_by || 'CESAFI Media Team',
    category: (article.content as { category?: string })?.category || 'General',
    readTime: readTimeResult.formattedTime
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className={`group ${className}`}
    >
      <Card className="h-full overflow-hidden bg-background/60 backdrop-blur-sm border-border/30 hover:border-primary/30 transition-all duration-300">
        <div className="relative h-48">
          <Image
            src={newsArticle.image}
            alt={newsArticle.title}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-6 flex flex-col h-[calc(100%-12rem)]">
          <div className="flex-1 space-y-4">
            <h3 className={`${moderniz.className} text-lg font-bold text-foreground line-clamp-2`}>
              {newsArticle.title}
            </h3>
            <p className={`${roboto.className} text-muted-foreground text-sm line-clamp-3`}>
              {newsArticle.excerpt}
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {newsArticle.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatSmartDate(newsArticle.publishedAt)}
              </div>
            </div>
            <Link href={`/news/${newsArticle.slug}`} className="block">
              <Button variant="outline" size="sm" className="w-full">
                Read More
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
