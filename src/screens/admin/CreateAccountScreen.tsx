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
import { AdminStackParamList } from '../../navigation/types';

const createAccountSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['resident', 'guard']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type CreateAccountFormData = z.infer<typeof createAccountSchema>;
type Props = StackScreenProps<AdminStackParamList, 'CreateAccount'>;

export const CreateAccountScreen: React.FC<Props> = ({ route, navigation }) => {
  const preselectedRole = route.params?.role || 'guard';
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: preselectedRole },
  });

  const onSubmit = async (data: CreateAccountFormData) => {
    setIsLoading(true);
    try {
      await authService.signUp(data);
      Alert.alert(
        'Account Created',
        `A new ${data.role} account has been created successfully. The user can now sign in.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Could not create account');
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
          <Text style={styles.subtitle}>Add a new user to the society</Text>
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

          <Text style={styles.roleLabel}>Account Type</Text>
          <View style={styles.roleContainer}>
            {(['guard', 'resident'] as const).map((role) => (
              <Controller
                key={role}
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <AppButton
                    title={role === 'guard' ? 'Security Guard' : 'Resident'}
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
});
