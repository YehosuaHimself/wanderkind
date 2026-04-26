import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useRouter } from 'expo-router';
import { haptic } from '../../../src/lib/haptics';

type PackTab = 'packlist' | 'tips';

type PackItem = {
  id: string;
  name: string;
  packed: boolean;
};

type PackCategory = {
  title: string;
  icon: string;
  items: PackItem[];
  expanded: boolean;
};

/**
 * Packlist & Tips — Two-fold layout like Writing section.
 * Left tab: interactive checklist with categories.
 * Right tab: curated editorial tips for new wanderkinder.
 */

// ── The first editorial tip ─────────────────────────────────────────
const FIRST_TIP = {
  id: 'tip-001',
  title: 'How to Start the Journey',
  readTime: '3 min read',
  coverUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
  authorName: 'Yehosua',
  authorRole: 'Founder',
  quote: '"Nothing can go wrong if You put the right foot in front of the other."',
  body: `You are reading this because something inside you already knows: it is time to walk.

Maybe you have been planning for months. Maybe the idea came to you this morning over coffee. Maybe someone told you about a walking way and the thought has not left your mind since. It does not matter how you got here. What matters is that you are here.

Let us be honest about what you are feeling right now. There is excitement — a fluttering sense of possibility that you have not felt since childhood. And right next to it, there is fear. Fear of the unknown. Fear of being alone. Fear that you are not strong enough, not prepared enough, not the "type" who does this.

Every single wanderkind who ever walked felt exactly what you feel right now. Every one.

THE PACK ON YOUR BACK

Your backpack should weigh no more than 8 kilograms. That is roughly 10% of your body weight. The most common mistake first-timers make is packing for every scenario. You do not need three books, a laptop, five shirts, and rain gear rated for Arctic expeditions.

Here is the truth nobody tells you: you need far less than you think. Two shirts. Two pairs of socks. One pair of walking shoes that you have already broken in. A rain jacket. A small towel. Basic toiletries. Your phone and a charger. Your credential. That is genuinely it.

Everything else is weight you carry not on your shoulders, but on your mind. Each unnecessary item is a small worry: "Will I need this? What if I left this at the last place?" Travel light, and your thoughts travel light with you.

THE FIRST MORNING

Wake up. The world outside is still dark, or maybe the first light is just touching the horizon. Your body is stiff. Your mind immediately starts listing reasons to stay in bed.

Ignore all of them. Put your feet on the floor. Get dressed. Step outside. Start walking.

The first thirty minutes are always the hardest. Your body protests. Your pack feels heavy. Your feet are finding their rhythm. But somewhere around the forty-minute mark, something shifts. Your breathing steadies. Your shoulders drop. The weight on your back becomes part of you. And the world opens up.

This is the moment every wanderkind remembers — the moment the walk begins to carry you instead of the other way around.

YOU ARE NEVER TRULY ALONE

The walking ways are full of people just like you. At every albergue, every refuge, every donativo along the way, you will find others who left their normal lives behind to do exactly what you are doing. Some of them have walked thousands of kilometers. Some of them started yesterday, just like you.

The walking community has a word that no other community uses quite the same way: "Buen Camino." It means "good way." It is said between walkers as a greeting, a blessing, and a promise. When someone says it to you, they are saying: I see you. I know what you are going through. Keep going.

You will receive this greeting dozens of times each day. And each time, it will feel a little more like home.

WHAT IF SOMETHING GOES WRONG?

Your feet will blister. This is not a possibility — it is a certainty. Buy blister plasters before you leave. Apply them at the first sign of a hot spot, not after the blister forms. Keep walking.

You will get lost. Probably more than once. This is not a disaster. This is part of the walk. Some of the best experiences on any walking way come from wrong turns. Ask a local. Check your map. Find your way back. The way always waits for you.

You might feel lonely. Especially on the second or third day, when the initial excitement wears off and the reality of what you are doing settles in. This is normal. Sit in a village square. Order a coffee. Talk to the person at the next table. Loneliness on the walk has a very short half-life.

It will rain. Your shoes will get wet. You will arrive at your destination cold and damp. And then someone will hand you a cup of tea, point you to a warm shower, and suddenly the rain becomes a story you tell with a smile.

THE ONLY THING THAT MATTERS

Put the right foot in front of the other. Then the left. Then the right again.

That is the entire secret. There is no technique to master, no skill to develop, no qualification to earn. You already know how to walk. You have been doing it since you were a year old.

The walk will teach you everything else. It will teach you patience, because the destination is always further than you think. It will teach you gratitude, because every bed and every meal becomes a gift. It will teach you trust, because you will depend on the kindness of strangers and discover that it is the most reliable thing in the world.

You are ready. You have always been ready.

Now go. Put the right foot in front of the other.

And welcome to the walking life.`,
};

