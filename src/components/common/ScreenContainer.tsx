import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  withPadding?: boolean;
  withKeyboard?: boolean;
  withTopInset?: boolean;
}

export const ScreenContainer: React.FC<Props> = ({
  children,
  style,
  withPadding = true,
  withKeyboard = false,
  withTopInset = false,
}) => {
  const content = (
    <View style={[styles.container, withPadding && styles.padding, style]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={withTopInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}
    >
      <StatusBar barStyle="dark-content" />
      {withKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    padding: spacing.md,
  },
});
