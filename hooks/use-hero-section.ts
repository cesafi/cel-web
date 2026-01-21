import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaginatedHeroSectionLive, getAllHeroSectionLive, getCurrentActiveHeroSection, getHeroSectionLiveById, createHeroSectionLive, updateHeroSectionLive, deleteHeroSectionLive } from '@/actions/hero-section';
import { HeroSectionLiveInsert, HeroSectionLiveUpdate, HeroSectionLivePaginationOptions } from '@/lib/types/hero-section';
import { toast } from 'sonner';

const HERO_SECTION_QUERY_KEY = 'hero-section-live';

export const usePaginatedHeroSectionLive = (options: HeroSectionLivePaginationOptions) => {
  return useQuery({
    queryKey: [HERO_SECTION_QUERY_KEY, options],
    queryFn: () => getPaginatedHeroSectionLive(options),
    placeholderData: (previousData) => previousData,
  });
};

export const useAllHeroSectionLive = () => {
  return useQuery({
    queryKey: [HERO_SECTION_QUERY_KEY, 'all'],
    queryFn: () => getAllHeroSectionLive(),
    placeholderData: (previousData) => previousData,
  });
};

export const useCurrentActiveHeroSection = () => {
  return useQuery({
    queryKey: [HERO_SECTION_QUERY_KEY, 'current-active'],
    queryFn: () => getCurrentActiveHeroSection(),
    refetchInterval: 60000, // Refetch every minute to check if expired
    placeholderData: (previousData) => previousData,
  });
};

export const useHeroSectionLiveById = (id: number) => {
  return useQuery({
    queryKey: [HERO_SECTION_QUERY_KEY, id],
    queryFn: () => getHeroSectionLiveById(id),
    enabled: !!id,
  });
};

export const useCreateHeroSectionLive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HeroSectionLiveInsert) => createHeroSectionLive(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HERO_SECTION_QUERY_KEY] });
      toast.success('Hero section created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create hero section');
    },
  });
};

export const useUpdateHeroSectionLive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HeroSectionLiveUpdate }) => updateHeroSectionLive(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HERO_SECTION_QUERY_KEY] });
      toast.success('Hero section updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update hero section');
    },
  });
};

export const useDeleteHeroSectionLive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteHeroSectionLive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HERO_SECTION_QUERY_KEY] });
      toast.success('Hero section deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete hero section');
    },
  });
};
