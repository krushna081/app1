import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Props {
  message: string;
}

export const ErrorMessage: React.FC<Props> = ({ message }) => {
  if (!message) return null;
  return <Text style={styles.text}>{message}</Text>;
};

const styles = StyleSheet.create({
  text: {
    ...typography.bodySmall,
    color: colors.danger,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
});
