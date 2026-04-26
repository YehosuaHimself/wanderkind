import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

const DAYS_IN_MONTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock booked dates: [day1, day15, day20] for each month
const BOOKED_DATES: Record<number, number[]> = {
  0: [8, 15, 20],
  1: [5, 18, 25],
  2: [12, 22],
  3: [3, 10, 17, 24],
  4: [1, 14, 21, 28],
  5: [5, 12, 19],
};

function CalendarMonth({ monthIndex }: { monthIndex: number }) {
  const daysInMonth = DAYS_IN_MONTHS[monthIndex];
  const firstDay = new Date(2024, monthIndex, 1).getDay();
  const bookedDates = BOOKED_DATES[monthIndex] || [];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <WKCard style={styles.monthCard}>
      <Text style={styles.monthTitle}>{MONTH_NAMES[monthIndex]} 2024</Text>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {DAY_NAMES.map((day) => (
          <Text key={day} style={styles.dayHeader}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, idx) => {
          const isBooked = day && bookedDates.includes(day);
          return (
            <View key={idx} style={styles.dayCell}>
              {day ? (
                <View
                  style={[
                    styles.dayButton,
                    !!isBooked && styles.dayButtonBooked,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !!isBooked && styles.dayTextBooked,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </WKCard>
  );
}

export default function CalendarScreen() {
  const { user, isLoading } = useAuthGuard();
  if (isLoading) return null;

  const [selectedMonth, setSelectedMonth] = useState(4); // May

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Availability Calendar" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Legend */}
          <WKCard style={styles.legendCard}>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, styles.availableBox]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, styles.bookedBox]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </WKCard>

          {/* Calendar Months */}
          {MONTH_NAMES.map((_, idx) => (
            <CalendarMonth key={idx} monthIndex={idx} />
          ))}

          {/* Summary Card */}
          <WKCard variant="parchment">
            <View style={styles.summaryHeader}>
              <Ionicons name="calendar" size={20} color={colors.ink2} />
              <Text style={styles.summaryTitle}>Booking Overview</Text>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Days Booked</Text>
                <Text style={styles.summaryStatValue}>16</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Available Days</Text>
                <Text style={styles.summaryStatValue}>160</Text>
              </View>
            </View>
          </WKCard>

          {/* Manage Availability */}
          <WKCard variant="gold">
            <View style={styles.manageHeader}>
              <Ionicons name="settings" size={20} color={colors.amber} />
              <Text style={styles.manageTitle}>Manage Availability</Text>
            </View>
            <Text style={styles.manageText}>
              Manually mark dates as available or unavailable. Edit your listing to toggle overall availability.
            </Text>
          </WKCard>
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
  legendCard: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: radii.md,
  },
  availableBox: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookedBox: {
    backgroundColor: colors.amber,
  },
  legendText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  monthCard: {
    gap: spacing.md,
  },
  monthTitle: {
    ...typography.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayHeader: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    width: '100%',
    height: '100%',
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  dayButtonBooked: {
    backgroundColor: colors.amber,
  },
  dayText: {
    ...typography.bodySm,
    color: colors.ink2,
    fontWeight: '500',
  },
  dayTextBooked: {
    color: colors.surface,
    fontWeight: '600',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStat: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  summaryStatLabel: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  summaryStatValue: {
    ...typography.h2,
    color: colors.ink,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  manageTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  manageText: {
    ...typography.bodySm,
    color: colors.ink,
    lineHeight: 20,
  },
});
