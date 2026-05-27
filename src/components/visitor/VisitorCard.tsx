import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, shadows } from '../../theme';
import { Visitor } from '../../types/visitor';
import { StatusBadge } from '../common/StatusBadge';
import { AppButton } from '../common/AppButton';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  visitor: Visitor;
  onApprove?: () => void;
  onReject?: () => void;
  isLoadingDecision?: boolean;
}

export const VisitorCard: React.FC<Props> = React.memo(({
  visitor,
  onApprove,
  onReject,
  isLoadingDecision
}) => {
  const showActions = visitor.status === 'pending' && onApprove && onReject;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {visitor.photoUrl ? (
          <Image source={{ uri: visitor.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{visitor.visitorName}</Text>
          <Text style={styles.type}>{visitor.visitorType}</Text>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(visitor.createdAt))} ago
          </Text>
        </View>
        <StatusBadge status={visitor.status} />
      </View>

      {showActions && (
        <View style={styles.actions}>
          <AppButton
            title="Reject"
            variant="danger"
            onPress={onReject}
            style={styles.actionBtn}
            loading={isLoadingDecision}
          />
          <AppButton
            title="Approve"
            variant="success"
            onPress={onApprove}
            style={styles.actionBtn}
            loading={isLoadingDecision}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  type: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  time: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'none',
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 40,
  },
});
