# Schools Components

This directory contains the components for the public schools pages in the CESAFI Sports Web application.

## Overview

The Schools section allows visitors to:
- Browse all member schools in CESAFI
- View detailed school profiles with teams and recent matches
- Navigate between schools and other sections of the site

## Components

### `schools-hero.tsx`
Hero section for the schools listing page:
- **Visual Impact**: Large title with school-related icons
- **Description**: Brief overview of CESAFI member schools
- **Stats Preview**: Shows key metrics about member schools

### `schools-grid.tsx`
Grid layout displaying all member schools:
- **School Cards**: Each school displayed in an attractive card format
- **School Information**: Logo, name, abbreviation, and status
- **Interactive Elements**: Hover effects and navigation to individual profiles
- **Loading States**: Skeleton loaders while data is being fetched
- **Error Handling**: Graceful error states and empty states
- **Stats Section**: Summary statistics at the bottom

### `school-profile.tsx`
Individual school profile page:
- **School Header**: Large logo, name, abbreviation, and status
- **Statistics Cards**: Active teams, recent activity, and membership status
- **Teams Section**: List of active teams for the school
- **Recent Matches**: Latest matches involving the school (when available)
- **Navigation**: Back button and links to other sections

## Features

### Data Integration
- Uses existing hooks (`useAllSchools`, `useSchoolById`, `useSchoolsTeamsBySchoolId`)
- Integrates with the current season context
- Fetches recent matches data

### Responsive Design
- Mobile-first approach with responsive grid layouts
- Adaptive typography and spacing
- Touch-friendly interactive elements

### Performance
- Suspense boundaries for loading states
- Optimized images with Next.js Image component
- Efficient data fetching with React Query

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly

## Usage

### Schools Listing Page
```tsx
// /schools
<SchoolsHero />
<SchoolsGrid />
```

### Individual School Profile
```tsx
// /schools/[abbreviation]
<SchoolProfile schoolAbbreviation={params.abbreviation} />
```

## Navigation

The schools section is integrated into the main navigation:
- **Navbar**: "Schools" link in the main navigation
- **Footer**: "Schools" link in the quick links section
- **Breadcrumbs**: Contextual navigation within school profiles

## Future Enhancements

Potential improvements for the schools section:
1. **Search and Filtering**: Add search functionality and filters for schools
2. **School Statistics**: More detailed statistics and performance metrics
3. **Team Details**: Expand team information with player rosters
4. **Match History**: Complete match history for each school
5. **Social Features**: School news, announcements, and social media integration
6. **Performance Analytics**: Win/loss records, championship history
7. **Photo Galleries**: School-specific photo galleries and achievements
