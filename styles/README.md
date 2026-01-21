# Article Content Styling

This document explains the consistent styling approach for article content across the CESAFI platform.

## Overview

The article content styling system ensures consistency between:
- The Lexical editor (used for writing articles)
- Published article pages (`/news/[slug]`)
- Article preview pages (`/preview/articles/[id]`)

## Font Usage

### Moderniz Font
- **Usage**: Headings (h1, h2, h3, h4, h5, h6)
- **CSS Variable**: `var(--font-moderniz)`
- **Class**: `.font-moderniz`

### Roboto Font
- **Usage**: Body text, paragraphs, lists, blockquotes
- **CSS Variable**: `var(--font-roboto)`
- **Class**: `.font-roboto`

## Implementation

### 1. CSS File
The main styling is defined in `src/styles/article-content.css`:
- Base typography settings
- Heading styles with Moderniz font
- Body text styles with Roboto font
- Consistent spacing and formatting
- Responsive design considerations

### 2. Content Renderer Utility
Located in `src/lib/utils/content-renderer.ts`:

```typescript
// Get consistent CSS classes for article content
const classes = getArticleContentClasses();

// Get props for rendering article content
const contentProps = getArticleContentProps(content);

// Get Lexical editor theme that matches the CSS
const theme = getLexicalEditorTheme();
```

### 3. Usage in Components

#### For Article Pages
```tsx
import { getArticleContentProps } from '@/lib/utils/content-renderer';

// In your component
<article {...getArticleContentProps(article.content)} />
```

#### For Lexical Editor
The editor automatically uses the consistent theme from `getLexicalEditorTheme()`.

## Key Features

1. **Font Consistency**: Moderniz for headings, Roboto for body text
2. **Unified Styling**: Same CSS classes used everywhere
3. **Responsive Design**: Mobile-optimized typography
4. **Accessibility**: Proper focus states and semantic markup
5. **Print Styles**: Optimized for printing
6. **Theme Support**: Works with light/dark themes

## Maintenance

When making changes to article styling:

1. Update `src/styles/article-content.css` for visual changes
2. Update `getLexicalEditorTheme()` in `content-renderer.ts` for editor consistency
3. Test changes in both the editor and published articles
4. Ensure font variables are properly applied

## CSS Classes

- `.article-content`: Main container class
- `.font-moderniz`: Moderniz font family
- `.font-roboto`: Roboto font family
- `.lexical-editor`: Container for Lexical editor instances

## Browser Support

The styling system supports all modern browsers and gracefully degrades with fallback fonts:
- Primary: Custom fonts (Moderniz, Roboto)
- Fallback: `system-ui, arial, sans-serif`