export default function PacklistScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PackTab>('packlist');

  const [categories, setCategories] = useState<PackCategory[]>([
    {
      title: 'Essentials',
      icon: 'checkmark-circle-outline',
      expanded: true,
      items: [
        { id: 'e1', name: 'Passport/ID', packed: false },
        { id: 'e2', name: 'Credit cards & cash', packed: false },
        { id: 'e3', name: 'Phone & charger', packed: false },
        { id: 'e4', name: 'Medications', packed: false },
        { id: 'e5', name: 'Pilgrim credential', packed: false },
      ],
    },
    {
      title: 'Clothing',
      icon: 'shirt-outline',
      expanded: true,
      items: [
        { id: 'c1', name: 'Hiking boots (broken in)', packed: false },
        { id: 'c2', name: 'Socks (2–3 pairs)', packed: false },
        { id: 'c3', name: 'Underwear (2–3 pairs)', packed: false },
        { id: 'c4', name: 'Shirt (moisture-wicking)', packed: false },
        { id: 'c5', name: 'Rain jacket', packed: false },
        { id: 'c6', name: 'Fleece or warm layer', packed: false },
        { id: 'c7', name: 'Shorts or light trousers', packed: false },
      ],
    },
    {
      title: 'Hygiene',
      icon: 'water-outline',
      expanded: true,
      items: [
        { id: 'h1', name: 'Toothbrush & paste', packed: false },
        { id: 'h2', name: 'Soap (biodegradable)', packed: false },
        { id: 'h3', name: 'Towel (quick-dry, microfiber)', packed: false },
        { id: 'h4', name: 'Sunscreen', packed: false },
        { id: 'h5', name: 'Blister plasters', packed: false },
      ],
    },
    {
      title: 'Shelter & Sleep',
      icon: 'bed-outline',
      expanded: false,
      items: [
        { id: 's1', name: 'Sleeping bag liner', packed: false },
        { id: 's2', name: 'Earplugs', packed: false },
        { id: 's3', name: 'Eye mask', packed: false },
      ],
    },
    {
      title: 'Electronics',
      icon: 'battery-charging-outline',
      expanded: false,
      items: [
        { id: 'el1', name: 'Headlamp/flashlight', packed: false },
        { id: 'el2', name: 'Power bank', packed: false },
        { id: 'el3', name: 'USB cables', packed: false },
        { id: 'el4', name: 'EU adapter (if needed)', packed: false },
      ],
    },
    {
      title: 'Documents',
      icon: 'document-outline',
      expanded: false,
      items: [
        { id: 'd1', name: 'Wanderkind Pass', packed: false },
        { id: 'd2', name: 'Travel insurance', packed: false },
        { id: 'd3', name: 'Emergency contacts (written)', packed: false },
      ],
    },
  ]);

  const toggleCategory = (index: number) => {
    haptic.selection();
    const newCategories = [...categories];
    newCategories[index].expanded = !newCategories[index].expanded;
    setCategories(newCategories);
  };

  const toggleItem = (categoryIndex: number, itemId: string) => {
    haptic.selection();
    const newCategories = [...categories];
    const item = newCategories[categoryIndex].items.find((i) => i.id === itemId);
    if (item) {
      item.packed = !item.packed;
    }
    setCategories(newCategories);
  };

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const packedItems = categories.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.packed).length,
    0
  );
  const packingPercent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  // ── Tab bar (same pattern as Writing section) ─────────────────────
  const tabInfo: Record<PackTab, { icon: string; label: string }> = {
    packlist: { icon: 'bag-check-outline', label: 'Packlist' },
    tips: { icon: 'bulb-outline', label: 'Tips' },
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {(['packlist', 'tips'] as PackTab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => {
            haptic.light();
            setActiveTab(tab);
          }}
        >
          <Ionicons
            name={tabInfo[tab].icon as any}
            size={18}
            color={activeTab === tab ? colors.amber : colors.ink3}
          />
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tabInfo[tab].label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Packlist tab ──────────────────────────────────────────────────
  const renderPacklist = () => (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressPercent}>{packingPercent}%</Text>
          <Text style={styles.progressLabel}>{packedItems} of {totalItems} items</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${packingPercent}%` }]} />
        </View>
        <Text style={styles.weightHint}>Target: under 8 kg total</Text>
      </View>

      {/* Categories */}
      {categories.map((category, catIndex) => (
        <View key={category.title} style={styles.categorySection}>
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleCategory(catIndex)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name={category.icon as any} size={18} color={colors.amber} />
            </View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryCount}>
              {category.items.filter((i) => i.packed).length}/{category.items.length}
            </Text>
            <Ionicons
              name={category.expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.ink3}
            />
          </TouchableOpacity>

          {category.expanded && (
            <View style={styles.itemsList}>
              {category.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, item.packed && styles.itemRowPacked]}
                  onPress={() => toggleItem(catIndex, item.id)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.checkbox, item.packed && styles.checkboxChecked]}>
                    {item.packed ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.itemName,
                      item.packed && styles.itemNamePacked,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ── Tips tab ──────────────────────────────────────────────────────
  const renderTips = () => (
    <ScrollView
      contentContainerStyle={styles.tipsContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Featured tip card */}
      <View style={styles.tipCard}>
        {/* Cover image */}
        <View style={styles.tipCoverWrap}>
          <Image
            source={{ uri: FIRST_TIP.coverUrl }}
            style={styles.tipCover}
            resizeMode="cover"
          />
          <View style={styles.tipCoverOverlay} />
          <View style={styles.tipCoverContent}>
            <View style={styles.tipReadTimeBadge}>
              <Ionicons name="time-outline" size={11} color={colors.amber} />
              <Text style={styles.tipReadTimeText}>{FIRST_TIP.readTime}</Text>
            </View>
            <Text style={styles.tipCoverTitle}>{FIRST_TIP.title}</Text>
          </View>
        </View>

        {/* Author row */}
        <View style={styles.tipAuthorRow}>
          <View style={styles.tipAuthorDot} />
          <Text style={styles.tipAuthorName}>{FIRST_TIP.authorName}</Text>
          <Text style={styles.tipAuthorRole}>{FIRST_TIP.authorRole}</Text>
        </View>

        {/* Quote */}
        <View style={styles.tipQuoteBox}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.amber} />
          <Text style={styles.tipQuoteText}>{FIRST_TIP.quote}</Text>
        </View>

        {/* Body paragraphs */}
        {FIRST_TIP.body.split('\n\n').map((paragraph, idx) => {
          const isHeading = paragraph === paragraph.toUpperCase() && paragraph.length < 40;
          return isHeading ? (
            <Text key={idx} style={styles.tipSectionHeading}>{paragraph}</Text>
          ) : (
            <Text key={idx} style={styles.tipParagraph}>{paragraph}</Text>
          );
        })}
      </View>

      {/* More tips coming soon */}
      <View style={styles.moreComingSoon}>
        <Ionicons name="sparkles-outline" size={20} color={colors.ink3} />
        <Text style={styles.moreComingSoonText}>More tips coming soon</Text>
        <Text style={styles.moreComingSoonSub}>
          Stories, gear reviews, and route guides from experienced wanderkinder.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabelText}>PREPARATION</Text>
          <Text style={styles.headerTitle}>Packlist & Tips</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Tab bar */}
      {renderTabBar()}

      {/* Content */}
      {activeTab === 'packlist' ? renderPacklist() : renderTips()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 0,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabelText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
  },
  headerTitle: { ...typography.h3, color: colors.ink },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.amber,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink3,
  },
  tabTextActive: {
    color: colors.amber,
  },

  // Packlist tab
  content: { padding: spacing.lg, paddingBottom: spacing.xl },

  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.amber,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.ink3,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
    borderRadius: 3,
  },
  weightHint: {
    fontSize: 11,
    color: colors.ink3,
    marginTop: 8,
    textAlign: 'right',
  },

  categorySection: { marginBottom: 12 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    gap: 10,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600' },
  categoryCount: { fontSize: 12, color: colors.amber, fontWeight: '600' },
  itemsList: { paddingHorizontal: 12, paddingTop: 4 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    gap: 12,
  },
  itemRowPacked: { backgroundColor: `${colors.amberBg}30` },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  itemName: { flex: 1, fontSize: 14, color: colors.ink2 },
  itemNamePacked: { color: colors.ink3, textDecorationLine: 'line-through' },

  // Tips tab
  tipsContent: { padding: spacing.lg, paddingBottom: spacing.xl },

  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 24,
  },
  tipCoverWrap: {
    height: 200,
    position: 'relative',
  },
  tipCover: {
    width: '100%',
    height: '100%',
  },
  tipCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tipCoverContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  tipReadTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tipReadTimeText: {
    fontSize: 10,
    color: colors.amber,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tipCoverTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
  },

  tipAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  tipAuthorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  tipAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  tipAuthorRole: {
    fontSize: 11,
    color: colors.ink3,
  },

  tipQuoteBox: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: colors.amberBg,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  tipQuoteText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
    fontWeight: '500',
  },

  tipSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  tipParagraph: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  moreComingSoon: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  moreComingSoonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink3,
  },
  moreComingSoonSub: {
    fontSize: 12,
    color: colors.ink3,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
