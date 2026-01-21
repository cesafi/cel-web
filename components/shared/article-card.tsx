'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    featured?: boolean;
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
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              </div>
            </div>
            <CardContent className="p-8 flex flex-col justify-center">
              <div className="space-y-4">
                <h3 className={`${moderniz.className} text-2xl lg:text-3xl font-bold text-foreground`}>
                  {article.title}
                </h3>
                <p className={`${roboto.className} text-muted-foreground leading-relaxed`}>
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {article.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatSmartDate(article.publishedAt)}
                  </div>
                  {article.readTime && <span>{article.readTime}</span>}
                </div>
                <Link href={`/news/${article.slug}`}>
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
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`${roboto.className} text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-1`}>
                {article.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatSmartDate(article.publishedAt)}
                </span>
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
          />
        </div>
        <CardContent className="p-6 flex flex-col h-[calc(100%-12rem)]">
          <div className="flex-1 space-y-4">
            <h3 className={`${moderniz.className} text-lg font-bold text-foreground line-clamp-2`}>
              {article.title}
            </h3>
            <p className={`${roboto.className} text-muted-foreground text-sm line-clamp-3`}>
              {article.excerpt}
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatSmartDate(article.publishedAt)}
              </div>
            </div>
            <Link href={`/news/${article.slug}`} className="block">
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
