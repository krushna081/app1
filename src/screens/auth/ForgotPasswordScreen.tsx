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

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendOtp(email);
      Alert.alert(
        'Verification Code Sent',
        'Please check your email for the 6-digit verification code.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('VerifyOtp', { email: email.trim(), mode: 'password_reset' }),
          },
        ]
      );
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert(
        'Failed to Send Code',
        'Could not send verification code. Please make sure:\n\n1. "Enable email confirmations" is ON in Supabase Auth settings\n2. A custom SMTP provider is configured in your Supabase dashboard\n3. The email address is correct'
      );
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
        title="Send Verification Code"
        onPress={handleSendOtp}
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
