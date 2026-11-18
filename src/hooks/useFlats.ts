import { useQuery } from '@tanstack/react-query';
import { flatService } from '../services/flatService';

export const useFlats = () => {
  const query = useQuery({
    queryKey: ['flats'],
    queryFn: flatService.getSocietyFlats,
    staleTime: 1000 * 60 * 5,
  });

  return {
    flats: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
