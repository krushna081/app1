import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/authService';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      Alert.alert('Check Your Email', 'We sent you a password reset link.');
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Could not send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer withKeyboard withPadding={false} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your registered email address and we'll send you a verification code to reset your password.
        </Text>
      </View>

      <AppInput
        label="Email Address"
        placeholder="example@society.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AppButton
        title="Send Reset Link"
        onPress={handleReset}
        loading={isLoading}
        style={styles.button}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Remember your password? </Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          Sign In
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  link: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});
