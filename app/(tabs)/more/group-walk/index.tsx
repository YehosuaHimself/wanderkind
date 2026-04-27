import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { useAuthStore } from '../../../../src/stores/auth';

type GroupWalk = {
  id: string;
  name: string;
  route: string;
  startDate: string;
  members: number;
  maxMembers: number;
  distance: string;
  creator: string;
};

const mockGroupWalks: GroupWalk[] = [
  {
    id: '1',
    name: 'Camino del Norte Spring 2024',
    route: 'Camino del Norte',
    startDate: 'May 15, 2024',
    members: 8,
    maxMembers: 12,
    distance: '450 km',
    creator: 'Maria',
  },
  {
    id: '2',
    name: 'Königsweg Alpine Adventure',
    route: 'Königsweg',
    startDate: 'June 1, 2024',
    members: 5,
    maxMembers: 10,
    distance: '380 km',
    creator: 'Hans',
  },
];

export default function GroupWalkScreen({ embedded = false }: { embedded?: boolean }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [myGroups, setMyGroups] = useState<GroupWalk[]>([]);

  // Never block rendering — content is always accessible

  const Wrapper = embedded ? View : SafeAreaView;
  const wrapperProps = embedded ? { style: styles.container } : { style: styles.container, edges: ['top'] as const };

  return (
    <Wrapper {...(wrapperProps as any)}>
      {!embedded && <WKHeader title="WanderGroups" showBack />}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Button */}
        <WKButton
          title="Create Group Walk"
          onPress={() => router.push('/(tabs)/more/group-walk/create' as any)}
          variant="primary"
          fullWidth
        />

        {/* My Group Walks */}
        {myGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.h3, styles.sectionTitle]}>My Groups</Text>
            <View style={styles.groupsList}>
              {myGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/(tabs)/more/group-walk/${group.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupHeader}>
                    <View>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupRoute}>{group.route}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                  </View>
                  <View style={styles.groupMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color={colors.amber} />
                      <Text style={styles.metaText}>
                        {group.members}/{group.maxMembers}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.amber} />
                      <Text style={styles.metaText}>{group.startDate}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Available Groups Nearby */}
        <View style={styles.section}>
          <Text style={[typography.h3, styles.sectionTitle]}>Available Groups</Text>
          <View style={styles.groupsList}>
            {mockGroupWalks.map((group) => (
              <WKCard key={group.id} style={styles.cardMargin}>
                <TouchableOpacity
                  onPress={() => router.push(`/(tabs)/more/group-walk/${group.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupRoute}>{group.route}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{group.members} going</Text>
                    </View>
                  </View>

                  <View style={styles.groupDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.ink3} />
                      <Text style={styles.detailText}>{group.startDate}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="navigate-outline" size={14} color={colors.ink3} />
                      <Text style={styles.detailText}>{group.distance}</Text>
                    </View>
                  </View>

                  <WKButton
                    title="Join Group"
                    onPress={() => router.push(`/(tabs)/more/group-walk/${group.id}` as any)}
                    variant="secondary"
                    size="sm"
                    fullWidth
                    style={{ marginTop: spacing.md }}
                  />
                </TouchableOpacity>
              </WKCard>
            ))}
          </View>
        </View>

        {/* Empty State */}
        {myGroups.length === 0 && mockGroupWalks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.ink3} />
            <Text style={[typography.h3, styles.emptyTitle]}>No Groups Yet</Text>
            <Text style={[typography.body, styles.emptyText]}>
              Create your first group walk or join an existing one to walk with others.
            </Text>
          </View>
        )}
      </ScrollView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.ink, marginBottom: spacing.md },
  groupsList: { gap: spacing.md },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLt,
    padding: spacing.md,
  },
  cardMargin: { marginBottom: spacing.md },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  groupName: { ...typography.body, color: colors.ink, fontWeight: '600' },
  groupRoute: { ...typography.bodySm, color: colors.ink3, marginTop: 2 },
  groupMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: { ...typography.bodySm, color: colors.ink2 },
  badge: {
    backgroundColor: colors.amberBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: { ...typography.caption, color: colors.amber, fontWeight: '600' },
  groupDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: { ...typography.bodySm, color: colors.ink3 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: { color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyText: { color: colors.ink3, textAlign: 'center', maxWidth: 300 },
});
