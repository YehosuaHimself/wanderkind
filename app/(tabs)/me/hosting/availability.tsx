import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../../src/lib/theme';
import { WKHeader } from '../../../../src/components/ui/WKHeader';
import { WKCard } from '../../../../src/components/ui/WKCard';
import { WKInput } from '../../../../src/components/ui/WKInput';
import { WKButton } from '../../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

export default function AvailabilityScreen() {
  const { user, isLoading } = useAuthGuard();
  const [isAvailable, setIsAvailable] = useState(true);
  const [notes, setNotes] = useState('Open for walkers May-September');
  if (isLoading) return null;


  const handleSave = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Availability" showBack={true} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Availability Toggle */}
          <WKCard>
            <View style={styles.toggleSection}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIcon}>
                  <Ionicons
                    name={isAvailable ? 'checkmark-circle' : 'close-circle'}
                    size={28}
                    color={isAvailable ? colors.green : colors.ink3}
                  />
                </View>
                <View>
                  <Text style={styles.toggleTitle}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {isAvailable
                      ? 'Accepting new requests'
                      : 'Not accepting requests'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: colors.border, true: colors.greenBg }}
                thumbColor={isAvailable ? colors.green : colors.ink3}
              />
            </View>
          </WKCard>

          {/* Status Message */}
          <WKCard variant="gold">
            <View style={styles.statusBox}>
              <Ionicons
                name={isAvailable ? 'information-circle' : 'warning'}
                size={24}
                color={isAvailable ? colors.amber : colors.red}
              />
              <Text style={styles.statusText}>
                {isAvailable
                  ? 'Your listing is visible to walkers and accepting requests.'
                  : 'Your listing is hidden. Walkers cannot send requests.'}
              </Text>
            </View>
          </WKCard>

          {/* Availability Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability Notes</Text>
            <Text style={styles.sectionHint}>
              Let walkers know when you're available or any special conditions
            </Text>
            <WKInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Open May-September, closed in winter..."
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Quick Unavailability Reasons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Situations</Text>
            <View style={styles.reasonsList}>
              <WKCard>
                <View style={styles.reasonItem}>
                  <Ionicons name="calendar" size={20} color={colors.amber} />
                  <Text style={styles.reasonText}>Seasonal: Open May-September</Text>
                </View>
              </WKCard>
              <WKCard>
                <View style={styles.reasonItem}>
                  <Ionicons name="home" size={20} color={colors.amber} />
                  <Text style={styles.reasonText}>Renovating this month</Text>
                </View>
              </WKCard>
              <WKCard>
                <View style={styles.reasonItem}>
                  <Ionicons name="people" size={20} color={colors.amber} />
                  <Text style={styles.reasonText}>Family visit expected</Text>
                </View>
              </WKCard>
            </View>
          </View>

          {/* Save Button */}
          <WKButton
            title="Save Availability"
            onPress={handleSave}
            fullWidth
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
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  toggleSubtitle: {
    ...typography.bodySm,
    color: colors.ink2,
    marginTop: spacing.xs,
  },
  statusBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  statusText: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    lineHeight: 22,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  sectionHint: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  reasonsList: {
    gap: spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reasonText: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  saveBtn: {
    marginBottom: spacing.lg,
  },
});
