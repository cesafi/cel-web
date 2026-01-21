'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Clock, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShareButtons } from '@/components';
import { moderniz, roboto } from '@/lib/fonts';
import { useArticleBySlug, useRecentPublishedArticles } from '@/hooks/use-articles';
import { renderArticleContent, extractPlainText, getArticleContentProps } from '@/lib/utils/content-renderer';
import { formatSmartDate } from '@/lib/utils/date';
import { calculateSportsReadTime } from '@/lib/utils/read-time';
import { getArticleUrl } from '@/lib/utils/site-url';
import '@/styles/article-content.css';

export default function NewsArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  // Fetch article by slug
  const { data: article, isLoading: articleLoading, error: articleError } = useArticleBySlug(slug);

  // Fetch related articles
  const { data: relatedArticlesData } = useRecentPublishedArticles(3);
  const relatedArticles = relatedArticlesData || [];

  // Loading state
  if (articleLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary/30 border-t-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4"></div>
          <p className={`${roboto.className} text-muted-foreground`}>Loading article...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (articleError || !article) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-foreground mb-4 text-2xl font-bold">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you&apos;re looking for doesn&apos;t exist or could not be loaded.
          </p>
          <Link href="/news">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Transform article data for display
  const readTimeResult = calculateSportsReadTime(article.content);
  const displayArticle = {
    id: article.id.toString(),
    title: article.title,
    slug: article.slug,
    excerpt:
      (article.content as { excerpt?: string })?.excerpt || extractPlainText(article.content, 200),
    content: renderArticleContent(article.content),
    author: article.authored_by || 'CESAFI Media Team',
    publishedAt: article.published_at || article.created_at,
    updatedAt: article.updated_at,
    category: (article.content as { category?: string })?.category || 'General',
    readTime: readTimeResult.formattedTime,
    wordCount: readTimeResult.words,
    image: article.cover_image_url || '/img/cesafi-banner.jpg',
    tags: (article.content as { tags?: string[] })?.tags || []
  };

  return (
    <div className="bg-background min-h-screen py-4">
      {/* Hero Image */}
      <section className="relative h-[40vh] overflow-hidden md:h-[50vh]">
        <div className="absolute inset-0">
          <Image
            src={displayArticle.image}
            alt={displayArticle.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </section>

      {/* Article Header */}
      <section className="border-border/30 border-b pt-4 pb-6">
        {/* Breadcrumbs */}
        <div className="mx-auto max-w-4xl p-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground flex items-center transition-colors"
            >
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
            <Link
              href="/news"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              News
            </Link>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
            <span className="text-foreground line-clamp-1 font-medium">{displayArticle.title}</span>
          </nav>
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className={`${moderniz.className} text-foreground mb-6 text-3xl leading-tight font-bold md:text-4xl lg:text-5xl`}
            >
              {displayArticle.title}
            </h1>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{displayArticle.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatSmartDate(displayArticle.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{displayArticle.readTime}</span>
                </div>
              </div>

              {/* Share Buttons - Top */}
              <div className="flex-shrink-0">
                <ShareButtons
                  title={displayArticle.title}
                  url={getArticleUrl(displayArticle.slug)}
                  variant="compact"
                />
              </div>
            </div>

            {displayArticle.excerpt && (
              <p
                className={`${roboto.className} text-muted-foreground border-primary/30 border-l-4 py-2 pl-6 text-lg leading-relaxed italic`}
              >
                {displayArticle.excerpt}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <article
              {...getArticleContentProps(article.content)}
            />

            {/* Tags */}
            {displayArticle.tags && displayArticle.tags.length > 0 && (
              <div className="border-border/30 mt-12 border-t pt-8">
                <h3 className={`${moderniz.className} text-foreground mb-4 text-lg font-semibold`}>
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {displayArticle.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons - Bottom */}
            <div className="border-border/30 mt-12 border-t pt-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    className={`${moderniz.className} text-foreground mb-2 text-lg font-semibold`}
                  >
                    Share this article
                  </h3>
                  <p className="text-muted-foreground text-sm">Help others discover this story</p>
                </div>
                <ShareButtons
                  title={displayArticle.title}
                  url={getArticleUrl(displayArticle.slug)}
                  variant="expanded"
                />
              </div>
            </div>

            {/* Back to News */}
            <div className="border-border/30 mt-12 border-t pt-8">
              <Link href="/news">
                <Button variant="outline" className="group">
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to All News
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className={`${moderniz.className} text-foreground mb-8 text-2xl font-bold md:text-3xl`}
            >
              Related Articles
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {relatedArticles.map((relatedArticle, index) => {
                const relatedDisplayArticle = {
                  id: relatedArticle.id.toString(),
                  title: relatedArticle.title,
                  slug: relatedArticle.slug,
                  excerpt:
                    (relatedArticle.content as { excerpt?: string })?.excerpt ||
                    extractPlainText(relatedArticle.content, 150),
                  category:
                    (relatedArticle.content as { category?: string })?.category || 'General',
                  image: relatedArticle.cover_image_url || '/img/cesafi-banner.jpg',
                  publishedAt: relatedArticle.published_at || relatedArticle.created_at
                };

                return (
                  <motion.div
                    key={relatedDisplayArticle.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="bg-background border-border/30 hover:border-primary/30 h-full overflow-hidden transition-all duration-300">
                      <div className="relative h-48">
                        <Image
                          src={relatedDisplayArticle.image}
                          alt={relatedDisplayArticle.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-6">
                        <h3
                          className={`${moderniz.className} text-foreground mb-2 line-clamp-2 text-lg font-bold`}
                        >
                          {relatedDisplayArticle.title}
                        </h3>
                        <p
                          className={`${roboto.className} text-muted-foreground mb-4 line-clamp-2 text-sm`}
                        >
                          {relatedDisplayArticle.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {formatSmartDate(relatedDisplayArticle.publishedAt)}
                          </span>
                          <Link href={`/news/${relatedDisplayArticle.slug}`}>
                            <Button variant="ghost" size="sm">
                              Read More
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
