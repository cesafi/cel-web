import { Metadata } from 'next';
import { getArticleBySlug } from '@/actions/articles';

interface ArticleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArticleLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getArticleBySlug(slug);

  if (!result.success || !result.data) {
    return { title: 'Article Not Found | CESAFI Esports League' };
  }

  const article = result.data;
  const excerpt = (article.content as any)?.excerpt || '';

  return {
    title: `${article.title} | CESAFI Esports League`,
    description: excerpt || `Read "${article.title}" on the CESAFI Esports League news page.`,
    openGraph: {
      title: article.title,
      description: excerpt || `Read "${article.title}" on the CESAFI Esports League news page.`,
      images: article.cover_image_url ? [{ url: article.cover_image_url }] : [],
      type: 'article',
    },
  };
}

export default function ArticleLayout({ children }: ArticleLayoutProps) {
  return <>{children}</>;
}
