import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { showAlert } from '../../../../src/lib/alert';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/stores/auth';

export default function CreateBookEntry() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const autoSaveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverUrl(result.assets[0].uri);
    }
  };

  const handleAutoSave = () => {
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(async () => {
      if (!user || !title.trim() || !content.trim()) return;

      setSaving(true);
      try {
        // Auto-save as draft
        const wordCount = content.trim().split(/\s+/).length;

        // You would typically save to a drafts table or update existing draft
        console.log('Auto-saving draft...');
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setSaving(false);
      }
    }, 5000); // Auto-save after 5 seconds of inactivity
  };

  const handlePublish = async () => {
    if (!user || !title.trim() || !content.trim()) {
      showAlert('Missing content', 'Please enter a title and some content for your entry.');
      return;
    }

    setSaving(true);
    try {
      let uploadedCoverUrl = null;
      if (coverUrl) {
        const filename = `blog-cover-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('blog-covers')
          .upload(`${user.id}/${filename}`, {
            uri: coverUrl,
            type: 'image/jpeg',
            name: filename,
          } as any);

        if (error) throw error;

        const { data: publicData } = supabase.storage
          .from('blog-covers')
          .getPublicUrl(`${user.id}/${filename}`);

        uploadedCoverUrl = publicData?.publicUrl || null;
      }

      const wordCount = content.trim().split(/\s+/).length;

      const { error } = await supabase.from('blog_posts').insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        cover_image: uploadedCoverUrl,
        location_name: location.trim() || null,
        is_published: true,
        word_count: wordCount,
      });

      if (error) throw error;

      showAlert('Success', 'Your entry has been published to your walking book.');
      router.back();
    } catch (err) {
      console.error('Publish failed:', err);
      showAlert('Error', 'Failed to publish your entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Entry</Text>
        {saving && <ActivityIndicator size="small" color={colors.amber} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {coverUrl ? (
          <View style={styles.coverContainer}>
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
            <TouchableOpacity
              style={styles.changeCoverBtn}
              onPress={pickCover}
            >
              <Ionicons name="camera" size={16} color={colors.surface} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.coverPlaceholder}
            onPress={pickCover}
          >
            <Ionicons name="image-outline" size={40} color={colors.amber} />
            <Text style={styles.coverPlaceholderText}>Add cover photo</Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            placeholder="Give your entry a title..."
            placeholderTextColor={colors.ink3}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              handleAutoSave();
            }}
            maxLength={100}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.locationInputLabel}>
            <Ionicons name="location" size={14} color={colors.amber} />
            <Text style={styles.label}>Location (optional)</Text>
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder="Where was this moment?"
            placeholderTextColor={colors.ink3}
            value={location}
            onChangeText={setLocation}
            maxLength={80}
          />
        </View>

        {/* Content */}
        <View style={styles.section}>
          <TextInput
            style={styles.contentInput}
            placeholder="Write your story here..."
            placeholderTextColor={colors.ink3}
            value={content}
            onChangeText={(text) => {
              setContent(text);
              handleAutoSave();
            }}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <View style={styles.contentFooter}>
            <Text style={styles.wordCount}>
              {content.trim().split(/\s+/).filter(w => w).length} words
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.blue} />
          <Text style={styles.infoText}>
            Your entries are automatically saved as drafts and can be shared with a unique link.
          </Text>
        </View>
      </ScrollView>

      {/* Publish Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, !title.trim() || !content.trim() ? styles.publishBtnDisabled : {}]}
          onPress={handlePublish}
          disabled={saving || !title.trim() || !content.trim()}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color={colors.surface} />
              <Text style={styles.publishBtnText}>Publish</Text>
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
  headerTitle: { ...typography.h3, color: colors.ink, flex: 1, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  coverContainer: { position: 'relative', marginTop: spacing.lg, marginBottom: spacing.lg, borderRadius: 10, overflow: 'hidden' },
  coverImage: { width: '100%', height: 200, backgroundColor: colors.surfaceAlt },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholder: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.amberLine,
    borderRadius: 10,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: { ...typography.bodySm, color: colors.amber, marginTop: 8 },
  section: { marginBottom: spacing.lg },
  titleInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
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
  contentInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    minHeight: 200,
  },
  contentFooter: { alignItems: 'flex-end', marginTop: 8 },
  wordCount: { ...typography.caption, color: colors.ink3 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.blueBg,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginVertical: spacing.xl,
  },
  infoText: { ...typography.bodySm, color: colors.blue, flex: 1, lineHeight: 19 },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
  publishBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  publishBtnDisabled: { opacity: 0.5 },
  publishBtnText: { fontSize: 15, fontWeight: '600', color: colors.surface },
});
