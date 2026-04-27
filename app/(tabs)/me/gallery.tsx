import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useWKImagePicker } from '../../../src/hooks/useWKImagePicker';

interface GalleryPhoto {
  id: string;
  url: string;
  order: number;
}

export default function GalleryScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.gallery_urls) {
      setPhotos(
        (profile.gallery_urls as string[]).map((url, idx) => ({
          id: `${idx}`,
          url,
          order: idx,
        }))
      );
    }
  }, [profile]);

  const { pickFromLibrary } = useWKImagePicker({ aspect: [1, 1] });

  const pickAndAddImage = async () => {
    if (photos.length >= 7) {
      setError('Maximum 7 photos allowed');
      return;
    }

    try {
      const uri = await pickFromLibrary();
      if (uri && user) {
        setLoading(true);
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `gallery_${user.id}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filename, blob);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filename);

        const newPhotos = [...photos, { id: filename, url: publicData.publicUrl, order: photos.length }];
        setPhotos(newPhotos);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ gallery_urls: newPhotos.map(p => p.url) })
          .eq('id', user.id);

        if (updateError) throw updateError;
        setError('');
      }
    } catch (err) {
      setError('Failed to add photo');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (idx: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const newPhotos = photos.filter((_, i) => i !== idx);
      setPhotos(newPhotos);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ gallery_urls: newPhotos.map(p => p.url) })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setError('');
    } catch (err) {
      setError('Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Photo Gallery" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          Share your journey with 7 photos
        </Text>
        <Text style={styles.count}>
          {photos.length}/7
        </Text>

        <View style={styles.grid}>
          {photos.map((photo, idx) => (
            <View key={idx} style={styles.photoContainer}>
              <Image source={{ uri: photo.url }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(idx)}
                disabled={loading}
              >
                <Ionicons name="close" size={20} color={colors.surface} />
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 7 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickAndAddImage}
              disabled={loading}
            >
              <Ionicons name="add" size={32} color={colors.amber} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.infoText}>
            Gallery photos appear on your public profile and help other wanderers get to know you.
          </Text>
        </View>
      </ScrollView>
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
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  count: {
    ...typography.bodySm,
    color: colors.ink3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radii.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
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
});
