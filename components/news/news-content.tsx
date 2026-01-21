'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArticleCard } from '@/components';
import { usePaginatedArticles } from '@/hooks/use-articles';
import { Skeleton } from '@/components/ui/skeleton';
import NewsSearch from './news-search';
import NewsPagination from './news-pagination';
import { Article } from '@/lib/types/articles';
import { moderniz, roboto } from '@/lib/fonts';
import { extractPlainText } from '@/lib/utils/content-renderer';
import { calculateSportsReadTime } from '@/lib/utils/read-time';

interface NewsContentProps {
  initialArticles: Article[];
  initialPagination: {
    data: Article[];
    totalCount: number;
    pageCount: number;
    currentPage: number;
  } | null;
}

export default function NewsContent({ 
  initialArticles, 
  initialPagination
}: NewsContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Use paginated articles hook for additional pages
  const { 
    data: articlesData, 
    isLoading, 
    error
  } = usePaginatedArticles({
    page: currentPage,
    pageSize,
    searchQuery: searchTerm,
    sortBy: 'created_at',
    sortOrder: 'desc'
  }, {
    enabled: currentPage > 1 || !!initialPagination, // Only enable if we have initial data or we're on page 2+
    queryKey: ['articles', 'paginated', { page: currentPage, pageSize, searchQuery: searchTerm, sortBy: 'created_at', sortOrder: 'desc' }]
  });

  // Use initial data for first page, hook data for subsequent pages
  const rawArticles = currentPage === 1 ? initialArticles : (articlesData?.data || []);
  const currentPagination = currentPage === 1 ? initialPagination : articlesData;

  // Transform articles to match ArticleCard format
  const currentArticles = rawArticles.map((article) => {
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
      featured: (article.content as { featured?: boolean })?.featured || false
    };
  });

  // Use articles directly without category filtering
  const filteredArticles = currentArticles;

  const featuredArticle = filteredArticles.find((article) => 
    article.featured === true
  );
  const regularArticles = filteredArticles.filter((article) => 
    article.featured !== true
  );

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-12">
          <NewsSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        </div>

        {/* Loading State */}
        {isLoading && currentPage > 1 ? (
          <div className="space-y-12">
            {/* Featured Article Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="bg-background/40 backdrop-blur-lg rounded-lg border border-border/30 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Skeleton className="h-64 w-full rounded-lg" />
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </div>
            </div>

            {/* Regular Articles Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-background/40 backdrop-blur-lg rounded-lg border border-border/30 p-6">
                    <Skeleton className="h-48 w-full rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8">
              <h3 className={`${moderniz.className} text-xl font-semibold text-destructive mb-2`}>
                Unable to Load Articles
              </h3>
              <p className={`${roboto.className} text-muted-foreground`}>
                {error.message || 'Please try again later.'}
              </p>
            </div>
          </div>
        ) : filteredArticles.length === 0 && currentPage === 1 ? (
          <div className="py-12 text-center">
            <div className="bg-muted/10 border border-muted/20 rounded-lg p-8">
              <h3 className={`${moderniz.className} text-xl font-semibold text-foreground mb-2`}>
                No Articles Available
              </h3>
              <p className={`${roboto.className} text-muted-foreground`}>
                There are no articles to display at the moment. Check back later for updates.
              </p>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 text-center">
            <p className={`${roboto.className} text-muted-foreground text-lg`}>
              No articles found matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article */}
            {featuredArticle && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className={`${moderniz.className} text-foreground mb-8 text-2xl font-bold`}>
                  Featured Story
                </h2>
                <ArticleCard article={featuredArticle} variant="featured" />
              </motion.div>
            )}

            {/* Regular Articles Grid */}
            {regularArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className={`${moderniz.className} text-foreground mb-8 text-2xl font-bold`}>
                  Recent Articles
                </h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {regularArticles.map((article, index) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="default"
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pagination */}
            {currentPagination && (
              <NewsPagination
                currentPage={currentPage}
                totalPages={currentPagination.pageCount}
                onPageChange={setCurrentPage}
                totalCount={currentPagination.totalCount}
                pageSize={pageSize}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
