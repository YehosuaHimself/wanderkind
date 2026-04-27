import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, hostTypeConfig, getFreshnessBadge, getResponseTimeBadge, dataSourceConfig } from '../../lib/theme';
import { Host } from '../../types/database';
import { FavoriteButton } from './FavoriteButton';

const { width, height } = Dimensions.get('window');
const HOST_CARD_WIDTH = width - 48;

interface HostCardProps {
  item: Host;
  index: number;
  total: number;
  distanceLabel: string;
  onFocus: (host: Host) => void;
  onPress: (id: string) => void;
}

function HostCardInner({ item, index, total, distanceLabel, onFocus }: HostCardProps) {
  const config = hostTypeConfig[item.host_type as keyof typeof hostTypeConfig];

  return (
    <TouchableOpacity style={styles.hostCard} activeOpacity={0.95}>
      {/* Top label row */}
      <View style={styles.hostCardHeader}>
        <View style={[styles.hostTypeBadge, { backgroundColor: config?.bg ?? colors.amberBg }]}>
          <Text style={[styles.hostTypeBadgeText, { color: config?.color ?? colors.amber }]}>
            {config?.label ?? 'HOST'}
          </Text>
        </View>
        <Text style={styles.hostCardDistance}>{distanceLabel}</Text>
        <Text style={styles.hostCardIndex}>{index + 1}/{total}</Text>
      </View>

      {/* Name + Favorite */}
      <View style={styles.nameRow}>
        <Text style={styles.hostCardName} numberOfLines={3}>{item.name}</Text>
        <FavoriteButton hostId={item.id} />
      </View>

      {/* Address */}
      <View style={styles.hostCardRow}>
        <Ionicons name="location-outline" size={13} color={colors.ink3} />
        <Text style={styles.hostCardDetail} numberOfLines={1}>
          {(item as any).region ? `${(item as any).region}, ${(item as any).country}` : 'Along the Way'}
        </Text>
      </View>

      {/* Capacity */}
      <View style={styles.hostCardRow}>
        <Ionicons name="bed-outline" size={13} color={colors.ink3} />
        <Text style={styles.hostCardDetail}>
          {item.capacity ? `${item.capacity} beds` : 'Beds available'}
        </Text>
      </View>

      {/* Description */}
      {item.description && (
        <View style={styles.hostCardRow}>
          <Text style={styles.hostCardDetail} numberOfLines={2}>{item.description}</Text>
        </View>
      )}

      {/* Hosted count */}
      <View style={styles.hostCardRow}>
        <Ionicons name="people-outline" size={13} color={colors.ink3} />
        <Text style={styles.hostCardDetail}>
          {item.total_hosted?.toLocaleString() ?? '0'} wanderkinder hosted
        </Text>
      </View>

      {/* Country */}
      {(item as any).country && (
        <View style={styles.hostCardRow}>
          <Ionicons name="flag-outline" size={13} color={colors.ink3} />
          <Text style={styles.hostCardDetail}>{(item as any).country}</Text>
        </View>
      )}

      {/* Route km */}
      {item.route_km != null && (
        <View style={styles.hostCardRow}>
          <Ionicons name="compass-outline" size={13} color={colors.ink3} />
          <Text style={styles.hostCardDetail}>Route km {item.route_km}</Text>
        </View>
      )}

      {/* Price range */}
      {(item as any).price_range && (
        <View style={styles.hostCardRow}>
          <Ionicons name="pricetag-outline" size={13} color={colors.ink3} />
          <Text style={styles.hostCardDetail}>{(item as any).price_range}</Text>
        </View>
      )}

      {/* Trust badges */}
      <View style={styles.trustBadgeRow}>
        {(() => {
          const fresh = getFreshnessBadge((item as any).last_confirmed);
          return (
            <View style={[styles.trustBadge, { backgroundColor: fresh.bg }]}>
              <Ionicons name={fresh.icon as any} size={10} color={fresh.color} />
              <Text style={[styles.trustBadgeText, { color: fresh.color }]}>{fresh.label}</Text>
            </View>
          );
        })()}
        {(() => {
          const src = dataSourceConfig[(item as any).data_source] || dataSourceConfig.community_report;
          return (
            <View style={[styles.trustBadge, { backgroundColor: 'rgba(155,142,126,0.06)' }]}>
              <Ionicons name="shield-checkmark-outline" size={10} color={src.color} />
              <Text style={[styles.trustBadgeText, { color: src.color }]}>{src.label}</Text>
            </View>
          );
        })()}
        {(() => {
          const resp = getResponseTimeBadge((item as any).avg_response_minutes);
          return (
            <View style={[styles.trustBadge, { backgroundColor: resp.bg }]}>
              <Ionicons name={resp.icon as any} size={10} color={resp.color} />
              <Text style={[styles.trustBadgeText, { color: resp.color }]}>{resp.label}</Text>
            </View>
          );
        })()}
        {(item as any).amenities?.length > 0 && (
          <View style={[styles.trustBadge, { backgroundColor: colors.amberBg }]}>
            <Ionicons name="pricetag-outline" size={10} color={colors.amber} />
            <Text style={[styles.trustBadgeText, { color: colors.amber }]}>{(item as any).amenities.length} features</Text>
          </View>
        )}
      </View>

      {/* Amenity pills */}
      {(item as any).amenities?.length > 0 && (
        <View style={styles.amenitiesRow}>
          {(item as any).amenities.map((a: string, i: number) => (
            <View key={i} style={styles.amenityPill}>
              <Text style={styles.amenityText}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Contact row */}
      <View style={styles.hostContactRow}>
        {(item as any).phone ? (
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${(item as any).phone}`)}>
            <Ionicons name="call" size={14} color={colors.green} />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {(item as any).email ? (
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`mailto:${(item as any).email}`)}>
            <Ionicons name="mail" size={14} color={colors.amber} />
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.contactBtn} onPress={() => onFocus(item)}>
          <Ionicons name="navigate" size={14} color={colors.ink2} />
          <Text style={styles.contactBtnText}>Focus</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const HostCard = React.memo(HostCardInner);

const styles = StyleSheet.create({
  hostCard: {
    width: HOST_CARD_WIDTH,
    maxHeight: Math.round(height * 0.28),
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    ...shadows.lg,
  },
  hostCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hostTypeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  hostTypeBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
  },
  hostCardDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amber,
    flex: 1,
  },
  hostCardIndex: {
    fontSize: 10,
    color: colors.ink3,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hostCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    flex: 1,
  },
  hostCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  hostCardDetail: {
    fontSize: 12,
    color: colors.ink2,
    flex: 1,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  trustBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  amenityPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  amenityText: {
    fontSize: 10,
    color: colors.ink2,
    fontWeight: '500',
  },
  hostContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink2,
  },
});
