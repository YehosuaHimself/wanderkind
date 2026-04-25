import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const DEFAULT_TEXT = `Our home is a sanctuary for wanderkinder and walkers. Nestled in the quiet countryside, we've created a space where travelers can rest, reflect, and recharge before continuing their journey.

We believe in authentic hospitality - sharing meals, stories, and the warmth of our family. Our property features a peaceful garden, comfortable rooms, and a kitchen where guests can prepare their own meals or join us for dinner.

What makes us special is our commitment to the Wanderkind way. We understand the physical and spiritual journey walkers undertake, and we're honored to be a stopping point on that sacred path.`;

export default function ProjectScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const [text, setText] = useState(DEFAULT_TEXT);
  const [savedText, setSavedText] = useState(DEFAULT_TEXT);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavedText(text);
    setLoading(false);
  };

  const wordCount = text.trim().split(/\s+/).length;
  const charCount = text.length;
  const hasChanges = text !== savedText;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="My Project" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Description */}
          <WKCard variant="parchment">
            <View style={styles.descHeader}>
              <Ionicons name="book" size={20} color={colors.ink2} />
              <View style={styles.descText}>
                <Text style={styles.descTitle}>Tell Your Story</Text>
                <Text style={styles.descSubtitle}>
                  What makes your hosting special?
                </Text>
              </View>
            </View>
          </WKCard>

          {/* Text Editor */}
          <WKCard style={styles.editorCard}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Share what makes your home and hospitality special..."
              placeholderTextColor={colors.ink3}
              multiline
              textAlignVertical="top"
            />
          </WKCard>

          {/* Word Count & Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Words</Text>
              <Text style={styles.statValue}>{wordCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Characters</Text>
              <Text style={styles.statValue}>{charCount}</Text>
            </View>
            {hasChanges && (
              <View style={styles.stat}>
                <Ionicons name="alert-circle" size={16} color={colors.red} />
                <Text style={styles.unsavedLabel}>Unsaved</Text>
              </View>
            )}
          </View>

          {/* Tips */}
          <WKCard variant="gold">
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={colors.amber} />
              <Text style={styles.tipsTitle}>Writing Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>
                Be authentic - share your genuine passion for hosting
              </Text>
              <Text style={styles.tip}>
                Mention specific features (garden, kitchen, views)
              </Text>
              <Text style={styles.tip}>
                Describe the atmosphere and what guests will experience
              </Text>
              <Text style={styles.tip}>
                Share your connection to the Wanderkind tradition
              </Text>
            </View>
          </WKCard>

          {/* Save Button */}
          <WKButton
            title={loading ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
            onPress={handleSave}
            disabled={loading || !hasChanges}
            fullWidth
            variant={hasChanges ? 'primary' : 'outline'}
            style={styles.saveBtn}
          />
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
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  descText: {
    flex: 1,
    gap: spacing.xs,
  },
  descTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  descSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  editorCard: {
    minHeight: 220,
    padding: 0,
  },
  textInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  statValue: {
    ...typography.h2,
    color: colors.ink,
  },
  unsavedLabel: {
    ...typography.bodySm,
    color: colors.red,
    marginLeft: spacing.xs,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  tipsList: {
    gap: spacing.md,
  },
  tip: {
    ...typography.bodySm,
    color: colors.ink,
    lineHeight: 20,
  },
  saveBtn: {
    marginBottom: spacing.lg,
  },
});
