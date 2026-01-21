'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, User, Settings, LogOut, Building2 } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ThemeSwitcher from '../theme-switcher';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { useLogout } from '@/hooks/use-auth';
import { SmartBreadcrumbs } from '../shared';
import { DashboardClock } from '../real-time-clock';

interface DashboardHeaderProps {
  userEmail?: string;
  userName?: string;
  userRole?: string;
  userRoleDisplay?: string;
}

export default function DashboardHeader({
  userEmail = 'example@cesafi.org',
  userName = 'Admin',
  userRole = 'admin',
  userRoleDisplay
}: DashboardHeaderProps) {
  const router = useRouter();
  const logoutMutation = useLogout();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dropdown after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);



  const handleSignOut = async () => {
    try {
      const result = await logoutMutation.mutateAsync();

      if (result.success) {
        toast.success('Signed out successfully');
        router.push('/login');
      } else {
        toast.error(result.error || 'Failed to sign out. Please try again.');
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        toast.error('Failed to sign out. Please try again.');
      }
    }
  };

  return (
    <header className="border-border bg-background flex h-16 items-center justify-between border-b px-6">
      {/* Left side - Breadcrumbs */}
      <div className="flex items-center gap-4">
        <SmartBreadcrumbs 
          maxVisibleItems={5}
          showHomeIcon={true}
          userRole={userRole}
        />
      </div>

      {/* Right side - Clock, Theme switcher and User menu */}
      <div className="flex items-center gap-4">
        <DashboardClock className="text-muted-foreground" />
        <div className="w-px h-6 bg-border" />
        <ThemeSwitcher />

        {isMounted ? (
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-muted hover:text-muted-foreground flex items-center gap-3 px-4 py-2 transition-colors"
            >
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden flex-col items-start gap-1 md:flex">
                <span className="text-sm leading-none font-medium">{userName}</span>
                <span className="text-muted-foreground text-xs leading-none">{userRoleDisplay || userRole}</span>
              </div>
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            {/* User Info Header */}
            <div className="border-border flex items-center gap-3 border-b p-4">
              <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col space-y-2">
                <p className="text-sm leading-none font-medium">{userName}</p>
                <p className="text-muted-foreground text-xs leading-none">{userRoleDisplay || userRole}</p>
                <p className="text-muted-foreground text-xs leading-none">{userEmail}</p>
              </div>
            </div>

            {/* Menu Items */}
            <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-3 px-4 py-3">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-3 px-4 py-3">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="hover:bg-muted flex cursor-pointer items-center gap-3 px-4 py-3">
              <Building2 className="h-4 w-4" />
              <span>Organization</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        ) : (
          // Fallback button while hydrating
          <Button
            variant="ghost"
            className="hover:bg-muted hover:text-muted-foreground flex items-center gap-3 px-4 py-2 transition-colors"
            disabled
          >
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden flex-col items-start gap-1 md:flex">
              <span className="text-sm leading-none font-medium">{userName}</span>
              <span className="text-muted-foreground text-xs leading-none">{userRoleDisplay || userRole}</span>
            </div>
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
