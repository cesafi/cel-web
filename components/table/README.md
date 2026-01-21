# Table Components

A comprehensive, reusable table system for managing data tables with pagination, sorting, searching, and filtering capabilities.

## 📁 Folder Structure

```
src/components/table/
├── index.ts                 # Main exports
├── data-table.tsx          # Main DataTable component
├── sortable-header.tsx     # Sortable column headers
├── table-pagination.tsx    # Pagination controls
├── table-search-filters.tsx # Search and filter controls
└── README.md               # This documentation
```

## 🚀 Quick Start

```tsx
import { DataTable } from '@/components/table';
import { useTable } from '@/hooks/use-table';

// Define your columns
const columns = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (item) => <span>{item.name}</span>
  }
];

// Use the table
function MyTable() {
  const { data, loading, ...tableProps } = useMyData();
  
  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      {...tableProps}
    />
  );
}
```

## 🧩 Components

### DataTable
The main table component that orchestrates all table functionality.

**Props:**
- `data`: Array of items to display
- `columns`: Column definitions
- `actions`: Row-level actions
- `loading`: Loading state
- `error`: Error state
- `pagination`: Pagination configuration
- `search`: Search functionality
- `filters`: Filter options

### SortableHeader
Renders sortable column headers with visual indicators.

### TablePagination
Handles page navigation and page size selection.

### TableSearchAndFilters
Provides search input and filter controls.

## 🔧 Configuration

### Column Definition
```tsx
interface TableColumn<T extends BaseEntity> {
  key: string;                    // Unique identifier
  header: string;                 // Display text
  sortable?: boolean;             // Can be sorted
  width?: string | number;        // Column width
  render: (item: T, index: number) => ReactNode; // Render function
}
```

### Action Definition
```tsx
interface TableAction<T extends BaseEntity> {
  key: string;                    // Unique identifier
  label: string;                  // Display text
  icon: ReactNode;                // Action icon
  onClick: (item: T) => void;     // Click handler
  variant?: ButtonVariant;        // Button style
  size?: ButtonSize;              // Button size
  disabled?: (item: T) => boolean; // Disabled condition
  hidden?: (item: T) => boolean;  // Hidden condition
}
```

## 🎨 Styling

The table components use semantic color tokens for consistent theming:

- `bg-primary` - Primary backgrounds
- `bg-muted` - Muted backgrounds  
- `text-primary-foreground` - Primary text
- `text-foreground` - Default text
- `border-border` - Border colors

## 🔄 State Management

Use the `useTable` hook for managing table state:

```tsx
const {
  tableState,
  setPage,
  setPageSize,
  setSortBy,
  setSearch,
  setFilters,
  paginationOptions
} = useTable({
  initialPage: 1,
  initialPageSize: 10,
  initialSortBy: 'createdAt',
  initialSortOrder: 'desc'
});
```

## 📱 Responsive Design

The table components are fully responsive and work on all screen sizes.

## 🚀 Performance

- Virtual scrolling support for large datasets
- Debounced search input
- Optimized re-renders
- Efficient pagination

## 🔒 Type Safety

All components are fully typed with TypeScript and use generic constraints:

```tsx
// Your entity must extend BaseEntity
interface MyEntity extends BaseEntity {
  name: string;
  status: 'active' | 'inactive';
}

// Use in components
<DataTable<MyEntity> data={data} columns={columns} />
```

## 📚 Examples

See the following files for complete examples:
- `src/components/admin/accounts-table-columns.tsx` - Account management
- `src/components/admin/schools-table-columns.tsx` - School management
- `src/hooks/use-accounts-table.ts` - Table hook implementation

## 🎯 Best Practices

1. **Extend BaseEntity**: Always make your entities extend `BaseEntity`
2. **Use Semantic Colors**: Leverage the existing color system
3. **Implement Proper Loading States**: Show loading indicators during data fetching
4. **Handle Errors Gracefully**: Display user-friendly error messages
5. **Optimize Re-renders**: Use React.memo for expensive render functions
6. **Accessibility**: Ensure proper ARIA labels and keyboard navigation

## 🔧 Customization

The table system is highly customizable:

- Custom column renderers
- Conditional row styling
- Custom action buttons
- Flexible pagination options
- Configurable search and filters
- Theme-aware styling

## 🐛 Troubleshooting

### Common Issues

1. **Type Errors**: Ensure your entity extends `BaseEntity`
2. **Import Errors**: Use `@/components/table` for imports
3. **Styling Issues**: Check that semantic color tokens are available
4. **Performance Issues**: Implement proper memoization for render functions

### Getting Help

- Check the component props and types
- Review existing implementations
- Ensure all dependencies are properly imported
- Verify the entity interface extends `BaseEntity`
