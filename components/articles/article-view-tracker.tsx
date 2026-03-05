'use client';

import { useEffect, useRef } from 'react';
import { trackArticleView } from '@/actions/article-views';

interface ArticleViewTrackerProps {
  articleId: string;
}

/**
 * Invisible client component that fires the trackArticleView
 * server action once when the article page mounts.
 */
export default function ArticleViewTracker({ articleId }: ArticleViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Fire and forget — don't block rendering
    trackArticleView(articleId).catch(() => {
      // Silently ignore tracking errors
    });
  }, [articleId]);

  return null; // Renders nothing
}
