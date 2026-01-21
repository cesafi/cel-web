# Dashboard Components

This directory contains the dashboard layout components for the CESAFI management portal.

## Components

### DashboardLayout
The main layout wrapper that provides the dashboard structure with header and sidebar.

#### Props
- `children`: ReactNode - The content to render in the main area
- `userRole`: Technical role for logic (e.g., 'admin', 'head_writer', 'writer', 'league_operator')
- `userRoleDisplay`: Human-readable role for display (e.g., 'Admin', 'Head Writer', 'League Operator')
- `userName`: User's display name
- `userEmail`: User's email address

#### Usage Examples

**Basic Usage (with all user information):**
```tsx
import { DashboardLayout } from '@/components/dashboard';
import { useCurrentUser } from '@/hooks/use-auth';

export default function AdminPage() {
  const { data: user } = useCurrentUser();
  
  return (
    <DashboardLayout 
      userRole="admin"
      userRoleDisplay="Admin"
      userName={user?.userName || 'Admin'}
      userEmail={user?.email || 'admin@cesafi.org'}
    >
      <div>Your admin content here</div>
    </DashboardLayout>
  );
}
```

**With Role Mapping:**
```tsx
const roleDisplayMap = {
  admin: 'Administrator',
  head_writer: 'Head Writer',
  writer: 'Writer',
  league_operator: 'League Operator'
};

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const userRole = user?.userRole || 'admin';
  
  return (
    <DashboardLayout 
      userRole={userRole}
      userRoleDisplay={roleDisplayMap[userRole as keyof typeof roleDisplayMap]}
      userName={user?.userName || 'User'}
      userEmail={user?.email || 'user@cesafi.org'}
    >
      <div>Your dashboard content here</div>
    </DashboardLayout>
  );
}
```

**Simple Usage (with defaults):**
```tsx
export default function SimplePage() {
  return (
    <DashboardLayout userRole="admin" userRoleDisplay="Admin">
      <div>Simple content</div>
    </DashboardLayout>
  );
}
```

### DashboardHeader
The top navigation bar that displays user information and controls.

#### Props
- `userEmail`: User's email address
- `userName`: User's display name  
- `userRole`: Human-readable role for display

### DashboardSidebar
The left navigation sidebar that shows menu items based on user role.

#### Props
- `userRole`: Technical role used to determine which menu items to show

## Key Differences

### `userRole` vs `userRoleDisplay`

- **`userRole`** (Technical/Internal):
  - Used for **logic and permissions**
  - Determines sidebar menu items
  - Used in API calls and access control
  - Examples: `'admin'`, `'head_writer'`, `'writer'`

- **`userRoleDisplay`** (Human-Readable):
  - Used for **user interface display**
  - Shows friendly role names to users
  - Examples: `'Administrator'`, `'Head Writer'`, `'League Operator'`

### User Information Flow

1. **Authentication**: User logs in with email/password
2. **Role Assignment**: System assigns technical role (e.g., `'admin'`)
3. **Display Mapping**: Technical role maps to display role (e.g., `'Administrator'`)
4. **Layout Rendering**: Dashboard shows appropriate sidebar and header information

## Best Practices

1. **Always provide `userRole`** for proper sidebar functionality
2. **Use `userRoleDisplay`** for user-friendly interface text
3. **Include `userEmail`** when available for better user identification
4. **Use `useCurrentUser()` hook** to get real-time user information
5. **Provide fallbacks** for all user information props

## Example Implementation

Here's a complete example showing how to implement a dashboard page with full user information:

```tsx
'use client';

import { DashboardLayout } from '@/components/dashboard';
import { useCurrentUser } from '@/hooks/use-auth';

const roleDisplayMap = {
  admin: 'Administrator',
  head_writer: 'Head Writer', 
  writer: 'Writer',
  league_operator: 'League Operator'
};

export default function DashboardPage() {
  const { data: user, isLoading, error } = useCurrentUser();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (error || !user) {
    return <div>Error loading user information</div>;
  }
  
  const userRole = user.userRole || 'admin';
  const userRoleDisplay = roleDisplayMap[userRole as keyof typeof roleDisplayMap] || 'User';
  
  return (
    <DashboardLayout 
      userRole={userRole}
      userRoleDisplay={userRoleDisplay}
      userName={user.userName}
      userEmail={user.email}
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome, {user.userName}!</h1>
        <p className="text-muted-foreground">
          You are logged in as a {userRoleDisplay.toLowerCase()}
        </p>
        {/* Your dashboard content here */}
      </div>
    </DashboardLayout>
  );
}
```
