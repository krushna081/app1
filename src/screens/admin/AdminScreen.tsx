import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppButton } from '../../components/common/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { typography, spacing, colors } from '../../theme';
import { StackScreenProps } from '@react-navigation/stack';
import { AdminStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AdminStackParamList, 'AdminHome'>;

export const AdminScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.userInfoBar}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </Text>
          </View>
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{user?.fullName || 'Admin'}</Text>
            <Text style={styles.userRole}>Administrator</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutSmall} activeOpacity={0.6}>
            <Text style={styles.logoutSmallText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Society Management Dashboard</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>124</Text>
            <Text style={styles.statLabel}>Total Visitors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Active Guards</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <Text style={styles.menuSectionTitle}>User Management</Text>

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

          <Text style={[styles.menuSectionTitle, { marginTop: spacing.lg }]}>Overview</Text>

          <AppButton
            title="Society Reports"
            variant="secondary"
            onPress={() => {}}
            style={styles.menuItem}
          />
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
  menuItem: {
    height: 56,
  },
});
