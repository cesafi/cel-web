
import { School } from '@/lib/types/schools';
import { Database } from '@/database.types';

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || true; // Default to true for now

export const mockSchools: School[] = [
  {
    id: '1',
    name: 'University of San Carlos',
    abbreviation: 'USC',
    logo_url: 'https://placehold.co/400x400/336c61/FFFFFF/png?text=USC',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'University of Cebu',
    abbreviation: 'UC',
    logo_url: 'https://placehold.co/400x400/1e40af/FFFFFF/png?text=UC',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'University of San Jose-Recoletos',
    abbreviation: 'USJ-R',
    logo_url: 'https://placehold.co/400x400/047857/FFFFFF/png?text=USJR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Add other mocks as needed
