'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  ChevronRight,
  Home,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import ShareButtons from '@/components/shared/share-buttons';
import { moderniz, roboto } from '@/lib/fonts';
import { useArticleById } from '@/hooks/use-articles';
import { renderArticleContent, extractPlainText, getArticleContentProps } from '@/lib/utils/content-renderer';
import { formatSmartDate } from '@/lib/utils/date';
import { calculateSportsReadTime } from '@/lib/utils/read-time';
import { getArticleUrl } from '@/lib/utils/site-url';
import '@/styles/article-content.css';

export default function ArticlePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const { data: article, isLoading, error } = useArticleById(articleId);

  if (isLoading || !article) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The article you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to preview it.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Transform article data for display (exactly like published version)
  const readTimeResult = calculateSportsReadTime(article.content);
  const displayArticle = {
    id: article.id.toString(),
    title: article.title,
    slug: article.slug || `preview-${article.id}`,
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
    tags: (article.content as { tags?: string[] })?.tags || [],
    status: article.status
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Preview Banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-3">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">
                Preview Mode - Exact published appearance
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Status: {displayArticle.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Articles
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs - Exactly like published version */}
      <section className="bg-muted/30 py-4 border-b border-border/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">
              News
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium line-clamp-1">
              {displayArticle.title}
            </span>
          </nav>
        </div>
      </section>

      {/* Hero Image - Exactly like published version */}
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

      {/* Article Header - Exactly like published version */}
      <section className="py-8 border-b border-border/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={`${moderniz.className} text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight`}>
              {displayArticle.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
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

              {/* Share Buttons - Top (Preview Mode) */}
              <div className="flex-shrink-0">
                <ShareButtons 
                  url={getArticleUrl(displayArticle.slug)}
                  title={displayArticle.title}
                  variant="compact"
                  disabled={true}
                />
              </div>
            </div>

            {displayArticle.excerpt && (
              <p className={`${roboto.className} text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-6 py-2`}>
                {displayArticle.excerpt}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Article Content - Exactly like published version */}
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

            {/* Tags - Exactly like published version */}
            {displayArticle.tags && displayArticle.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border/30">
                <h3 className={`${moderniz.className} text-foreground mb-4 text-lg font-semibold`}>
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {displayArticle.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons - Bottom (Preview Mode) */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h3 className={`${moderniz.className} text-foreground mb-2 text-lg font-semibold`}>
                    Share this article (Preview)
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Sharing will be enabled when published
                  </p>
                </div>
                <ShareButtons 
                  url={getArticleUrl(displayArticle.slug)}
                  title={displayArticle.title}
                  variant="full"
                  disabled={true}
                />
              </div>
            </div>

            {/* Back to Articles */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <Button variant="outline" className="group" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Articles Management
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
