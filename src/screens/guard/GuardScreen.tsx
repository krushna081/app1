import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { visitorService } from '../../services/visitorService';
import { uploadService } from '../../services/uploadService';
import { realtimeService } from '../../services/realtimeService';
import { VisitorStatus } from '../../types/visitor';
import * as ImagePicker from 'expo-image-picker';

const visitorSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  type: z.enum(['guest', 'maid', 'delivery', 'electrician', 'plumber']),
  flatId: z.string().min(1, 'Please select a flat'),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

export const GuardScreen: React.FC = () => {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flats, setFlats] = useState<any[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<VisitorStatus | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: { name: '', type: 'guest', flatId: '' },
  });

  useEffect(() => {
    if (user?.societyId) {
      visitorService.getSocietyFlats(user.societyId).then(setFlats);
    }
  }, [user]);

  const handleCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to capture visitor photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: VisitorFormData) => {
    if (!photo) {
      Alert.alert('Photo Required', 'Please capture a visitor photo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileName = `${Date.now()}_${data.name.replace(/\s/g, '_')}`;
      const photoUrl = await uploadService.uploadVisitorPhoto(photo, fileName);

      const visitor = await visitorService.createVisitor({
        visitorName: data.name,
        visitorType: data.type,
        photoUrl,
        flatId: data.flatId,
        societyId: user!.societyId!,
        createdByGuardId: user!.id,
      });

      setSubmissionStatus('pending');

      // Subscribe to updates for this visitor
      const channel = realtimeService.subscribeToVisitorUpdates(visitor.id, (status) => {
        setSubmissionStatus(status);
        if (status === 'approved' || status === 'rejected') {
          Alert.alert('Status Updated', `Visitor has been ${status}`);
        }
      });

      reset();
      setPhoto(null);

    } catch (error: any) {
      Alert.alert('Error', 'Could not submit visitor. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Visitor Details</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Visitor Name"
                placeholder="Enter name"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          <View style={styles.photoSection}>
            <Text style={styles.label}>Visitor Photo</Text>
            {photo ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: photo }} style={styles.preview} />
                <AppButton
                  title="Retake"
                  variant="secondary"
                  onPress={handleCapture}
                  style={styles.retakeBtn}
                />
              </View>
            ) : (
              <AppButton
                title="Capture Photo"
                onPress={handleCapture}
                style={styles.captureBtn}
              />
            )}
          </View>

          <Controller
            control={control}
            name="flatId"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Flat Number"
                placeholder="Select Flat ID"
                value={value}
                onChangeText={onChange}
                error={errors.flatId?.message}
              />
            )}
          />

          <AppButton
            title="Log Entry"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.submitBtn}
          />

          {submissionStatus && (
            <View style={[styles.statusBanner, styles[`status_${submissionStatus}` as any]]}>
              <Text style={styles.statusText}>
                Current Status: {submissionStatus.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  form: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  photoSection: {
    marginBottom: spacing.md,
  },
  previewContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  retakeBtn: {
    width: '100%',
  },
  captureBtn: {
    height: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
  statusBanner: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.white,
  },
  status_pending: { backgroundColor: colors.warning },
  status_approved: { backgroundColor: colors.success },
  status_rejected: { backgroundColor: colors.danger },
});
