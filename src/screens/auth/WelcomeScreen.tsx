import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppButton } from '../../components/common/AppButton';
import { colors, spacing, typography } from '../../theme';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

const Feature = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.feature}>
    <View style={styles.featureDot} />
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <ScreenContainer withPadding={false} withTopInset>
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SG</Text>
          </View>
          <Text style={styles.appName}>SecureGate</Text>
          <Text style={styles.tagline}>Visitor management for your society</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>One gate. One clear record.</Text>
          <Text style={styles.description}>
            Guards log visitors with a photo. Residents approve or reject the visit. Every entry and
            exit is recorded for the society.
          </Text>

          <Feature title="Controlled entry" description="Residents decide who is allowed in." />
          <Feature
            title="Photo-backed records"
            description="Visitor photos are private and access-controlled."
          />
          <Feature
            title="Entry and exit tracking"
            description="Guards mark when a visitor enters and leaves."
          />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <AppButton title="Sign In" onPress={() => navigation.navigate('Login')} />
        <Text style={styles.helpText}>Accounts are created by your society administrator.</Text>
      </View>
    </View>
  </ScreenContainer>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logo: {
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
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  featureDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  helpText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
