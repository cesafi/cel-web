import { TableColumn, TableAction } from '@/lib/types/table';
import { PhotoGallery } from '@/lib/types/photo-gallery';
import { formatTableDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';
import { User, Tag, Eye, Edit, Trash2 } from 'lucide-react';

export const getPhotoGalleryColumns = (): TableColumn<PhotoGallery>[] => [
  {
    key: 'id',
    header: 'ID',
    sortable: true,
    width: '80px',
    render: (photo) => <span className="text-sm">{photo.id}</span>
  },
  {
    key: 'photo_url',
    header: 'Photo',
    sortable: false,
    width: '120px',
    render: (photo) => (
      <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.photo_url} alt={photo.title} className="h-full w-full object-cover" />
      </div>
    )
  },
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    render: (photo) => <span className="font-medium">{photo.title}</span>
  },
  {
    key: 'category',
    header: 'Category',
    sortable: true,
    render: (photo) => (
      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
        <Tag className="mr-1 h-3 w-3" />
        {photo.category}
      </Badge>
    )
  },
  {
    key: 'photo_by',
    header: 'Photographer',
    sortable: true,
    render: (photo) => (
      <div className="text-muted-foreground flex items-center text-sm">
        <User className="mr-1 h-4 w-4" />
        {photo.photo_by}
      </div>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    render: (photo) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(photo.created_at)}
      </div>
    )
  }
];

export const getPhotoGalleryActions = (): TableAction<PhotoGallery>[] => [
  {
    key: 'view',
    label: 'View',
    icon: <Eye className="h-4 w-4" />,
    variant: 'ghost',
    onClick: (photo) => {
      // This will be handled by the parent component
      console.log('View photo:', photo.id);
    }
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    variant: 'ghost',
    onClick: (photo) => {
      // This will be handled by the parent component
      console.log('Edit photo:', photo.id);
    }
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'ghost',
    onClick: (photo) => {
      // This will be handled by the parent component
      console.log('Delete photo:', photo.id);
    }
  }
];
