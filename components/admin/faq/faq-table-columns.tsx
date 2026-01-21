import { Faq } from '@/lib/types/faq';
import { TableColumn, TableAction } from '@/lib/types/table';
import { Eye, Edit, Trash2, Star, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';

export const getFaqColumns = (): TableColumn<Faq>[] => [
  {
    key: 'faqInfo',
    header: 'FAQ Information',
    sortable: false,
    width: '40%',
    render: (faq) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">
            {faq.question}
          </div>
          <div className="text-xs text-muted-foreground">
            Order: {faq.display_order}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'answer',
    header: 'Answer',
    sortable: false,
    width: '25%',
    render: (faq) => (
      <div className="text-sm text-muted-foreground line-clamp-2" title={faq.answer}>
        {faq.answer}
      </div>
    )
  },
  {
    key: 'category',
    header: 'Category',
    sortable: true,
    width: '15%',
    render: (faq) => (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border capitalize">
        {faq.category || 'General'}
      </Badge>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '10%',
    render: (faq) => (
      <Badge
        className={`${faq.is_active 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-muted text-muted-foreground border-muted'
        } border`}
      >
        {faq.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '10%',
    render: (faq) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(faq.created_at)}
      </div>
    )
  }
];

export const getFaqActions = (
  onView: (faq: Faq) => void,
  onEdit: (faq: Faq) => void,
  onDelete: (faq: Faq) => void,
  onToggleHighlight: (faq: Faq) => void
): TableAction<Faq>[] => [
  {
    key: 'view',
    label: 'View FAQ',
    icon: <Eye className="h-4 w-4" />,
    onClick: onView,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'edit',
    label: 'Edit FAQ',
    icon: <Edit className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'toggle-highlight',
    label: 'Toggle Highlight',
    icon: <Star className="h-4 w-4" />,
    onClick: onToggleHighlight,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete FAQ',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
