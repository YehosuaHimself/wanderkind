import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
let FileSystem: any = null;
if (Platform.OS !== 'web') {
  try { FileSystem = require('expo-file-system'); } catch {}
}
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { useWKImagePicker } from '../../../src/hooks/useWKImagePicker';
import { showAlert } from '../../../src/lib/alert';
import { toast } from '../../../src/lib/toast';
import { sanitizeText, enforceMaxLength, validatePhoto, canPerformAction, LIMITS } from '../../../src/lib/validate';
import { WKButton } from '../../../src/components/ui/WKButton';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function CreateMoment() {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);

  const { pickFromLibrary, takeWithCamera } = useWKImagePicker({ aspect: [4, 3] });

  const pickPhoto = async () => {
    const uri = await pickFromLibrary();
    if (uri) setPhotoUrl(uri);
  };

  const takePhoto = async () => {
    const uri = await takeWithCamera();
    if (uri) setPhotoUrl(uri);
  };

  const validatePhotoFile = async (uri: string): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        // On web, expo-image-picker returns data URIs or blob URLs
        // Basic validation — size check not possible without fetching the blob
        if (!uri || uri.length === 0) {
          showAlert('Invalid File', 'No file was selected.');
          return false;
        }
        // If it's a blob URL, fetch and check size
        if (uri.startsWith('blob:') || uri.startsWith('data:')) {
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileSizeInMB = blob.size / (1024 * 1024);
            if (fileSizeInMB > 10) {
              showAlert('File Too Large', `Please choose a photo smaller than 10MB. Current size: ${fileSizeInMB.toFixed(2)}MB`);
              return false;
            }
            // Check MIME type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(blob.type)) {
              showAlert('Invalid Format', 'Please choose a JPEG, PNG, or WebP image.');
              return false;
            }
          } catch {
            // Can't validate blob — allow it through
          }
        }
        return true;
      }

      // Native: use FileSystem
      if (!FileSystem) return true; // Skip if FileSystem unavailable

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        showAlert('Invalid File', 'The selected file does not exist.');
        return false;
      }

      const fileSizeInMB = (fileInfo.size || 0) / (1024 * 1024);
      if (fileSizeInMB > 10) {
        showAlert('File Too Large', `Please choose a photo smaller than 10MB. Current size: ${fileSizeInMB.toFixed(2)}MB`);
        return false;
      }

      const extension = uri.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      if (!extension || !validExtensions.includes(extension)) {
        showAlert('Invalid Format', 'Please choose a JPEG, PNG, or WebP image.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('File validation failed:', err);
      showAlert('Error', 'Unable to validate the selected file.');
      return false;
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const filename = `moment-${Date.now()}.jpg`;
      const filePath = `${user.id}/${filename}`;

      let uploadBody: any;

      if (Platform.OS === 'web') {
        // Web: convert blob/data URI to a proper File object
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          uploadBody = new File([blob], filename, { type: 'image/jpeg' });
        } catch (err) {
          console.error('Failed to fetch photo:', err);
          throw err;
        }
      } else {
        // Native: pass the RN-style object
        uploadBody = {
          uri,
          type: 'image/jpeg',
          name: filename,
        } as any;
      }

      const { data, error } = await supabase.storage
        .from('moments')
        .upload(filePath, uploadBody, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('moments')
        .getPublicUrl(filePath);

      return publicData?.publicUrl || null;
    } catch (err) {
      console.error('Photo upload failed:', err);
      return null;
    }
  };

  const deleteUploadedPhoto = async (filename: string): Promise<void> => {
    if (!user) return;
    try {
      await supabase.storage
        .from('moments')
        .remove([`${user.id}/${filename}`]);
    } catch (err) {
      console.error('Failed to clean up uploaded photo:', err);
    }
  };

  const handlePost = async () => {
    if (!user || !content.trim()) {
      showAlert('Missing content', 'Please write something for your moment.');
      return;
    }

    // Validate caption
    const sanitized = sanitizeText(content);
    if (!enforceMaxLength(sanitized, LIMITS.messageText)) {
      toast.error(`Moment text cannot exceed ${LIMITS.messageText} characters`);
      return;
    }

    // Prevent double-submit
    if (!canPerformAction('create-moment')) {
      toast.error('Please wait before posting another moment');
      return;
    }

    setLoading(true);
    let uploadedPhotoUrl = null;
    let uploadedFileName: string | null = null;

    try {
      if (photoUrl) {
        // Validate photo using validation module
        const photoValidation = validatePhoto({ uri: photoUrl });
        if (!photoValidation.valid) {
          toast.error(photoValidation.error || 'Invalid photo');
          setLoading(false);
          return;
        }

        // Validate photo file size/format
        const isValid = await validatePhotoFile(photoUrl);
        if (!isValid) {
          setLoading(false);
          return;
        }

        uploadedPhotoUrl = await uploadPhoto(photoUrl);
        if (!uploadedPhotoUrl) {
          toast.error('Failed to upload the photo.');
          setLoading(false);
          return;
        }

        // Extract filename from photoUrl for cleanup if needed
        uploadedFileName = `moment-${Date.now()}.jpg`;
      }

      const { error } = await supabase.from('moments').insert({
        author_id: user.id,
        content: sanitized,
        photo_url: uploadedPhotoUrl,
        location_name: locationName.trim() || null,
        lat: null,
        lng: null,
      } as any);

      if (error) {
        // If DB insert fails and we uploaded a photo, delete the orphaned file
        if (uploadedFileName) {
          await deleteUploadedPhoto(uploadedFileName);
        }
        throw error;
      }

      router.back();
    } catch (err) {
      console.error('Post failed:', err);
      showAlert('Error', 'Failed to post your moment. Please try again.');
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
            maxLength={2000}
          />
          <Text style={styles.charCount}>
            {content.length} / 2000
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
