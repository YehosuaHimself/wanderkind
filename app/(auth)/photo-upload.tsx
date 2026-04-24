import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

export default function PhotoUploadScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateProfile } = useAuthStore();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access camera roll is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        setError('');
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access camera is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        setError('');
      }
    } catch (err) {
      setError('Failed to take photo');
    }
  };

  const handleContinue = async () => {
    if (!photo) {
      setError('Please select or take a photo');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would upload the image to storage here
      // For now, we'll just mark it as uploaded
      const { error: updateError } = await updateProfile({ avatar_url: photo });
      if (updateError) {
        setError('Failed to save photo');
        return;
      }

      router.push('/(auth)/host-setup');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/host-setup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Your Profile Photo" showBack />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          A photo helps other Wanderkinder recognize you.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {photo ? (
          <View style={styles.photoSection}>
            <Image
              source={{ uri: photo }}
              style={styles.photoPreview}
            />
            <TouchableOpacity
              style={styles.cameraOverlay}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={32} color={colors.bg} />
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>
        ) : (
          <View style={styles.placeholderSection}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={56} color={colors.ink3} />
            </View>
            <Text style={styles.placeholderHint}>No photo yet</Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={takePicture}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={20} color={colors.amber} />
            <Text style={styles.secondaryButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image" size={20} color={colors.amber} />
            <Text style={styles.secondaryButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          Your photo will be visible on your profile and in messages.
        </Text>
      </View>

      <View style={styles.actions}>
        <WKButton
          title={photo ? 'Continue' : 'Continue Without Photo'}
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
        >
          <Text style={styles.skipLink}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.redBg,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorBannerText: {
    ...typography.bodySm,
    color: colors.red,
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.amber,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    right: -10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: spacing.sm,
  },
  placeholderSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderHint: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.bodySm,
    color: colors.amber,
    fontWeight: '600',
  },
  helperText: {
    ...typography.bodySm,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  skipLink: {
    ...typography.bodySm,
    color: colors.ink3,
    textAlign: 'center',
  },
});
