import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { StackScreenProps } from '@react-navigation/stack';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { FlatPicker } from '../../components/forms/FlatPicker';
import { useFlats } from '../../hooks/useFlats';
import { adminService } from '../../services/adminService';
import { AdminStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

const createAccountSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(120, 'Name is too long'),
    email: z.string().trim().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or fewer'),
    confirmPassword: z.string().min(1, 'Confirm the password'),
    role: z.enum(['guard', 'resident']),
    flatId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.role !== 'resident' || !!data.flatId, {
    message: 'Select a flat for the resident',
    path: ['flatId'],
  });

type CreateAccountFormData = z.infer<typeof createAccountSchema>;
type Props = StackScreenProps<AdminStackParamList, 'CreateAccount'>;

export const CreateAccountScreen: React.FC<Props> = ({ route, navigation }) => {
  const preselectedRole = route.params?.role ?? 'guard';
  const [isLoading, setIsLoading] = useState(false);
  const {
    flats,
    isLoading: flatsLoading,
    isFetching: flatsFetching,
    error: flatsError,
    refetch: refetchFlats,
  } = useFlats();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: preselectedRole,
      flatId: '',
    },
  });

  const role = useWatch({ control, name: 'role' }) ?? 'guard';

  const onSubmit = async (data: CreateAccountFormData) => {
    setIsLoading(true);
    try {
      await adminService.createAccount({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        flatId: data.role === 'resident' ? (data.flatId ?? null) : null,
      });

      reset();
      Alert.alert(
        'Account Created',
        `The ${data.role} account can now sign in. Share the temporary password privately. Ask the user to sign out and use Forgot Password to set their own password.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert(
        'Could Not Create Account',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer withKeyboard withPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={flatsFetching}
            onRefresh={() => {
              void refetchFlats();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.headerSection}>
          <View style={styles.headerAccent} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Add a guard or resident to your society</Text>
        </View>

        <View style={styles.formCard}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Full Name"
                placeholder="Enter full name"
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Email Address"
                placeholder="user@society.com"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Temporary Password"
                placeholder="At least 8 characters"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                isPassword
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Confirm Temporary Password"
                placeholder="Re-enter the password"
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                isPassword
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />

          <Text style={styles.roleLabel}>Account Type</Text>
          <View style={styles.roleContainer}>
            {(['guard', 'resident'] as const).map((roleOption) => (
              <AppButton
                key={roleOption}
                title={roleOption === 'guard' ? 'Guard' : 'Resident'}
                variant={role === roleOption ? 'primary' : 'secondary'}
                onPress={() => {
                  setValue('role', roleOption, { shouldValidate: true });
                  if (roleOption === 'guard') {
                    setValue('flatId', '');
                  }
                }}
                style={styles.roleButton}
                disabled={isLoading}
              />
            ))}
          </View>

          {role === 'resident' ? (
            <Controller
              control={control}
              name="flatId"
              render={({ field: { onChange, value } }) => (
                <FlatPicker
                  label="Resident Flat"
                  flats={flats}
                  selectedFlatId={value}
                  onSelect={(flat) => onChange(flat.id)}
                  isLoading={flatsLoading}
                  error={errors.flatId?.message}
                  disabled={isLoading}
                />
              )}
            />
          ) : null}

          {role === 'resident' && flatsError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Could not load flats. The resident account cannot be created until flats are
                available.
              </Text>
              <AppButton
                title="Retry Loading Flats"
                variant="secondary"
                onPress={() => {
                  void refetchFlats();
                }}
                style={styles.retryButton}
              />
            </View>
          ) : null}

          <Text style={styles.note}>
            The new user can sign in immediately with this temporary password. Ask them to sign out
            and use Forgot Password to set their own password.
          </Text>

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
    textAlign: 'center',
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
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  errorBox: {
    marginBottom: spacing.md,
  },
  retryButton: {
    height: 44,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
