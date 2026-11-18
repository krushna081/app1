import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { EmptyState } from '../../components/common/EmptyState';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { FlatPicker } from '../../components/forms/FlatPicker';
import { VisitorCard } from '../../components/visitor/VisitorCard';
import { useAuth } from '../../hooks/useAuth';
import { useFlats } from '../../hooks/useFlats';
import { useGuardVisitors } from '../../hooks/useGuardVisitors';
import { realtimeService } from '../../services/realtimeService';
import { uploadService } from '../../services/uploadService';
import { visitorService } from '../../services/visitorService';
import { colors, spacing, typography } from '../../theme';
import { VisitorStatus, VisitorType } from '../../types/visitor';

const VISITOR_TYPES: { value: VisitorType; label: string }[] = [
  { value: 'guest', label: 'Guest' },
  { value: 'maid', label: 'Maid' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
];

const visitorSchema = z.object({
  name: z.string().trim().min(2, 'Visitor name is required').max(120, 'Name is too long'),
  type: z.enum(['guest', 'maid', 'delivery', 'electrician', 'plumber']),
  flatId: z.string().min(1, 'Select the flat being visited'),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

type SelectedPhoto = {
  uri: string;
  mimeType?: string | null;
};

export const GuardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    flats,
    isLoading: flatsLoading,
    isFetching: flatsFetching,
    error: flatsError,
    refetch: refetchFlats,
  } = useFlats();
  const {
    visitors: activeVisitors,
    isLoading: activeLoading,
    isFetching: activeFetching,
    error: activeError,
    refetch: refetchActive,
    updateStatus,
    isUpdating,
  } = useGuardVisitors();

  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<{
    visitorId: string;
    name: string;
    status: VisitorStatus;
  } | null>(null);
  const statusChannel = useRef<RealtimeChannel | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: { name: '', type: 'guest', flatId: '' },
  });

  const selectedType = useWatch({ control, name: 'type' }) ?? 'guest';

  useEffect(
    () => () => {
      realtimeService.unsubscribe(statusChannel.current);
    },
    [],
  );

  useEffect(() => {
    if (!user?.societyId) return;
    const channel = realtimeService.subscribeToSocietyVisitors(user.societyId, () => {
      void refetchActive();
    });
    return () => realtimeService.unsubscribe(channel);
  }, [user?.societyId, refetchActive]);

  const handleCapture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Enable camera access in system settings to photograph visitors.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        exif: false,
      });

      const asset = result.assets?.[0];
      if (!result.canceled && asset) {
        setPhoto({ uri: asset.uri, mimeType: asset.mimeType });
      }
    } catch (error) {
      console.error('Could not open the camera', error);
      Alert.alert('Camera Unavailable', 'The camera could not be opened. Try again.');
    }
  };

  const onSubmit = async (data: VisitorFormData) => {
    if (!photo) {
      Alert.alert('Photo Required', 'Capture a visitor photo before logging the entry.');
      return;
    }
    if (!user?.societyId) {
      Alert.alert(
        'Account Not Assigned',
        'Your guard account is not assigned to a society. Contact your administrator.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const photoPath = await uploadService.uploadVisitorPhoto(
        photo.uri,
        user.societyId,
        photo.mimeType,
      );
      const visitor = await visitorService.createVisitor({
        visitorName: data.name,
        visitorType: data.type,
        photoPath,
        flatId: data.flatId,
      });

      setSubmission({
        visitorId: visitor.id,
        name: visitor.visitorName,
        status: visitor.status,
      });

      realtimeService.unsubscribe(statusChannel.current);
      statusChannel.current = realtimeService.subscribeToVisitorUpdates(visitor.id, (status) => {
        setSubmission((previous) => (previous ? { ...previous, status } : previous));
        if (status === 'approved' || status === 'rejected') {
          Alert.alert('Visitor Updated', `${visitor.visitorName} was ${status}.`);
          void refetchActive();
        }
      });

      reset({ name: '', type: 'guest', flatId: '' });
      setPhoto(null);
      void refetchActive();
    } catch (error) {
      console.error('Could not log visitor', error);
      Alert.alert(
        'Could Not Log Visitor',
        'The visitor was not saved. Check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (visitorId: string, status: VisitorStatus) => {
    try {
      await updateStatus({ visitorId, status });
    } catch (error) {
      console.error('Could not update visitor status', error);
      Alert.alert(
        'Could Not Update Visitor',
        'The status was not saved. Check your connection and try again.',
      );
    }
  };

  if (!user?.societyId) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Account Not Assigned</Text>
          <Text style={styles.emptyMessage}>
            This guard account is not linked to a society. Ask your administrator to assign it
            before using the gate terminal.
          </Text>
          <AppButton
            title="Sign Out"
            variant="secondary"
            onPress={() => {
              void signOut();
            }}
            style={styles.signOutButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer withKeyboard>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={activeFetching || flatsFetching}
            onRefresh={() => {
              void refetchFlats();
              void refetchActive();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.title}>Log a Visitor</Text>
        <Text style={styles.subtitle}>Capture the visitor photo and select the flat.</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Visitor Name"
              placeholder="Enter full name"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              autoCapitalize="words"
            />
          )}
        />

        <View style={styles.photoSection}>
          <Text style={styles.label}>Visitor Photo</Text>
          {photo ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photo.uri }} style={styles.preview} />
              <AppButton
                title="Retake Photo"
                variant="secondary"
                onPress={handleCapture}
                disabled={isSubmitting}
              />
            </View>
          ) : (
            <AppButton
              title="Capture Photo"
              variant="secondary"
              onPress={handleCapture}
              disabled={isSubmitting}
              style={styles.captureButton}
            />
          )}
        </View>

        <Text style={styles.label}>Visitor Type</Text>
        <View style={styles.typeRow}>
          {VISITOR_TYPES.map((type) => {
            const selected = selectedType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                onPress={() => setValue('type', type.value, { shouldValidate: true })}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.typeText, selected ? styles.typeTextSelected : null]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Controller
          control={control}
          name="flatId"
          render={({ field: { onChange, value } }) => (
            <FlatPicker
              label="Visiting Flat"
              flats={flats}
              selectedFlatId={value}
              onSelect={(flat) => onChange(flat.id)}
              isLoading={flatsLoading}
              error={errors.flatId?.message}
              disabled={isSubmitting}
            />
          )}
        />

        {flatsError ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>
              Could not load flats. Pull down to retry or ask your administrator.
            </Text>
          </View>
        ) : null}

        <AppButton
          title="Log Entry"
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
          style={styles.submitButton}
        />

        {submission ? (
          <View style={[styles.statusBanner, statusStyle(submission.status)]}>
            <Text style={styles.statusName}>{submission.name}</Text>
            <Text style={styles.statusText}>
              {submission.status === 'pending'
                ? 'Waiting for resident approval'
                : `Status: ${submission.status}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.activeHeader}>
          <Text style={styles.sectionTitle}>Active Visitors</Text>
          <TouchableOpacity
            onPress={() => {
              void refetchActive();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>
          Approved visitors can be marked as entered, then exited.
        </Text>

        {activeVisitors.length === 0 && !activeLoading ? (
          <EmptyState
            title="No Active Visitors"
            message="Approved visitors waiting to enter will appear here."
          />
        ) : null}

        {activeError ? (
          <Text style={styles.inlineErrorText}>
            Could not load active visitors. Pull down to retry.
          </Text>
        ) : null}

        {activeVisitors.map((visitor) => (
          <VisitorCard
            key={visitor.id}
            visitor={visitor}
            isLoadingDecision={isUpdating}
            onMarkEntered={
              visitor.status === 'approved'
                ? () => {
                    void handleStatusChange(visitor.id, 'entered');
                  }
                : undefined
            }
            onMarkExited={
              visitor.status === 'entered'
                ? () => {
                    void handleStatusChange(visitor.id, 'exited');
                  }
                : undefined
            }
          />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};

function statusStyle(status: VisitorStatus) {
  switch (status) {
    case 'approved':
      return styles.statusApproved;
    case 'rejected':
      return styles.statusRejected;
    case 'entered':
      return styles.statusEntered;
    case 'exited':
      return styles.statusExited;
    default:
      return styles.statusPending;
  }
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  photoSection: {
    marginBottom: spacing.md,
  },
  previewContainer: {
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  captureButton: {
    height: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeTextSelected: {
    color: colors.white,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  statusBanner: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  statusPending: { backgroundColor: colors.warning },
  statusApproved: { backgroundColor: colors.success },
  statusRejected: { backgroundColor: colors.danger },
  statusEntered: { backgroundColor: colors.primary },
  statusExited: { backgroundColor: colors.secondary },
  statusName: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '700',
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.white,
    marginTop: 2,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  refreshText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  inlineError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inlineErrorText: {
    ...typography.bodySmall,
    color: colors.danger,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  signOutButton: {
    width: '100%',
  },
});
