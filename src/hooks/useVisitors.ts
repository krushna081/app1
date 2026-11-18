import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '../services/visitorService';
import { VisitorStatus } from '../types/visitor';

export const useVisitors = () => {
  const queryClient = useQueryClient();

  const visitorsQuery = useQuery({
    queryKey: ['visitors'],
    queryFn: visitorService.getResidentVisitors,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ visitorId, status }: { visitorId: string; status: VisitorStatus }) =>
      visitorService.updateVisitorStatus(visitorId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  return {
    visitors: visitorsQuery.data ?? [],
    isLoading: visitorsQuery.isLoading,
    isRefreshing: visitorsQuery.isFetching,
    error: visitorsQuery.error,
    refetch: visitorsQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
};
