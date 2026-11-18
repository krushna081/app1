import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '../services/visitorService';
import { VisitorStatus } from '../types/visitor';

export const useGuardVisitors = () => {
  const queryClient = useQueryClient();

  const visitorsQuery = useQuery({
    queryKey: ['guard-visitors'],
    queryFn: visitorService.getGuardVisitors,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ visitorId, status }: { visitorId: string; status: VisitorStatus }) =>
      visitorService.updateVisitorStatus(visitorId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guard-visitors'] });
      void queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  return {
    visitors: visitorsQuery.data ?? [],
    isLoading: visitorsQuery.isLoading,
    isFetching: visitorsQuery.isFetching,
    error: visitorsQuery.error,
    refetch: visitorsQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
};
