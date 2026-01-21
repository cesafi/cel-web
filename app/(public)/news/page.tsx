import { moderniz, roboto } from '@/lib/fonts';
import { getPaginatedArticles } from '@/actions/articles';
import { Article } from '@/lib/types/articles';
import NewsContent from '@/components/news/news-content';

export default async function NewsPage() {
  // Fetch initial articles server-side
  const articlesResult = await getPaginatedArticles({
    page: 1,
    pageSize: 6,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const articlesData = articlesResult.success && articlesResult.data ? articlesResult.data : null;
  const articles: Article[] = articlesData?.data || [];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="from-primary/10 via-background to-secondary/10 relative bg-gradient-to-br pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1
              className={`${moderniz.className} text-foreground mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-6xl lg:text-7xl`}
            >
              Latest <span className="text-primary">News</span>
            </h1>
            <p
              className={`${roboto.className} text-muted-foreground mx-auto mb-6 max-w-3xl text-base sm:mb-8 sm:text-lg md:text-xl`}
            >
              Stay updated with the latest news, updates, and highlights from CESAFI sports events
              and member schools.
            </p>
            </div>
        </div>
      </section>

      {/* News Content with initial data */}
      <NewsContent 
        initialArticles={articles}
        initialPagination={articlesData}
      />
    </div>
  );
}
