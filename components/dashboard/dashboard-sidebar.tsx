'use client';

import {
  Building2,
  FileText,
  Grid3X3,
  Key,
  Trophy,
  Users,
  Volleyball,
  Target,
  Shield,
  Group,
  Home,
  HelpCircle,
  Calendar,
  Image as ImageIcon,
  HandHeart,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SeasonSwitcher } from '@/components/admin/season-switcher';
import { useSeason } from '@/components/contexts/season-provider';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardSidebarProps {
  userRole?: 'admin' | 'head_writer' | 'writer' | 'league_operator';
}

export default function DashboardSidebar({ userRole = 'admin' }: DashboardSidebarProps) {
  const pathname = usePathname();
  
  // Always call the hook, but only use the result when needed
  const seasonContext = useSeason();
  const needsSeasonContext = userRole === 'admin' || userRole === 'league_operator';
  const currentSeason = needsSeasonContext ? seasonContext?.currentSeason : null;

  const getGeneralNavigationItems = (role: string): NavigationItem[] => {
    switch (role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Overview', icon: Grid3X3 },
          { href: '/admin/accounts', label: 'Accounts', icon: Key },
          { href: '/admin/schools', label: 'Schools', icon: Building2 },
          { href: '/admin/seasons', label: 'Seasons', icon: Trophy },
          { href: '/admin/sports', label: 'Sports', icon: Volleyball },
          { href: '/admin/sponsors', label: 'Sponsors', icon: HandHeart },
          { href: '/admin/articles', label: 'Articles', icon: FileText },
          { href: '/admin/departments', label: 'Departments', icon: Users }
        ];
      case 'head_writer':
        return [
          { href: '/head-writer', label: 'Overview', icon: Grid3X3 },
          { href: '/head-writer/articles', label: 'Articles', icon: FileText }
        ];
      case 'writer':
        return [
          { href: '/writer', label: 'Overview', icon: Grid3X3 },
          { href: '/writer/articles', label: 'My Articles', icon: FileText }
        ];
      case 'league_operator':
        return [
          { href: '/league-operator', label: 'Overview', icon: Grid3X3 },
          { href: '/league-operator/matches', label: 'Matches', icon: Target }
        ];
      default:
        return [{ href: '/admin', label: 'Overview', icon: Grid3X3 }];
    }
  };

  const getLandingPageNavigationItems = (role: string): NavigationItem[] => {
    const basePath = role === 'head_writer' ? '/head-writer' : '/admin';
    
    if (role === 'head_writer') {
      // Head writers can only manage Timeline and FAQ
      return [
        { href: `${basePath}/timeline`, label: 'Timeline', icon: Calendar },
        { href: `${basePath}/faq`, label: 'FAQ', icon: HelpCircle },
      ];
    }
    
    // Admins get full access to all landing page content
    return [
      { href: `${basePath}/timeline`, label: 'Timeline', icon: Calendar },
      { href: `${basePath}/faq`, label: 'FAQ', icon: HelpCircle },
      { href: `${basePath}/hero-section`, label: 'Hero Section', icon: Home },
      { href: `${basePath}/photo-gallery`, label: 'Photo Gallery', icon: ImageIcon },
    ];
  };

  const getSeasonalNavigationItems = (): NavigationItem[] => {
    return [
      { href: '/admin/league-stage', label: 'League Stages', icon: Group },
      { href: '/admin/school-teams', label: 'School Teams', icon: Shield },
      { href: '/admin/volunteers', label: 'Volunteers', icon: Users },
      { href: '/admin/matches', label: 'Matches', icon: Target },
    ];
  };

  const generalItems = getGeneralNavigationItems(userRole);
  const landingPageItems = getLandingPageNavigationItems(userRole);
  const seasonalItems = getSeasonalNavigationItems();

  return (
    <aside className="border-border bg-sidebar flex h-screen w-64 flex-col border-r">
      {/* Logo and Season Switcher */}
      <div className="border-border flex h-16 w-full items-center gap-3 border-b px-6">
        <div className="flex items-center">
          <Image
            src="/img/cesafi-logo.webp"
            alt="CESAFI Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
        </div>
        {needsSeasonContext && <SeasonSwitcher />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 p-4">
        {/* General Category */}
        <div className="space-y-2">
          <h3 className="text-sidebar-foreground/70 text-xs font-semibold tracking-wider uppercase">
            General
          </h3>
          <div className="space-y-1">
            {generalItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary border-l-4'
                      : 'text-sidebar-foreground hover:bg-sidebar-primary/5 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Landing Page Content Category - Only show for admin and head_writer */}
        {(userRole === 'admin' || userRole === 'head_writer') && (
          <div className="space-y-2">
            <h3 className="text-sidebar-foreground/70 text-xs font-semibold tracking-wider uppercase">
              Landing Page Content
            </h3>
            <div className="space-y-1">
              {landingPageItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary border-l-4'
                        : 'text-sidebar-foreground hover:bg-sidebar-primary/5 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground'
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Seasonal Category - Only show for roles that need season context */}
        {needsSeasonContext && (
          <div className="space-y-2">
            <h3 className="text-sidebar-foreground/70 text-xs font-semibold tracking-wider uppercase">
              {currentSeason ? `Season ${currentSeason.id}` : 'Season'}
            </h3>
            <div className="space-y-1">
              {seasonalItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary border-l-4'
                        : 'text-sidebar-foreground hover:bg-sidebar-primary/5 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground'
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* View Website Section */}
      <div className="border-border border-t p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-primary/5 hover:text-sidebar-foreground transition-colors"
        >
          <ExternalLink className="h-5 w-5" />
          <span>View Website</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="border-border border-t p-4">
        <div className="text-sidebar-foreground flex flex-col items-center justify-center space-y-1 text-xs">
          <p className="font-medium text-center">Cebu Schools Athletics Foundation, Inc.</p>
          <p>© 2025. All rights reserved.</p>
        </div>
      </div>
    </aside>
  );
}
