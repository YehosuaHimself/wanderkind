import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
let FileSystem: any = null;
if (Platform.OS !== 'web') {
  try { FileSystem = require('expo-file-system'); } catch {}
}

import { colors, typography, spacing } from '../../../src/lib/theme';
import { useWKImagePicker } from '../../../src/hooks/useWKImagePicker';
import { showAlert } from '../../../src/lib/alert';
import { toast } from '../../../src/lib/toast';
import { sanitizeText, enforceMaxLength, validatePhoto, canPerformAction, LIMITS } from '../../../src/lib/validate';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

export default function CreateStory() {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);

  const { pickFromLibrary, takeWithCamera } = useWKImagePicker({ aspect: [1, 1] });

  const takeCameraPhoto = async () => {
    const uri = await takeWithCamera();
    if (uri) setPhotoUrl(uri);
  };

  const pickPhotoFromLibrary = async () => {
    const uri = await pickFromLibrary();
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
      const filename = `story-${Date.now()}.jpg`;
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
        .from('stories')
        .upload(filePath, uploadBody, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('stories')
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
        .from('stories')
        .remove([`${user.id}/${filename}`]);
    } catch (err) {
      console.error('Failed to clean up uploaded photo:', err);
    }
  };

  const calculateExpiresAt = (): string => {
    const now = new Date();
    // Add 11 hours and 11 minutes
    now.setHours(now.getHours() + 11);
    now.setMinutes(now.getMinutes() + 11);
    return now.toISOString();
  };

  const handleShareStory = async () => {
    if (!user || !photoUrl) {
      showAlert('Missing photo', 'Please select a photo for your story.');
      return;
    }

    // Validate caption if provided
    if (caption.trim()) {
      const sanitized = sanitizeText(caption);
      if (!enforceMaxLength(sanitized, LIMITS.messageText)) {
        toast.error(`Story caption cannot exceed ${LIMITS.messageText} characters`);
        return;
      }
    }

    // Prevent double-submit
    if (!canPerformAction('create-story')) {
      toast.error('Please wait before posting another story');
      return;
    }

    setLoading(true);
    let uploadedPhotoUrl = null;
    let uploadedFileName: string | null = null;

    try {
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
      uploadedFileName = `story-${Date.now()}.jpg`;

      const createdAt = new Date().toISOString();
      const expiresAt = calculateExpiresAt();

      const { error } = await supabase.from('stories').insert({
        author_id: user.id,
        photo_url: uploadedPhotoUrl,
        caption: caption.trim() || null,
        location_name: locationName.trim() || null,
        created_at: createdAt,
        expires_at: expiresAt,
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
      console.error('Story share failed:', err);
      showAlert('Error', 'Failed to share your story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="New Story" showBack />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Section - Large Preview */}
        {photoUrl ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUrl }} style={styles.selectedPhoto} />
            <View style={styles.buttonRow}>
              <WKButton
                title="Retake Photo"
                onPress={takeCameraPhoto}
                variant="secondary"
                size="sm"
                style={styles.changePhotoBtn}
              />
              <WKButton
                title="Choose From Library"
                onPress={pickPhotoFromLibrary}
                variant="secondary"
                size="sm"
                style={styles.changePhotoBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderText}>Capture or choose a photo for your story</Text>
            <WKButton
              title="Take a Photo"
              onPress={takeCameraPhoto}
              variant="primary"
              size="md"
              style={styles.pickPhotoBtn}
            />
            <WKButton
              title="Choose From Library"
              onPress={pickPhotoFromLibrary}
              variant="secondary"
              size="md"
              style={styles.pickPhotoBtn}
            />
          </View>
        )}

        {/* Caption Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Caption (optional)</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption to your story..."
            placeholderTextColor={colors.ink3}
            multiline
            numberOfLines={3}
            value={caption}
            onChangeText={setCaption}
            maxLength={200}
            editable={!loading}
          />
          <Text style={styles.charCount}>
            {caption.length} / 200
          </Text>
        </View>

        {/* Location Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Location (optional)</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Where are you?"
            placeholderTextColor={colors.ink3}
            value={locationName}
            onChangeText={setLocationName}
            maxLength={80}
            editable={!loading}
          />
        </View>

        {/* Story Duration Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Your story will be visible for 11 hours and 11 minutes.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <WKButton
          title="Share Story"
          onPress={handleShareStory}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!photoUrl}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg },

  // Photo Section
  photoContainer: {
    marginTop: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  selectedPhoto: {
    width: '100%',
    height: 320,
    backgroundColor: colors.surfaceAlt,
  },
  photoPlaceholder: {
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
    minHeight: 240,
  },
  placeholderText: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  pickPhotoBtn: {
    marginTop: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  changePhotoBtn: {
    flex: 1,
  },

  // Input Sections
  inputSection: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.ink,
    minHeight: 80,
  },
  locationInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.ink,
    minHeight: 44,
  },
  charCount: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: 6,
    textAlign: 'right',
  },

  // Info Section
  infoSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.amberBg,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
});
