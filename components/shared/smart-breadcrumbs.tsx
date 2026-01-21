'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
} from '../ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent: boolean;
}

interface SmartBreadcrumbsProps {
  maxVisibleItems?: number;
  className?: string;
  showHomeIcon?: boolean;
  customHomeLabel?: string;
  userRole?: string;
}

export default function SmartBreadcrumbs({
  maxVisibleItems = 5,
  className = '',
  showHomeIcon = true,
  customHomeLabel,
  userRole = 'admin'
}: SmartBreadcrumbsProps) {
  const pathname = usePathname();

  // Get role-based dashboard info
  const getDashboardInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          label: 'Admin Dashboard',
          href: '/admin'
        };
      case 'head_writer':
        return {
          label: 'Head Writer Dashboard',
          href: '/head-writer'
        };
      case 'writer':
        return {
          label: 'Writer Dashboard',
          href: '/writer'
        };
      case 'league_operator':
        return {
          label: 'League Operator Dashboard',
          href: '/league-operator'
        };
      default:
        return {
          label: 'Admin Dashboard',
          href: '/admin'
        };
    }
  };

  const dashboardInfo = getDashboardInfo();

  // Generate dynamic breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({
      label: customHomeLabel || dashboardInfo.label,
      href: dashboardInfo.href,
      isCurrent: false
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip the first segment if it matches the role's base path since we already have Home
      const roleBasePath = dashboardInfo.href.replace('/', '');
      if (index === 0 && segment === roleBasePath) {
        return;
      }

      // Format the segment label (capitalize, replace hyphens with spaces)
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const isCurrent = index === pathSegments.length - 1;

      breadcrumbs.push({
        label,
        href: isCurrent ? undefined : currentPath,
        isCurrent
      });
    });

    return breadcrumbs;
  };

  const allBreadcrumbs = generateBreadcrumbs();

  // Smart breadcrumb logic: show ellipsis when too many items
  const getVisibleBreadcrumbs = (): (BreadcrumbItem | 'ellipsis')[] => {
    if (allBreadcrumbs.length <= maxVisibleItems) {
      return allBreadcrumbs;
    }

    // Always show first item (home)
    const firstItem = allBreadcrumbs[0];
    
    // Always show last item (current page)
    const lastItem = allBreadcrumbs[allBreadcrumbs.length - 1];
    
    // Calculate how many middle items we can show
    const middleItemsCount = maxVisibleItems - 2; // -2 for first and last
    
    // Show some middle items if possible
    let middleItems: BreadcrumbItem[] = [];
    if (middleItemsCount > 0) {
      const startIndex = Math.floor((allBreadcrumbs.length - 2) / 2) - Math.floor(middleItemsCount / 2);
      const endIndex = startIndex + middleItemsCount;
      middleItems = allBreadcrumbs.slice(startIndex, endIndex);
    }

    const result: (BreadcrumbItem | 'ellipsis')[] = [firstItem];
    
    if (middleItems.length > 0) {
      result.push(...middleItems);
    }
    
    if (allBreadcrumbs.length > maxVisibleItems) {
      result.push('ellipsis');
    }
    
    result.push(lastItem);
    
    return result;
  };

  const visibleBreadcrumbs = getVisibleBreadcrumbs();

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {visibleBreadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item === 'ellipsis' ? (
                <BreadcrumbEllipsis />
              ) : item.isCurrent ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={item.href}
                  className={index === 0 && showHomeIcon ? 'flex items-center gap-2' : ''}
                >
                  {index === 0 && showHomeIcon && <Home className="h-4 w-4" />}
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < visibleBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
