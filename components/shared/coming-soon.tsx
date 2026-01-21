'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonProps {
  readonly title: string;
  readonly description: string;
  readonly features?: readonly string[];
  readonly estimatedLaunch?: string;
}

export default function ComingSoon({
  title,
  description,
  features = [],
  estimatedLaunch
}: ComingSoonProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-border shadow-lg">
          <CardHeader className="pb-4 text-center sm:pb-6">
            <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:mb-4 sm:h-16 sm:w-16">
              <Construction className="text-primary h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <CardTitle className={`text-foreground text-2xl font-bold sm:text-3xl`}>{title}</CardTitle>
            <p className={`text-muted-foreground mt-2 text-base sm:text-lg`}>{description}</p>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
            {features.length > 0 && (
              <div>
                <h3 className={`text-foreground mb-2 text-base font-semibold sm:mb-3 sm:text-lg`}>What to Expect</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className="bg-primary h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2" />
                      <span className={`text-muted-foreground text-sm sm:text-base`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {estimatedLaunch && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  Estimated Launch: {estimatedLaunch}
                </Badge>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:gap-3 sm:pt-4">
              <Button asChild variant="outline" className="flex-1 text-sm sm:text-base">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 text-sm sm:text-base">
                <Link href="/schedule" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  View Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
