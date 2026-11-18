import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flat } from '../../types/flat';
import { colors, spacing, typography } from '../../theme';

interface Props {
  flats: Flat[];
  selectedFlatId?: string;
  onSelect: (flat: Flat) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const FlatPicker: React.FC<Props> = ({
  flats,
  selectedFlatId,
  onSelect,
  label = 'Flat',
  placeholder = 'Select a flat',
  error,
  isLoading,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = flats.find((flat) => flat.id === selectedFlatId);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setIsOpen(true)}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selected ? selected.flatNumber : placeholder}`}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.triggerText, !selected ? styles.placeholder : null]}>
            {selected ? `Flat ${selected.flatNumber}` : placeholder}
          </Text>
        )}
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        transparent
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
            accessibilityLabel="Close flat picker"
          />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select a flat</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} accessibilityRole="button">
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={flats}
              keyExtractor={(item) => item.id}
              style={styles.listView}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No flats are available. Ask your administrator to add flats first.
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === selectedFlatId;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected ? styles.optionSelected : null]}
                    onPress={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={styles.optionTitle}>Flat {item.flatNumber}</Text>
                    {isSelected ? <Text style={styles.check}>Selected</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  trigger: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerText: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
  },
  listView: {
    flexShrink: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
  },
  optionTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  check: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
