import { Suspense } from 'react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { SeasonProvider } from '@/components/contexts/season-provider';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeasonProvider>
      <div>
        <Navbar />
        <main className="pt-16">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
        <Footer />
      </div>
    </SeasonProvider>
  );
}
