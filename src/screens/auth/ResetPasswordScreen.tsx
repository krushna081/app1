import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { colors, spacing, typography } from '../../theme';

export const ResetPasswordScreen: React.FC = () => {
  const { completePasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Use at least 8 characters.');
      return;
    }

    if (password.length > 72) {
      Alert.alert('Password Too Long', 'Use 72 characters or fewer.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Enter the same password in both fields.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updatePassword(password);
      await completePasswordRecovery();
      Alert.alert('Password Updated', 'Use your new password the next time you sign in.');
    } catch (error) {
      Alert.alert(
        'Could Not Update Password',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Password Reset?', 'You will be signed out of this session.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <ScreenContainer withKeyboard withPadding={false} withTopInset>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set a New Password</Text>
          <Text style={styles.subtitle}>
            You verified your email. Choose a password you do not use for another account.
          </Text>
        </View>

        <AppInput
          label="New Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          isPassword
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <AppInput
          label="Confirm New Password"
          placeholder="Re-enter the password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <AppButton
          title="Update Password"
          onPress={handleUpdatePassword}
          loading={isLoading}
          style={styles.button}
        />
        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={handleCancel}
          disabled={isLoading}
          style={styles.cancelButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
