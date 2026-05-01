import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { useWKImagePicker } from '../../../../src/hooks/useWKImagePicker';

export default function PhotosScreen() {
  const { user, isLoading } = useAuthGuard();
  React.useEffect(() => {
    if (!user) return;
    supabase.from('hosts').select('photos').eq('host_id', user.id).single().then(({ data }: { data: any }) => {
      if (data?.photos && Array.isArray(data.photos)) {
        setPhotos(data.photos.map((uri: string, i: number) => ({ id: String(i), uri })));
      }
    });
  }, [user]);
  const [photos, setPhotos] = useState<Array<{id:string;uri:string}>>([]);
  const [loading, setLoading] = useState(false);
  const { pickFromLibrary } = useWKImagePicker({ aspect: [1, 1] });
  if (isLoading) return null;



  const pickImage = async () => {
    const uri = await pickFromLibrary();
    if (uri) {
      setPhotos([...photos, { id: Date.now().toString(), uri }]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Manage Photos" showBack={true} />

      <View style={styles.content}>
        {/* Add Photo Button */}
        <WKCard>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
            <Ionicons name="add-circle" size={48} color={colors.amber} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
            <Text style={styles.addPhotoHint}>Upload your best images</Text>
          </TouchableOpacity>
        </WKCard>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <View style={styles.gridSection}>
            <Text style={styles.gridTitle}>{photos.length} Photos</Text>
            <View style={styles.grid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoWrapper}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                  />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle-sharp" size={24} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <WKCard variant="parchment" style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="image-outline" size={48} color={colors.ink3} />
              <Text style={styles.emptyTitle}>No Photos Yet</Text>
              <Text style={styles.emptyText}>
                Add photos to showcase your accommodation
              </Text>
            </View>
          </WKCard>
        )}
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
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  addPhotoBtn: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  addPhotoText: {
    ...typography.h3,
    color: colors.amber,
  },
  addPhotoHint: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  gridSection: {
    gap: spacing.md,
  },
  gridTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoWrapper: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    ...shadows.sm,
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.borderLt,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.ink2,
    textAlign: 'center',
  },
});
