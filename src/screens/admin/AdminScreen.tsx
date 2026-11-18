import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StackScreenProps } from '@react-navigation/stack';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { AdminStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = StackScreenProps<AdminStackParamList, 'AdminHome'>;

export const AdminScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const confirmSignOut = () => {
    Alert.alert('Sign Out?', 'You will need to sign in again to manage accounts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const visitorsToday = statsQuery.isLoading
    ? '—'
    : statsQuery.isError
      ? 'Unavailable'
      : String(statsQuery.data?.visitorsToday ?? 0);
  const guards = statsQuery.isLoading
    ? '—'
    : statsQuery.isError
      ? 'Unavailable'
      : String(statsQuery.data?.guards ?? 0);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isFetching}
            onRefresh={() => {
              void statsQuery.refetch();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.userInfoBar}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() || 'A'}</Text>
          </View>
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{user?.fullName || 'Administrator'}</Text>
            <Text style={styles.userRole}>Society Administrator</Text>
          </View>
          <TouchableOpacity
            onPress={confirmSignOut}
            style={styles.logoutSmall}
            activeOpacity={0.6}
            accessibilityRole="button"
          >
            <Text style={styles.logoutSmallText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Society Dashboard</Text>
          <Text style={styles.subtitle}>{"Accounts and today's activity"}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{visitorsToday}</Text>
            <Text style={styles.statLabel}>Visitors Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{guards}</Text>
            <Text style={styles.statLabel}>Guard Accounts</Text>
          </View>
        </View>

        {statsQuery.isError ? (
          <Text style={styles.errorText}>
            Live statistics could not be loaded. Pull down to retry.
          </Text>
        ) : null}

        <View style={styles.menu}>
          <Text style={styles.menuSectionTitle}>Account Management</Text>

          <AppButton
            title="Create Guard Account"
            variant="secondary"
            onPress={() => navigation.navigate('CreateAccount', { role: 'guard' })}
            style={styles.menuItem}
          />
          <AppButton
            title="Create Resident Account"
            variant="secondary"
            onPress={() => navigation.navigate('CreateAccount', { role: 'resident' })}
            style={styles.menuItem}
          />

          <Text style={[styles.menuSectionTitle, styles.menuSectionSpacing]}>
            How Accounts Work
          </Text>
          <Text style={styles.helperText}>
            Only administrators can create accounts. Each guard and resident is assigned to this
            society. Residents are also assigned to one flat.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  userInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  userRole: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  logoutSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.danger + '10',
  },
  logoutSmallText: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '600',
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  menu: {
    gap: spacing.sm,
  },
  menuSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  menuSectionSpacing: {
    marginTop: spacing.lg,
  },
  menuItem: {
    height: 56,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
