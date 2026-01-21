'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { moderniz, roboto } from '@/lib/fonts';
import { Button } from '@/components/ui/button';
import { Shield, Home, ArrowLeft, LogIn, Lock } from 'lucide-react';

export default function NoAccessPage() {
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
        {/* Access Denied Illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-teal/10 rounded-full flex items-center justify-center">
            <Shield className="h-12 w-12 text-teal" />
          </div>
          <div className="text-6xl font-bold text-teal/20 mb-4">403</div>
          <div className="w-24 h-1 bg-teal mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="mb-8">
          <h1 className={`${moderniz.className} text-3xl font-bold text-foreground mb-4`}>
            Access Denied
          </h1>
          <p className={`${roboto.className} text-muted-foreground text-lg leading-relaxed mb-6`}>
            You don&apos;t have permission to access this page. This area is restricted to authorized users only.
          </p>
          
          <div className="bg-teal/10 border border-teal/20 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Lock className="h-5 w-5 text-teal mr-2" />
              <p className={`${roboto.className} text-sm font-medium text-teal`}>
                Restricted Access
              </p>
            </div>
            <p className={`${roboto.className} text-sm text-muted-foreground`}>
              This page requires proper authentication and authorization. Please log in with an account that has the necessary permissions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto bg-teal hover:bg-teal/90">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-teal text-teal hover:bg-teal hover:text-white">
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
