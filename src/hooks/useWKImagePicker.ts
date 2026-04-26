/**
 * useWKImagePicker — unified image picker for all upload screens.
 *
 * Wraps expo-image-picker with:
 *  - Platform-aware camera handling (graceful fallback on web)
 *  - Consistent permission requests
 *  - File validation (size, type)
 *  - No raw <input type="file"> ever shown — expo-image-picker
 *    creates a hidden one and triggers it programmatically.
 */

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { showAlert } from '../lib/alert';
import { toast } from '../lib/toast';

export type ImageAspect = [number, number];

export interface WKImagePickerOptions {
  /** Aspect ratio for cropping (default [1, 1]) */
  aspect?: ImageAspect;
  /** JPEG quality 0-1 (default 0.8) */
  quality?: number;
  /** Allow editing/cropping (default true) */
  allowsEditing?: boolean;
}

export interface WKImagePickerResult {
  /** Pick from photo library */
  pickFromLibrary: () => Promise<string | null>;
  /** Take with camera (falls back to library on web if camera unavailable) */
  takeWithCamera: () => Promise<string | null>;
  /** Whether a pick/camera operation is in progress */
  picking: boolean;
}

export function useWKImagePicker(options?: WKImagePickerOptions): WKImagePickerResult {
  const [picking, setPicking] = useState(false);

  const aspect = options?.aspect ?? [1, 1];
  const quality = options?.quality ?? 0.8;
  const allowsEditing = options?.allowsEditing ?? true;

  const pickFromLibrary = useCallback(async (): Promise<string | null> => {
    if (picking) return null;
    setPicking(true);

    try {
      // Request permission (no-op on web, needed on native)
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Required', 'Please allow access to your photo library in settings.');
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const uri = result.assets[0].uri;

      // Validate on web (size + type)
      if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          if (blob.size > 10 * 1024 * 1024) {
            toast.error('Photo must be under 10 MB');
            return null;
          }
          const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
          if (blob.type && !validTypes.includes(blob.type)) {
            toast.error('Please choose a JPEG, PNG, or WebP image');
            return null;
          }
        } catch {
          // Can't validate — allow through
        }
      }

      return uri;
    } catch (err) {
      console.error('Image picker error:', err);
      toast.error('Could not select photo');
      return null;
    } finally {
      setPicking(false);
    }
  }, [picking, aspect, quality, allowsEditing]);

  const takeWithCamera = useCallback(async (): Promise<string | null> => {
    if (picking) return null;
    setPicking(true);

    try {
      // On web, launchCameraAsync may not be supported in all browsers.
      // It creates <input type="file" capture="environment"> which works
      // on mobile web but may just open file picker on desktop web.
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Required', 'Please allow camera access in settings.');
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const uri = result.assets[0].uri;

      // Same web validation
      if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          if (blob.size > 10 * 1024 * 1024) {
            toast.error('Photo must be under 10 MB');
            return null;
          }
        } catch {
          // Allow through
        }
      }

      return uri;
    } catch (err) {
      console.error('Camera error:', err);
      // On web desktop, camera might not work — fall back to library silently
      if (Platform.OS === 'web') {
        setPicking(false);
        return pickFromLibrary();
      }
      toast.error('Could not access camera');
      return null;
    } finally {
      setPicking(false);
    }
  }, [picking, aspect, quality, allowsEditing, pickFromLibrary]);

  return { pickFromLibrary, takeWithCamera, picking };
}
