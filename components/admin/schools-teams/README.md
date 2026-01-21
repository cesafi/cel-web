# Schools Teams Management System

This directory contains the components for managing school teams in the admin dashboard.

## Overview

The Schools Teams Management System allows administrators to:
- Select a school to manage teams for
- View all teams for the selected school
- Create new teams with sport categories and seasons
- Edit existing team information
- Delete teams (with confirmation)
- Switch between different schools seamlessly

## Architecture

### **Page-Exclusive School Context**
- **Local State**: School selection is managed locally within the page component
- **No Global Context**: Other admin pages are unaffected by school selection
- **Clean Architecture**: Simple state management without global context pollution

## Components

### `school-selector.tsx`
School selection component that allows users to switch between schools:
- **Dropdown Selection**: Shows all available schools with logos and abbreviations
- **Auto-Selection**: Automatically selects the first school on page load
- **Current School Display**: Shows which school is currently selected
- **Loading States**: Handles loading and empty states gracefully

### `schools-teams-table-columns.tsx`
Defines the table columns and actions for displaying school teams:
- **Team Information**: Shows team name and ID with a trophy icon
- **Sport & Category**: Displays sport name and formatted category details
- **Season**: Shows the season ID
- **Status**: Active/Inactive badge
- **Created**: Shows the creation date
- **Actions**: Edit and delete buttons

### `school-team-modal.tsx`
Modal component for creating and editing school teams:
- **Team Name**: Text input for team name
- **Sport Selection**: Dropdown to select a sport
- **Sport Category Selection**: Filtered dropdown based on selected sport
- **Season Selection**: Dropdown to select a season (defaults to current season)
- **Active Status**: Toggle switch for team status

**Form Pattern**: Uses the established form ID pattern for proper submission behavior.

### `page.tsx`
Main page component that integrates all functionality:
- **School Selector**: At the top for switching schools
- **Teams Table**: Below showing teams for selected school
- **Modal Management**: Handles team creation, editing, and deletion
- **State Management**: Manages school selection and team operations

## Data Flow

1. **Page Load**: Fetches available schools and auto-selects the first one
2. **School Selection**: User can switch between schools using the selector
3. **Teams Fetching**: Automatically fetches teams for the selected school
4. **CRUD Operations**: All team operations are scoped to the selected school
5. **Real-time Updates**: Table refreshes after successful operations

## Key Features

### School-Centric Management
- **Single School Focus**: Always shows teams for one school at a time
- **Easy Switching**: Quick navigation between schools without page reloads
- **Context Awareness**: Page title and subtitle reflect the selected school
- **Scoped Operations**: All team operations are limited to the selected school

### Team Management
- **Full CRUD**: Create, read, update, and delete teams
- **Sport Integration**: Teams are linked to specific sport categories
- **Season Awareness**: Teams are associated with specific seasons
- **Status Control**: Active/inactive team status management

### User Experience
- **Loading States**: Visual feedback during data fetching
- **Error Handling**: Graceful error handling and user feedback
- **Responsive Design**: Works well on different screen sizes
- **Consistent UI**: Follows established admin patterns

## State Management

### Local State (Page-Exclusive)
```tsx
const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
const [editingTeam, setEditingTeam] = useState<SchoolsTeamWithSportDetails | undefined>();
```

### Hook Integration
```tsx
const {
  teams,
  createTeam,
  updateTeam,
  deleteTeam,
  // ... other properties
} = useSchoolsTeamsTable(selectedSchoolId);
```

## Database Schema

The system works with the `schools_teams` table:
- `id`: Primary key (string)
- `name`: Team name
- `school_id`: Foreign key to schools table
- `season_id`: Foreign key to seasons table
- `sport_category_id`: Foreign key to sports_categories table
- `is_active`: Boolean status
- `created_at`, `updated_at`: Timestamps

## Dependencies

- **React Query**: For data fetching and caching
- **Shadcn/UI**: For UI components
- **Lucide React**: For icons
- **Season Context**: For current season management
- **Sports Utils**: For formatting sport category names

## Usage

Navigate to `/admin/schools-teams` to access the management interface. The system:
1. Automatically loads available schools
2. Selects the first school by default
3. Shows teams for the selected school
4. Allows switching between schools
5. Provides full team management capabilities

## Implementation Notes

### School Selection Pattern
- **Local State**: School selection is page-exclusive
- **Auto-Selection**: First school is automatically selected
- **No Persistence**: Selection is lost when leaving the page
- **Clean Context**: No global state pollution

### Team Operations
- **School-Scoped**: All operations are limited to the selected school
- **Real-time Updates**: Table refreshes after successful operations
- **Error Handling**: Comprehensive error handling with user feedback
- **Validation**: Client-side validation for all form fields

### Performance Considerations
- **Conditional Fetching**: Teams are only fetched when a school is selected
- **Query Invalidation**: Proper cache invalidation after mutations
- **Loading States**: Separate loading states for initial load vs. operations
- **Optimistic Updates**: Immediate UI feedback for better UX
