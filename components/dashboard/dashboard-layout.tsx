'use client';

import { ReactNode } from 'react';
import DashboardHeader from './dashboard-header';
import DashboardSidebar from './dashboard-sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: 'admin' | 'head_writer' | 'writer' | 'league_operator';
  userRoleDisplay?: string;
  userName?: string;
  userEmail?: string;
}

export default function DashboardLayout({
  children,
  userRole = 'admin',
  userRoleDisplay,
  userName = 'Admin',
  userEmail
}: DashboardLayoutProps) {
  return (
    <div className="bg-background flex h-screen">
      <DashboardSidebar userRole={userRole} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userEmail={userEmail}
          userName={userName}
          userRole={userRole}
          userRoleDisplay={userRoleDisplay}
        />

        <main className="flex flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
