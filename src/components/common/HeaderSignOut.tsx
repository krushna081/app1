import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';

export const HeaderSignOut: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        Alert.alert('Sign Out?', 'You will need to sign in again.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              void signOut();
            },
          },
        ]);
      }}
      accessibilityRole="button"
    >
      <Text style={styles.text}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});
