import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { VisitorStatus } from '../../types/visitor';

interface Props {
  status: VisitorStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'approved': return { bg: '#DCFCE7', text: colors.success };
      case 'rejected': return { bg: '#FEE2E2', text: colors.danger };
      case 'pending': return { bg: '#FEF3C7', text: colors.warning };
      case 'entered': return { bg: '#DBEAFE', text: colors.primary };
      case 'exited': return { bg: '#F1F5F9', text: colors.secondary };
      default: return { bg: colors.border, text: colors.textSecondary };
    }
  };

  const { bg, text } = getStatusStyles();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.label,
    fontSize: 10,
    fontWeight: '700',
  },
});
