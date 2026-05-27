import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '../services/visitorService';
import { VisitorStatus } from '../types/visitor';

export const useVisitors = (flatId?: string) => {
  const queryClient = useQueryClient();

  const visitorsQuery = useQuery({
    queryKey: ['visitors', flatId],
    queryFn: () => flatId ? visitorService.getResidentVisitors(flatId) : Promise.resolve([]),
    enabled: !!flatId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ visitorId, status, userId }: { visitorId: string, status: VisitorStatus, userId: string }) =>
      visitorService.updateVisitorStatus(visitorId, status, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  return {
    visitors: visitorsQuery.data ?? [],
    isLoading: visitorsQuery.isLoading,
    refetch: visitorsQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
};
