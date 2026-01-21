# Volunteers Components

This directory contains the components for the public volunteers pages in the CESAFI Sports Web application.

## Overview

The Volunteers section allows visitors to:
- Browse all CESAFI volunteers organized by department and season
- View detailed volunteer profiles with their roles and departments
- Filter volunteers by different seasons and academic years
- Navigate between seasons to see volunteer history

## Components

### `volunteers-hero.tsx`
Hero section for the volunteers listing page:
- **Visual Impact**: Large gradient background with grid pattern overlay
- **Statistics Display**: Shows key metrics (Active Volunteers, Years of Service, Departments)
- **Responsive Design**: Adapts typography and layout for mobile and desktop
- **Animations**: Smooth fade-in animations using Framer Motion

### `seasonal-tabs.tsx`
Season selection and filtering interface:
- **Season Navigation**: Tab-based interface for switching between seasons
- **Dynamic Loading**: Fetches seasons data and handles loading states
- **Auto-Selection**: Automatically selects the first season when loaded
- **Volunteer Filtering**: Filters volunteers by selected season and active status
- **Department Integration**: Works with department groups to organize volunteers
- **Empty States**: Graceful handling when no volunteers are found

### `volunteer-card.tsx`
Individual volunteer display component:
- **Profile Images**: Displays volunteer photos with fallback to initials
- **Image Error Handling**: Graceful fallback when profile images fail to load
- **Volunteer Information**: Shows name, department, and volunteer period
- **Loading States**: Smooth image loading with skeleton states
- **Responsive Cards**: Adapts to different screen sizes
- **Hover Effects**: Interactive animations for better user experience

### `department-groups.tsx`
Groups volunteers by their departments:
- **Department Organization**: Groups volunteers under their respective departments
- **Section Headers**: Clear department titles with volunteer counts
- **Grid Layout**: Responsive grid for volunteer cards
- **Loading Skeletons**: Animated placeholders during data loading
- **Empty State Handling**: Shows appropriate messages when no volunteers exist
- **Animations**: Staggered animations for volunteer cards within departments

## Features

### Data Integration
- Uses existing hooks (`useAllSeasons`, `useAllVolunteers`, `useAllDepartments`)
- Integrates with the current season context
- Handles relationships between volunteers, seasons, and departments

### Responsive Design
- Mobile-first approach with responsive grid layouts
- Adaptive typography and spacing across devices
- Touch-friendly interactive elements for mobile users

### Performance
- Suspense boundaries for loading states
- Optimized images with Next.js Image component
- Efficient data filtering and grouping
- Skeleton loaders to improve perceived performance

### Accessibility
- Semantic HTML structure with proper heading hierarchy
- Keyboard navigation support for tabs and interactive elements
- Screen reader friendly with appropriate ARIA labels
- High contrast design for better readability

### Error Handling
- Graceful image fallbacks with initials for missing profile pictures
- Loading state management across all components
- Empty state handling for seasons without volunteers
- Error boundaries for robust user experience

## Usage

### Volunteers Listing Page
```tsx
// /volunteers
<VolunteersHero />
<SeasonalTabs />
```

### Individual Components
```tsx
// Using the volunteer card
<VolunteerCard volunteer={volunteerData} />

// Using department groups
<DepartmentGroups 
  departmentGroups={groupedData} 
  isLoading={false} 
/>

// Using seasonal tabs
<SeasonalTabs />
```

## Data Flow

1. **Season Selection**: User selects a season from the tabs
2. **Data Filtering**: Volunteers are filtered by selected season ID
3. **Department Grouping**: Filtered volunteers are grouped by department
4. **Rendering**: Department groups render volunteer cards

## Styling

- Uses consistent design tokens from the theme
- Implements Moderniz font for headings and Roboto for body text
- Responsive spacing and typography scales
- Consistent color scheme with primary/secondary variants
- Smooth animations and transitions throughout

## Future Enhancements

Potential improvements for the volunteers section:
1. **Search Functionality**: Add search by volunteer name or department
2. **Advanced Filtering**: Filter by volunteer role, status, or experience
3. **Volunteer Profiles**: Individual profile pages with detailed information
4. **Contact Information**: Add contact methods for volunteer coordination
5. **Achievement Badges**: Display volunteer achievements and recognition
6. **Export Functionality**: Allow exporting volunteer lists for administrative use
7. **Photo Galleries**: Department or season-specific volunteer photo galleries