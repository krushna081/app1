import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';

export const AuthErrorScreen: React.FC = () => {
  const { error, isLoading, refreshProfile, signOut } = useAuth();

  return (
    <ScreenContainer style={styles.container} withTopInset>
      <View style={styles.card}>
        <Text style={styles.title}>Account Setup Needed</Text>
        <Text style={styles.message}>
          {error ?? 'Your profile could not be loaded. Contact your society administrator.'}
        </Text>
        <AppButton
          title="Try Again"
          onPress={refreshProfile}
          loading={isLoading}
          style={styles.button}
        />
        <AppButton
          title="Sign Out"
          variant="secondary"
          onPress={() => {
            void signOut();
          }}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
});
