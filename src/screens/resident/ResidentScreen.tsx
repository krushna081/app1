import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { VisitorCard } from '../../components/visitor/VisitorCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useVisitors } from '../../hooks/useVisitors';
import { realtimeService } from '../../services/realtimeService';
import { VisitorStatus } from '../../types/visitor';
import { colors } from '../../theme';

export const ResidentScreen: React.FC = () => {
  const { user } = useAuth();
  const { visitors, isLoading, refetch, updateStatus, isUpdating } = useVisitors(user?.flatId || '');

  useEffect(() => {
    if (user?.flatId) {
      const channel = realtimeService.subscribeToFlatVisitors(user.flatId, () => {
        refetch();
      });
      return () => {
        realtimeService.unsubscribe(channel);
      };
    }
  }, [user?.flatId, refetch]);

  const handleDecision = async (visitorId: string, status: VisitorStatus) => {
    try {
      await updateStatus({ visitorId, status, userId: user!.id });
    } catch (error) {
      Alert.alert('Error', 'Could not save decision. Please try again.');
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <FlatList
        data={visitors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VisitorCard
            visitor={item}
            onApprove={() => handleDecision(item.id, 'approved')}
            onReject={() => handleDecision(item.id, 'rejected')}
            isLoadingDecision={isUpdating}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No Visitors"
              message="Your visitor history will appear here."
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
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
});
