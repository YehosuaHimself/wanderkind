import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuth } from '../../../../src/stores/auth';
import { supabase } from '../../../../src/lib/supabase';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';
import { toast } from '../../../../src/lib/toast';
import { useRouter } from 'expo-router';

const STAMP_ICONS: { id: string; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'footsteps', icon: 'footsteps', label: 'Footsteps' },
  { id: 'compass', icon: 'compass-outline', label: 'Compass' },
  { id: 'heart', icon: 'heart', label: 'Heart' },
  { id: 'star', icon: 'star', label: 'Star' },
  { id: 'leaf', icon: 'leaf', label: 'Leaf' },
  { id: 'flame', icon: 'flame', label: 'Flame' },
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'sunny', icon: 'sunny', label: 'Sun' },
  { id: 'water', icon: 'water', label: 'Water' },
  { id: 'mountain', icon: 'trail-sign', label: 'Trail' },
  { id: 'moon', icon: 'moon', label: 'Moon' },
  { id: 'earth', icon: 'earth', label: 'Earth' },
];

const STAMP_COLORS = [
  { id: 'amber', color: '#C8762A', label: 'Wanderkind Orange' },
  { id: 'forest', color: '#2D6A4F', label: 'Forest Green' },
  { id: 'ocean', color: '#1E6091', label: 'Ocean Blue' },
  { id: 'sunset', color: '#BD4F6C', label: 'Sunset Rose' },
  { id: 'earth', color: '#7C5C3E', label: 'Earth Brown' },
  { id: 'night', color: '#2D3047', label: 'Night Sky' },
  { id: 'plum', color: '#7B2D8B', label: 'Wild Plum' },
  { id: 'crimson', color: '#9B2335', label: 'Crimson' },
];

export default function MyStampEditor() {
  useAuthGuard();

  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedIcon, setSelectedIcon] = useState('footsteps');
  const [selectedColor, setSelectedColor] = useState('amber');
  const [motto, setMotto] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const trailName = profile?.trail_name || user?.user_metadata?.trail_name || 'Wanderkind';

  // Load existing personal stamp from profile metadata
  useEffect(() => {
    if (profile?.personal_stamp) {
      try {
        const stamp = typeof profile.personal_stamp === 'string'
          ? JSON.parse(profile.personal_stamp)
          : profile.personal_stamp;
        if (stamp.icon) setSelectedIcon(stamp.icon);
        if (stamp.color) setSelectedColor(stamp.color);
        if (stamp.motto) setMotto(stamp.motto);
      } catch {}
    }
    setLoaded(true);
  }, [profile]);

  const currentColor = STAMP_COLORS.find(c => c.id === selectedColor)?.color || '#C8762A';
  const currentIcon = STAMP_ICONS.find(i => i.id === selectedIcon)?.icon || 'footsteps';

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const stampData = {
        icon: selectedIcon,
        color: selectedColor,
        motto: motto.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update({ personal_stamp: JSON.stringify(stampData) } as any)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Your Wanderkind Stamp has been saved');
    } catch (err) {
      console.error('Save stamp failed:', err);
      toast.error('Could not save your stamp. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareText = `${trailName}'s Wanderkind Stamp\n${motto ? `"${motto}"\n` : ''}wanderkind.love`;

    if (Platform.OS === 'web') {
      try {
        if (navigator.share) {
          await navigator.share({ title: 'My Wanderkind Stamp', text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          toast.success('Copied to clipboard');
        }
      } catch {
        toast.error('Could not share');
      }
    } else {
      try {
        await Share.share({ message: shareText, title: 'My Wanderkind Stamp' });
      } catch {
        toast.error('Could not share');
      }
    }
  };

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="My Wanderkind Stamp" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Preview */}
        <View style={styles.previewSection}>
          <View style={[styles.stampPreview, { borderColor: currentColor }]}>
            <View style={[styles.stampInner, { backgroundColor: currentColor + '12' }]}>
              <Ionicons name={currentIcon} size={40} color={currentColor} />
              <Text style={[styles.stampName, { color: currentColor }]}>{trailName}</Text>
              {motto.trim() ? (
                <Text style={[styles.stampMotto, { color: currentColor + 'CC' }]}>
                  "{motto.trim()}"
                </Text>
              ) : null}
              <Text style={[styles.stampWanderkind, { color: currentColor + '80' }]}>WANDERKIND</Text>
            </View>
          </View>
          <Text style={styles.previewHint}>This is your personal stamp — unique to you</Text>
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Symbol</Text>
          <View style={styles.iconGrid}>
            {STAMP_ICONS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.iconButton,
                  selectedIcon === item.id && { backgroundColor: currentColor + '15', borderColor: currentColor },
                ]}
                onPress={() => setSelectedIcon(item.id)}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={selectedIcon === item.id ? currentColor : colors.ink3}
                />
                <Text style={[
                  styles.iconLabel,
                  selectedIcon === item.id && { color: currentColor, fontWeight: '600' },
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Color</Text>
          <View style={styles.colorGrid}>
            {STAMP_COLORS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.colorButton,
                  selectedColor === item.id && styles.colorButtonActive,
                ]}
                onPress={() => setSelectedColor(item.id)}
              >
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]}>
                  {selectedColor === item.id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={[
                  styles.colorLabel,
                  selectedColor === item.id && { color: colors.ink, fontWeight: '600' },
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Motto (optional)</Text>
          <TextInput
            style={styles.mottoInput}
            placeholder="A short phrase that defines your walk..."
            placeholderTextColor={colors.ink3}
            value={motto}
            onChangeText={setMotto}
            maxLength={60}
            editable={!saving}
          />
          <Text style={styles.charCount}>{motto.length} / 60</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <WKButton
            title="Save My Stamp"
            onPress={handleSave}
            variant="primary"
            fullWidth
            loading={saving}
          />
          <WKButton
            title="Share With Others"
            onPress={handleShare}
            variant="secondary"
            fullWidth
            disabled={saving}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.amber} />
          <Text style={styles.infoText}>
            Your personal Wanderkind Stamp is unique to you. Other wanderkinder can scan it to collect it in their stamp book.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },

  // Preview
  previewSection: { alignItems: 'center', marginBottom: spacing.xl },
  stampPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    padding: 4,
  },
  stampInner: {
    flex: 1,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  stampName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stampMotto: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 3,
    textAlign: 'center',
  },
  stampWanderkind: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  previewHint: {
    ...typography.caption,
    color: colors.ink3,
    marginTop: spacing.md,
  },

  // Sections
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.md,
  },

  // Icon grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  iconLabel: {
    fontSize: 9,
    color: colors.ink3,
    marginTop: 4,
    textAlign: 'center',
  },

  // Color grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  colorButtonActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 9,
    color: colors.ink3,
    marginTop: 4,
    textAlign: 'center',
  },

  // Motto
  mottoInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
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
    textAlign: 'right',
    marginTop: 4,
  },

  // Actions
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.amberBg,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.caption,
    color: colors.ink2,
    flex: 1,
    lineHeight: 16,
  },
});
