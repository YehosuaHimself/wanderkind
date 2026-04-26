import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useWKImagePicker } from '../../../src/hooks/useWKImagePicker';

export default function EditCoverScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { pickFromLibrary } = useWKImagePicker({ aspect: [16, 9] });

  const pickImage = async () => {
    const uri = await pickFromLibrary();
    if (uri) { setSelectedImage(uri); setError(''); }
  };

  const handleUpload = async () => {
    if (!selectedImage || !user) return;

    setUploading(true);
    setError('');

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const filename = `cover_${user.id}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filename, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filename);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Change Cover Photo" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {selectedImage || profile?.cover_url ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage || profile?.cover_url || undefined }}
              style={styles.preview}
            />
            <TouchableOpacity
              style={styles.changeButton}
              onPress={pickImage}
              disabled={uploading}
            >
              <Ionicons name="camera" size={20} color={colors.surface} />
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyContainer}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={48} color={colors.ink3} />
            <Text style={styles.emptyText}>Add Cover Photo</Text>
            <Text style={styles.emptySubtext}>16:9 aspect ratio recommended</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.infoText}>
            Your cover photo appears at the top of your profile. Choose an image that represents your journey.
          </Text>
        </View>
      </ScrollView>

      {selectedImage && (
        <View style={styles.actions}>
          <WKButton
            title="Upload"
            onPress={handleUpload}
            variant="primary"
            size="lg"
            fullWidth
            loading={uploading}
            disabled={uploading}
          />
        </View>
      )}
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
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.redBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.red,
    flex: 1,
  },
  previewContainer: {
    marginBottom: spacing.xl,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
  },
  changeButton: {
    flexDirection: 'row',
    backgroundColor: colors.amber,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  changeButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing['4xl'],
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceAlt,
  },
  emptyText: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
