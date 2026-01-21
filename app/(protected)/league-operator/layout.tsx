import { ReactNode } from 'react';
import { SeasonProvider } from '@/components/contexts/season-provider';

interface LeagueOperatorLayoutProps {
  children: ReactNode;
}

export default function LeagueOperatorLayout({ children }: LeagueOperatorLayoutProps) {
  return (
    <SeasonProvider>
      {children}
    </SeasonProvider>
  );
}
