import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppButton } from '../../components/common/AppButton';
import { colors, spacing, typography } from '../../theme';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenContainer withPadding={false}>
      <View style={styles.flexContainer}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>SecureGate</Text>
          <View style={styles.topBarLinks}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.topBarLink}
              activeOpacity={0.6}
            >
              <Text style={styles.topBarLinkText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.topBarLinkBtn}
              activeOpacity={0.6}
            >
              <Text style={styles.topBarLinkBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <View style={styles.heroBackground}>
              <View style={styles.heroShapeTop} />
              <View style={styles.heroShapeBottom} />
            </View>
            <View style={styles.heroContent}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>SG</Text>
              </View>
              <Text style={styles.appName}>SecureGate</Text>
              <Text style={styles.tagline}>
                Smart Visitor Management for Modern Societies
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>About the App</Text>
              <Text style={styles.description}>
                SecureGate streamlines visitor entry and exit processes in residential
                complexes, connecting guards, residents, and admins in real-time for a
                safer living environment.
              </Text>
            </View>

            <View style={styles.featuresSection}>
              <FeatureCard
                icon="!"
                title="Real-time Alerts"
                desc="Instant visitor arrival notifications"
                color={colors.primary}
              />
              <FeatureCard
                icon="+"
                title="Easy Entry Logging"
                desc="Quick photo capture & digital records"
                color={colors.success}
              />
              <FeatureCard
                icon="~"
                title="Visitor Dashboard"
                desc="Manage & pre-approve guests"
                color={colors.warning}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <AppButton
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
          <AppButton
            title="Create Account"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
            style={styles.button}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const FeatureCard = ({ icon, title, desc, color }: {
  icon: string; title: string; desc: string; color: string;
}) => (
  <View style={styles.featureCard}>
    <View style={[styles.featureIcon, { backgroundColor: color + '15' }]}>
      <Text style={[styles.featureIconText, { color }]}>{icon}</Text>
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  topBarLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topBarLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topBarLinkText: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  topBarLinkBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  topBarLinkBtnText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  heroShapeTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroShapeBottom: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent: {
    paddingVertical: 60,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.bodyLarge,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 26,
  },
  content: {
    padding: spacing.lg,
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresSection: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  featureDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  button: {
    width: '100%',
  },
});
