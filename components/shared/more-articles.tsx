'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moderniz } from '@/lib/fonts';
import ArticleCard from './article-card';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  category: string;
  image: string;
}

interface MoreArticlesProps {
  articles: Article[];
  maxItems?: number;
}

export default function MoreArticles({ articles, maxItems = 3 }: MoreArticlesProps) {
  const displayArticles = articles.slice(0, maxItems);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className={`${moderniz.className} text-lg`}>More Articles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayArticles.map((article, index) => (
          <div key={article.id}>
            <ArticleCard article={article} variant="compact" />
            {index < displayArticles.length - 1 && (
              <div className="mt-4 border-b border-border/50" />
            )}
          </div>
        ))}
        <div className="pt-2">
          <Link href="/news">
            <Button variant="outline" size="sm" className="w-full">
              View All Articles
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
