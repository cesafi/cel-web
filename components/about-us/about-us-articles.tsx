import { ArticleCard } from '@/components/shared';
import { getRecentPublishedArticles } from '@/actions/articles';
import { moderniz, roboto } from '@/lib/fonts';
import { extractPlainText } from '@/lib/utils/content-renderer';
import { calculateSportsReadTime } from '@/lib/utils/read-time';

export default async function AboutUsArticles() {
  // Fetch only recent published articles for the news section
  const articlesResult = await getRecentPublishedArticles(6);
  const articles = articlesResult.success ? articlesResult.data : [];

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className={`${moderniz.className} text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight`}>
            LATEST
            <br />
            <span className="text-primary">ARTICLES</span>
          </h2>
          
          <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
            Stay updated with the latest happenings in CESAFI. 
            From championship victories to groundbreaking partnerships.
          </p>
          
          {articles.length === 0 && (
            <div className={`${roboto.className} text-sm text-muted-foreground mt-4 max-w-2xl mx-auto`}>
              <div className="bg-muted/50 rounded-lg p-4 text-xs">
                <p className="font-semibold mb-2">No articles found</p>
                <p className="text-muted-foreground">
                  No recent articles were found. Check back later for updates.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => {
            const readTimeResult = calculateSportsReadTime(article.content);
            const transformedArticle = {
              id: article.id.toString(),
              title: article.title,
              slug: article.slug,
              excerpt: (article.content as { excerpt?: string })?.excerpt || extractPlainText(article.content, 150),
              author: article.authored_by || 'CESAFI Media Team',
              publishedAt: article.published_at || article.created_at,
              category: (article.content as { category?: string })?.category || 'General',
              readTime: readTimeResult.formattedTime,
              image: article.cover_image_url || '/img/cesafi-banner.jpg'
            };

            return (
              <ArticleCard
                key={article.id}
                article={transformedArticle}
                variant="default"
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

