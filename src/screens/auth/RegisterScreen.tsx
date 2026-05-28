import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/authService';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['resident', 'guard', 'admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;
type Props = StackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'resident' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await authService.signUp(data);
      if (result?.user?.identities?.length === 0) {
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Please sign in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert(
          'Verify Your Email',
          'We sent you a confirmation link. Click it to log in automatically — no extra sign-in needed!',
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer withKeyboard withPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerSection}>
          <View style={styles.headerAccent} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SecureGate to get started</Text>
        </View>

        <View style={styles.formCard}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Full Name"
                placeholder="John Doe"
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Email Address"
                placeholder="john@example.com"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                isPassword
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Confirm Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                isPassword
              />
            )}
          />

          <Text style={styles.roleLabel}>I am a</Text>
          <View style={styles.roleContainer}>
            {(['resident', 'guard'] as const).map((role) => (
              <Controller
                key={role}
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <AppButton
                    title={role === 'resident' ? 'Resident' : 'Security Guard'}
                    variant={value === role ? 'primary' : 'secondary'}
                    onPress={() => onChange(role)}
                    style={styles.roleButton}
                  />
                )}
              />
            ))}
          </View>

          <AppButton
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Login')}
          >
            Sign In
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  headerAccent: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  roleLabel: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleButton: {
    flex: 1,
    height: 40,
  },
  submitButton: {
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
