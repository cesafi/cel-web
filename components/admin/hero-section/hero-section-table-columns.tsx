import { TableColumn, TableAction } from '@/lib/types/table';
import { HeroSectionLive } from '@/lib/types/hero-section';
import { Eye, Edit, Trash2, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';

export const getHeroSectionColumns = (): TableColumn<HeroSectionLive>[] => [
  {
    key: 'heroInfo',
    header: 'Hero Section Information',
    sortable: false,
    width: '35%',
    render: (hero) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <Video className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-sm font-medium">
            Hero Section #{hero.id}
          </div>
          <div className="text-muted-foreground text-xs">Live Video Section</div>
        </div>
      </div>
    )
  },
  {
    key: 'video_link',
    header: 'Video Content',
    sortable: false,
    width: '30%',
    render: (hero) => {
      const getVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
      };

      const videoId = getVideoId(hero.video_link);
      const videoTitle = videoId ? `Video ID: ${videoId}` : 'YouTube Video';

      return (
        <div className="space-y-1">
          <div className="text-foreground truncate text-sm font-medium">{videoTitle}</div>
          <div className="text-muted-foreground truncate text-xs">{hero.video_link}</div>
        </div>
      );
    }
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '20%',
    render: (hero) => {
      const endDate = new Date(hero.end_at);
      const now = new Date();
      const isExpired = endDate < now;

      return (
        <Badge
          className={`border ${
            isExpired
              ? 'border-red-200 bg-red-100 text-red-800'
              : 'border-green-200 bg-green-100 text-green-800'
          }`}
        >
          {isExpired ? 'Expired' : 'Active'}
        </Badge>
      );
    }
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '15%',
    render: (hero) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(hero.created_at)}
      </div>
    )
  }
];

export const getHeroSectionActions = (
  onView: (hero: HeroSectionLive) => void,
  onEdit: (hero: HeroSectionLive) => void,
  onDelete: (hero: HeroSectionLive) => void
): TableAction<HeroSectionLive>[] => [
  {
    key: 'view',
    label: 'View Hero Section',
    icon: <Eye className="h-4 w-4" />,
    onClick: onView,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'edit',
    label: 'Edit Hero Section',
    icon: <Edit className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Hero Section',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
