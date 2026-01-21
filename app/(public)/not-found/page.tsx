'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { moderniz, roboto } from '@/lib/fonts';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-teal/20 mb-4">404</div>
          <div className="w-24 h-1 bg-teal mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="mb-8">
          <h1 className={`${moderniz.className} text-3xl font-bold text-foreground mb-4`}>
            Page Not Found
          </h1>
          <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed mb-6`}>
            Sorry, we couldn&apos;t find the page you&apos;re looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto bg-teal hover:bg-teal/90">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          
          <Button onClick={handleGoBack} variant="outline" size="lg" className="w-full sm:w-auto border-teal text-teal hover:bg-teal hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
