import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKInput } from '../../../src/components/ui/WKInput';
import { WKButton } from '../../../src/components/ui/WKButton';
import { WKCard } from '../../../src/components/ui/WKCard';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { useAuth } from '../../../src/stores/auth';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const LANGUAGES = ['English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Polish'];
const EXPERIENCE_LEVELS = ['First Time', 'Casual Walker', 'Experienced', 'Seasoned', 'Guide'];

export default function EditProfileScreen() {
  useAuthGuard();

  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  const [trailName, setTrailName] = useState('');
  const [bio, setBio] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [quietMode, setQuietMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setTrailName(profile.trail_name || '');
      setBio(profile.bio || '');
      setHomeCountry(profile.home_country || '');
      setLanguages(profile.languages || []);
      setExperience(profile.walking_experience || '');
      setSkills((profile as any).skills?.join(', ') || '');
      setQuietMode((profile as any).quiet_mode || false);
      setPrivateProfile(!(profile as any).searchable);
    }
  }, [profile]);

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleSave = async () => {
    if (!trailName.trim()) {
      setError('Trail name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSaved(false);

    try {
      if (!user) throw new Error('No user');

      const { error: updateError } = await supabase.from('profiles').update({
        trail_name: trailName,
        bio,
        home_country: homeCountry,
        languages,
        walking_experience: experience,
        skills: skills ? skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        quiet_mode: quietMode,
        searchable: !privateProfile,
      }).eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Edit Profile" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
            <Text style={styles.successText}>Profile saved!</Text>
          </View>
        )}

        <WKInput
          label="Trail Name"
          value={trailName}
          onChangeText={setTrailName}
          placeholder="Your trail name"
          maxLength={30}
        />

        <WKInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell your story..."
          maxLength={500}
          multiline
          numberOfLines={3}
        />

        <WKInput
          label="Home Country"
          value={homeCountry}
          onChangeText={setHomeCountry}
          placeholder="Where are you from?"
        />

        <WKInput
          label="Home Country"
          value={homeCountry}
          onChangeText={setHomeCountry}
          placeholder="Where are you from?"
        />

        <Text style={styles.label}>Languages Spoken</Text>
        <View style={styles.languagesGrid}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageTag,
                languages.includes(lang) && styles.languageTagActive,
              ]}
              onPress={() => toggleLanguage(lang)}
            >
              <Text
                style={[
                  styles.languageText,
                  languages.includes(lang) && styles.languageTextActive,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <WKInput
          label="Skills & Services"
          value={skills}
          onChangeText={setSkills}
          placeholder="e.g. Cooking, Massage, Carpentry, First Aid"
          helper="Comma-separated list of what you can offer"
        />

        <Text style={styles.label}>Walking Experience</Text>
        <View style={styles.experienceGrid}>
          {EXPERIENCE_LEVELS.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.expButton,
                experience === level && styles.expButtonActive,
              ]}
              onPress={() => setExperience(level)}
            >
              <Text
                style={[
                  styles.expText,
                  experience === level && styles.expTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Privacy Settings */}
        <Text style={styles.label}>Privacy</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Private Profile</Text>
            <Text style={styles.toggleHint}>Hide your profile from search and map</Text>
          </View>
          <Switch
            value={privateProfile}
            onValueChange={setPrivateProfile}
            trackColor={{ false: colors.borderLt, true: colors.amberBg }}
            thumbColor={privateProfile ? colors.amber : '#f4f3f4'}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Quiet Mode</Text>
            <Text style={styles.toggleHint}>Hide tiers, stats, and gamification</Text>
          </View>
          <Switch
            value={quietMode}
            onValueChange={setQuietMode}
            trackColor={{ false: colors.borderLt, true: colors.amberBg }}
            thumbColor={quietMode ? colors.amber : '#f4f3f4'}
          />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Save Changes"
          onPress={handleSave}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        />
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
  successBanner: {
    flexDirection: 'row',
    backgroundColor: colors.greenBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  successText: {
    ...typography.bodySm,
    color: colors.green,
    flex: 1,
  },
  label: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  languageTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageTagActive: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  languageText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  languageTextActive: {
    color: colors.amber,
    fontWeight: '600',
  },
  experienceGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  expButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  expButtonActive: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  expText: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
  },
  expTextActive: {
    color: colors.amber,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  toggleHint: {
    ...typography.bodySm,
    color: colors.ink3,
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
