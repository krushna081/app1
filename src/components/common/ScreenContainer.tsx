import React from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  withPadding?: boolean;
  withKeyboard?: boolean;
}

export const ScreenContainer: React.FC<Props> = ({
  children,
  style,
  withPadding = true,
  withKeyboard = false
}) => {
  const content = (
    <View style={[
      styles.container,
      withPadding && styles.padding,
      style
    ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {withKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : content}
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
