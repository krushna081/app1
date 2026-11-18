import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const AppButton: React.FC<Props> = React.memo(
  ({ title, onPress, variant = 'primary', loading, disabled, style }) => {
    const isDisabled = disabled || loading;

    const getBackgroundColor = () => {
      if (isDisabled) return colors.border;
      switch (variant) {
        case 'secondary':
          return colors.secondary;
        case 'danger':
          return colors.danger;
        case 'success':
          return colors.success;
        default:
          return colors.primary;
      }
    };

    const textStyle: TextStyle = isDisabled ? styles.disabledText : styles.text;

    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: getBackgroundColor() }, style]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={textStyle}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  },
);

AppButton.displayName = 'AppButton';

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
  },
  disabledText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
