import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../src/components/ui/WKHeader';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../src/lib/theme';
import { useAuthStore } from '../../src/stores/auth';

export default function HomePhotoScreen() {
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
      setError('Please select or take a photo of your home');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await updateProfile({
        host_cover_url: photo,
      });

      if (updateError) {
        setError('Failed to save photo');
        return;
      }

      router.push('/(auth)/permissions');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/permissions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <WKHeader title="Your Home" showBack />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Show walkers what your home looks like.
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
              style={styles.cameraButton}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color={colors.bg} />
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>
        ) : (
          <View style={styles.placeholderSection}>
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image" size={64} color={colors.ink3} />
            </View>
            <Text style={styles.placeholderHint}>Add a photo of your home</Text>
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
          A good photo helps pilgrims feel welcome and safe.
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
    marginBottom: spacing.2xl,
    gap: spacing.md,
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  cameraButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    ...typography.bodySm,
    color: colors.ink3,
  },
  placeholderSection: {
    alignItems: 'center',
    marginBottom: spacing.2xl,
    gap: spacing.md,
  },
  photoPlaceholder: {
    width: '100%',
    height: 300,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
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
