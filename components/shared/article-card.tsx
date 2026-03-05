'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Clock, Pen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ViewCounter from '@/components/articles/view-counter';
import { moderniz, roboto } from '@/lib/fonts';
import { formatSmartDate } from '@/lib/utils/date';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    category?: string;
    readTime?: string;
    image: string;
    coverPosition?: { x: number; y: number; scale: number } | null;
    featured?: boolean;
    viewCount?: number;
  };
  variant?: 'default' | 'featured' | 'compact';
  index?: number;
}

export default function ArticleCard({ article, variant = 'default', index = 0 }: ArticleCardProps) {
  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="overflow-hidden bg-background/60 backdrop-blur-sm border-border/30 hover:border-primary/30 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative h-64 lg:h-full">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
                style={article.coverPosition ? {
                  objectPosition: `${article.coverPosition.x}% ${article.coverPosition.y}%`,
                  transform: `scale(${article.coverPosition.scale})`,
                  transformOrigin: `${article.coverPosition.x}% ${article.coverPosition.y}%`,
                } : undefined}
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              </div>
            </div>
            <CardContent className="p-8 flex flex-col justify-center">
              <div className="space-y-4">
                <h3 className={`${moderniz.className} text-xl sm:text-2xl lg:text-3xl font-bold text-foreground`}>
                  {article.title}
                </h3>
                <p className={`${roboto.className} text-muted-foreground/90 text-sm sm:text-base leading-relaxed`}>
                  {article.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground/80">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Pen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-none">by {article.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{formatSmartDate(article.publishedAt)}</span>
                  </div>
                  {article.readTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{article.readTime}</span>
                    </div>
                  )}
                  {article.viewCount != null && (
                    <ViewCounter count={article.viewCount} className="text-xs sm:text-sm text-muted-foreground/80" />
                  )}
                </div>
                <Link href={`/news/${article.slug}`} className="block sm:inline-block pt-2">
                  <Button className="w-full sm:w-auto">
                    Read Full Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="group">
        <Link href={`/news/${article.slug}`} className="block">
          <div className="flex gap-3">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                style={article.coverPosition ? {
                  objectPosition: `${article.coverPosition.x}% ${article.coverPosition.y}%`,
                } : undefined}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className={`${roboto.className} text-[13px] sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-1.5`}>
                {article.title}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground/80">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>{formatSmartDate(article.publishedAt)}</span>
                </div>
                {article.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{article.readTime}</span>
                  </div>
                )}
                {article.viewCount != null && (
                  <ViewCounter count={article.viewCount} className="text-[11px] sm:text-xs text-muted-foreground/80" />
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
    >
      <Card className="h-full overflow-hidden bg-background/60 backdrop-blur-sm border-border/30 hover:border-primary/30 transition-all duration-300">
        <div className="relative h-48">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
            style={article.coverPosition ? {
              objectPosition: `${article.coverPosition.x}% ${article.coverPosition.y}%`,
              transform: `scale(${article.coverPosition.scale})`,
              transformOrigin: `${article.coverPosition.x}% ${article.coverPosition.y}%`,
            } : undefined}
          />
        </div>
        <CardContent className="p-6 flex flex-col h-[calc(100%-12rem)]">
          <div className="flex-1 space-y-3">
            <h3 className={`${moderniz.className} text-[15px] sm:text-base md:text-lg font-bold text-foreground line-clamp-2`}>
              {article.title}
            </h3>
            <p className={`${roboto.className} text-muted-foreground/90 text-[13px] sm:text-sm leading-relaxed line-clamp-3`}>
              {article.excerpt}
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-xs text-muted-foreground/80">
              <div className="flex items-center gap-1.5 min-w-0">
                <Pen className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">by {article.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span>{formatSmartDate(article.publishedAt)}</span>
              </div>
              {article.readTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span>{article.readTime}</span>
                </div>
              )}
              {article.viewCount != null && (
                <ViewCounter count={article.viewCount} className="text-[11px] sm:text-xs text-muted-foreground/80" />
              )}
            </div>
            <Link href={`/news/${article.slug}`} className="block">
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-8 sm:h-9">
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
