# Shared Components

This directory contains reusable components that can be used across different parts of the application.

## Article Components

### `article-card.tsx`
A versatile, reusable article display component with multiple variants:

#### Features
- **Multiple Variants**: Featured, default, and compact layouts for different use cases
- **Responsive Design**: Adapts to different screen sizes and containers
- **Rich Metadata**: Displays author, publish date, category, and read time
- **Interactive Elements**: Hover effects and smooth animations
- **Optimized Images**: Uses Next.js Image component for performance

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `article` | `Article` | - | Article data object with title, excerpt, author, etc. |
| `variant` | `'default' \| 'featured' \| 'compact'` | `'default'` | Display variant |
| `index` | `number` | `0` | Index for staggered animations |

#### Usage
```tsx
// Featured article (large, side-by-side layout)
<ArticleCard article={article} variant="featured" />

// Default article (standard card)
<ArticleCard article={article} variant="default" />

// Compact article (small, horizontal layout)
<ArticleCard article={article} variant="compact" />
```

### `share-buttons.tsx`
Social sharing component for articles and content:

#### Features
- **Multiple Platforms**: Twitter, Facebook, and link copying
- **Toast Notifications**: User feedback for successful actions
- **Loading States**: Prevents double-clicks during sharing
- **Error Handling**: Graceful fallbacks for sharing failures

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Content title for sharing |
| `url` | `string` | `window.location.href` | URL to share |

#### Usage
```tsx
<ShareButtons 
  title="Article Title"
  url="https://example.com/article"
/>
```

### `more-articles.tsx`
Sidebar component for suggesting related articles:

#### Features
- **Compact Layout**: Space-efficient article suggestions
- **Configurable Limit**: Control number of articles displayed
- **Consistent Styling**: Matches overall design system
- **Navigation Links**: Direct links to full article views

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `articles` | `Article[]` | - | Array of article objects |
| `maxItems` | `number` | `3` | Maximum articles to display |

#### Usage
```tsx
<MoreArticles 
  articles={relatedArticles} 
  maxItems={5} 
/>
```

## SmartBreadcrumbs

A smart, reusable breadcrumb component that automatically handles long routes by showing ellipsis when there are too many breadcrumb items.

### Features

- **Automatic Route Parsing**: Automatically generates breadcrumbs from the current URL path
- **Smart Ellipsis**: Shows "..." when there are too many breadcrumb items to prevent overflow
- **Configurable**: Customizable maximum visible items, home label, and home icon
- **Responsive**: Automatically adapts to different screen sizes
- **Accessible**: Built with proper ARIA labels and semantic HTML

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxVisibleItems` | `number` | `5` | Maximum number of breadcrumb items to show before ellipsis |
| `className` | `string` | `''` | Additional CSS classes for styling |
| `showHomeIcon` | `boolean` | `true` | Whether to show the home icon on the first breadcrumb |
| `customHomeLabel` | `string` | `'Admin Dashboard'` | Custom label for the home/first breadcrumb |

### Usage

#### Basic Usage

```tsx
import { SmartBreadcrumbs } from '@/components/shared';

function MyComponent() {
  return <SmartBreadcrumbs />;
}
```

#### With Custom Configuration

```tsx
import { SmartBreadcrumbs } from '@/components/shared';

function MyComponent() {
  return (
    <SmartBreadcrumbs 
      maxVisibleItems={3}
      showHomeIcon={false}
      customHomeLabel="Dashboard"
      className="my-custom-class"
    />
  );
}
```

### How It Works

1. **Route Parsing**: The component automatically parses the current URL path into segments
2. **Smart Truncation**: When the number of breadcrumb items exceeds `maxVisibleItems`:
   - Always shows the first item (home)
   - Always shows the last item (current page)
   - Shows some middle items if possible
   - Adds ellipsis (`...`) when needed
3. **Label Formatting**: Automatically formats URL segments into readable labels (e.g., "user-profile" → "User Profile")

### Examples

#### Short Route
```
/admin/schools
```
Shows: `Admin Dashboard > Schools`

#### Medium Route
```
/admin/schools/123/teams
```
Shows: `Admin Dashboard > Schools > 123 > Teams`

#### Long Route (with ellipsis)
```
/admin/schools/123/teams/456/players/789/profile
```
Shows: `Admin Dashboard > Schools > ... > Profile` (when maxVisibleItems = 5)

### Integration

The component is already integrated into the admin dashboard header and can be easily added to any other part of the application that needs breadcrumb navigation.

### Accessibility

- Uses proper `nav` element with `aria-label="breadcrumb"`
- Each breadcrumb item has appropriate ARIA attributes
- Ellipsis includes screen reader text ("More")
- Separators are properly marked as presentational

## Design System Integration

All shared components follow the established design system:

### Typography
- **Headings**: Use Moderniz font for consistency
- **Body Text**: Use Roboto font for readability
- **Responsive Scaling**: Typography scales appropriately across devices

### Colors
- **Theme Integration**: Components respect light/dark mode preferences
- **Semantic Colors**: Use primary, secondary, and accent colors appropriately
- **Accessibility**: Maintain proper contrast ratios

### Spacing
- **Consistent Margins**: Use design tokens for spacing
- **Responsive Padding**: Adapts to different screen sizes
- **Grid Alignment**: Components align with the overall layout grid

### Animations
- **Framer Motion**: Consistent animation library usage
- **Performance**: Optimized animations that don't impact performance
- **Accessibility**: Respects user preferences for reduced motion
