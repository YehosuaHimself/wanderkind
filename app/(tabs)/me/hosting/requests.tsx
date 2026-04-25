import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKEmpty } from '../../../src/components/ui/WKEmpty';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

interface Request {
  id: string;
  walkerName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  message: string;
  rating?: number;
}

const MOCK_REQUESTS: Request[] = [
  {
    id: '1',
    walkerName: 'Sophie Laurent',
    checkInDate: '2024-05-20',
    checkOutDate: '2024-05-23',
    guests: 2,
    message: 'We are two wanderkinder walking the Camino. Very excited to stay at your place!',
    rating: 4.8,
  },
  {
    id: '2',
    walkerName: 'Marco Rossi',
    checkInDate: '2024-06-01',
    checkOutDate: '2024-06-02',
    guests: 1,
    message: 'First time on the Camino, would love to experience your hospitality.',
  },
];

export default function HostingRequests() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const router = useRouter();

  const renderRequest = ({ item }: { item: Request }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => router.push(`/(tabs)/me/hosting/request-detail/${item.id}`)}
    >
      <WKCard>
        <View style={styles.header}>
          <View style={styles.walkerInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={40} color={colors.amber} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.walkerName}</Text>
              {item.rating && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={styles.rating}>{item.rating}</Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={colors.ink2} />
            <Text style={styles.detailText}>
              {new Date(item.checkInDate).toLocaleDateString()} - {new Date(item.checkOutDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color={colors.ink2} />
            <Text style={styles.detailText}>{item.guests} guest{item.guests !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        </View>
      </WKCard>
    </TouchableOpacity>
  );

  if (MOCK_REQUESTS.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Incoming Requests" />
        <WKEmpty
          icon="mail-outline"
          title="No Requests"
          message="Your booking requests will appear here"
          iconColor={colors.amberLine}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Incoming Requests" />

      <FlatList
        data={MOCK_REQUESTS}
        renderItem={renderRequest}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: spacing.screenPx,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  walkerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rating: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  details: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  messageBox: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  message: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
  },
});
