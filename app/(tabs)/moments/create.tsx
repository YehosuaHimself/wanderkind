import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { WKButton } from '../../../src/components/ui/WKButton';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';

export default function CreateMoment() {
  const router = useRouter();
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const filename = `moment-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('moments')
        .upload(`${user.id}/${filename}`, {
          uri,
          type: 'image/jpeg',
          name: filename,
        } as any);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('moments')
        .getPublicUrl(`${user.id}/${filename}`);

      return publicData?.publicUrl || null;
    } catch (err) {
      console.error('Photo upload failed:', err);
      return null;
    }
  };

  const handlePost = async () => {
    if (!user || !content.trim()) {
      Alert.alert('Missing content', 'Please write something for your moment.');
      return;
    }

    setLoading(true);
    try {
      let uploadedPhotoUrl = null;
      if (photoUrl) {
        uploadedPhotoUrl = await uploadPhoto(photoUrl);
      }

      const { error } = await supabase.from('moments').insert({
        author_id: user.id,
        content: content.trim(),
        photo_url: uploadedPhotoUrl,
        location_name: locationName.trim() || null,
        likes_count: 0,
        replies_count: 0,
      });

      if (error) throw error;

      router.back();
    } catch (err) {
      console.error('Post failed:', err);
      Alert.alert('Error', 'Failed to post your moment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Moment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        {photoUrl ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUrl }} style={styles.selectedPhoto} />
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={() => setPhotoUrl(null)}
            >
              <Ionicons name="close" size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={40} color={colors.amber} />
            <Text style={styles.photoText}>Capture or choose a photo</Text>
            <View style={styles.photoButtonRow}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={takePhoto}
              >
                <Ionicons name="camera-outline" size={18} color={colors.amber} />
                <Text style={styles.photoButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickPhoto}
              >
                <Ionicons name="image-outline" size={18} color={colors.amber} />
                <Text style={styles.photoButtonText}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Text Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.contentInput}
            placeholder="Share your moment from the road..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={4}
            value={content}
            onChangeText={setContent}
            maxLength={280}
          />
          <Text style={styles.charCount}>
            {content.length} / 280
          </Text>
        </View>

        {/* Location */}
        <View style={styles.inputSection}>
          <View style={styles.locationInputLabel}>
            <Ionicons name="location" size={16} color={colors.amber} />
            <Text style={styles.label}>Location (optional)</Text>
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder="Where was this moment?"
            placeholderTextColor={colors.ink3}
            value={locationName}
            onChangeText={setLocationName}
            maxLength={80}
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postBtn, !content.trim() && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Ionicons name="paper-plane" size={16} color={colors.surface} />
              <Text style={styles.postBtnText}>Post</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  photoContainer: {
    marginTop: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedPhoto: {
    width: '100%',
    height: 240,
    backgroundColor: colors.surfaceAlt,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    marginTop: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.amberLine,
    borderRadius: 12,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { ...typography.bodySm, color: colors.ink2, marginTop: 8, marginBottom: 12 },
  photoButtonRow: { flexDirection: 'row', gap: spacing.lg, marginTop: 8 },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.amberBg,
    borderRadius: 8,
  },
  photoButtonText: { ...typography.bodySm, color: colors.amber, fontWeight: '500' },
  inputSection: { marginTop: spacing.lg },
  contentInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    minHeight: 100,
  },
  charCount: { ...typography.caption, color: colors.ink3, marginTop: 6, textAlign: 'right' },
  locationInputLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { ...typography.bodySm, color: colors.ink, fontWeight: '600' },
  locationInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  postBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontSize: 15, fontWeight: '600', color: colors.surface },
});
