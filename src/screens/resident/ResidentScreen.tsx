import React, { useEffect } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { VisitorCard } from '../../components/visitor/VisitorCard';
import { useAuth } from '../../hooks/useAuth';
import { useVisitors } from '../../hooks/useVisitors';
import { realtimeService } from '../../services/realtimeService';
import { colors, spacing, typography } from '../../theme';
import { VisitorStatus } from '../../types/visitor';

export const ResidentScreen: React.FC = () => {
  const { user } = useAuth();
  const { visitors, isLoading, isRefreshing, error, refetch, updateStatus, isUpdating } =
    useVisitors();

  useEffect(() => {
    if (!user?.flatId) return;

    const channel = realtimeService.subscribeToFlatVisitors(user.flatId, () => {
      void refetch();
    });

    return () => realtimeService.unsubscribe(channel);
  }, [user?.flatId, refetch]);

  const handleDecision = async (visitorId: string, status: VisitorStatus) => {
    try {
      await updateStatus({ visitorId, status });
    } catch (error) {
      console.error('Could not update visitor decision', error);
      Alert.alert(
        'Could Not Save Decision',
        'The decision was not saved. Check your connection and try again.',
      );
    }
  };

  if (isLoading && visitors.length === 0) {
    return <LoadingOverlay visible />;
  }

  return (
    <ScreenContainer withPadding={false}>
      <FlatList
        data={visitors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VisitorCard
            visitor={item}
            onApprove={() => {
              void handleDecision(item.id, 'approved');
            }}
            onReject={() => {
              void handleDecision(item.id, 'rejected');
            }}
            isLoadingDecision={isUpdating}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          error && visitors.length > 0 ? (
            <Text style={styles.errorText}>Could not refresh visitors. Pull down to retry.</Text>
          ) : undefined
        }
        ListEmptyComponent={
          !isLoading ? (
            error ? (
              <EmptyState
                title="Could Not Load Visitors"
                message="Check your connection and pull down to retry."
              />
            ) : (
              <EmptyState
                title={user?.flatId ? 'No Visitors' : 'No Flat Assigned'}
                message={
                  user?.flatId
                    ? 'Your visitor history will appear here.'
                    : 'Ask your society administrator to assign you to a flat.'
                }
              />
            )
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void refetch();
            }}
            colors={[colors.primary]}
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
    flexGrow: 1,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginBottom: spacing.md,
  },
});
