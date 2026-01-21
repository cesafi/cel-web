import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard';
import { getCurrentUserAction } from '@/actions/auth';
import { UserRole } from '@/lib/types/auth';
import { getRoleDisplayName } from '@/lib/utils/roles';
import { SeasonProvider } from '@/components/contexts/season-provider';

interface WriterLayoutProps {
  children: React.ReactNode;
}

export default async function WriterLayout({ children }: WriterLayoutProps) {
  // Fetch user data server-side
  const userResult = await getCurrentUserAction();

  if (!userResult.success || !userResult.data) {
    redirect('/login');
  }

  const user = userResult.data;

  // Check if user has writer role
  if (user.userRole !== 'writer') {
    redirect('/login');
  }

  return (
    <SeasonProvider>
      <DashboardLayout
        userRole={user.userRole as UserRole}
        userRoleDisplay={getRoleDisplayName(user.userRole as UserRole)}
        userName={user.userName}
        userEmail={user.email || ''}
      >
        {children}
      </DashboardLayout>
    </SeasonProvider>
  );
}
