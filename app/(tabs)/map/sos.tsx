import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/lib/theme';
import { showAlert } from '../../../src/lib/alert';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKCard } from '../../../src/components/ui/WKCard';
import { WKButton } from '../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

interface Emergency {
  type: string;
  number: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const EMERGENCIES: Record<string, Emergency> = {
  police: {
    type: 'police',
    number: '112',
    name: 'Police',
    description: 'For crime, accidents, and emergencies',
    icon: 'shield-outline',
    color: colors.blue,
  },
  hospital: {
    type: 'hospital',
    number: '112',
    name: 'Emergency Medical',
    description: 'For medical emergencies and accidents',
    icon: 'medical-outline',
    color: colors.red,
  },
  mountain: {
    type: 'mountain',
    number: '1-800-RESCUE',
    name: 'Mountain Rescue',
    description: 'For trail emergencies and mountain rescue',
    icon: 'alert-circle-outline',
    color: colors.tramp,
  },
};

export default function SOS() {
  const { user, isLoading } = useAuthGuard();
  const [userCountry, setUserCountry] = useState('ES'); // Default to Spain

  if (isLoading) return null;

  const handleCall = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber) {
      Linking.openURL(`tel:${cleanNumber}`).catch(() => {
        showAlert('Error', 'Cannot make calls on this device');
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Emergency SOS" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Warning Banner */}
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={24} color={colors.red} />
            <Text style={styles.warningText}>
              In life-threatening situations, call emergency services immediately
            </Text>
          </View>

          {/* Emergency Numbers */}
          <Text style={styles.sectionTitle}>Emergency Services</Text>
          <View style={styles.emergencyGrid}>
            {Object.values(EMERGENCIES).map((emergency) => (
              <TouchableOpacity
                key={emergency.type}
                style={styles.emergencyCard}
                onPress={() => handleCall(emergency.number)}
                activeOpacity={0.8}
              >
                <View style={[styles.emergencyIconContainer, { backgroundColor: `${emergency.color}15` }]}>
                  <Ionicons name={emergency.icon as any} size={32} color={emergency.color} />
                </View>
                <Text style={styles.emergencyName}>{emergency.name}</Text>
                <Text style={[styles.emergencyNumber, { color: emergency.color }]}>
                  {emergency.number}
                </Text>
                <Text style={styles.emergencyDescription}>{emergency.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nearby Resources */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Nearby Resources</Text>
            <View style={styles.resourcesList}>
              <ResourceItem
                icon="hospital-box"
                title="Nearest Hospital"
                description="Not detected. Scan QR code to update location"
                color={colors.red}
              />
              <ResourceItem
                icon="home"
                title="Nearest Host (Safe Haven)"
                description="Contact your current host or look for nearby accommodation"
                color={colors.amber}
              />
              <ResourceItem
                icon="people"
                title="Nearby Wanderkinder"
                description="Connect with other travelers for support and assistance"
                color={colors.blue}
              />
            </View>
          </WKCard>

          {/* Safety Tips */}
          <WKCard>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            <View style={styles.tipsList}>
              <TipItem text="Stay calm and think clearly before taking action" />
              <TipItem text="If lost, stay in place and wait for rescue" />
              <TipItem text="Share your location with trusted contacts" />
              <TipItem text="Always carry water and basic first aid supplies" />
              <TipItem text="Keep phone charged and know the local language for emergencies" />
              <TipItem text="Mark your trail progress with the Wanderkind app" />
            </View>
          </WKCard>

          {/* Health Info */}
          <WKCard variant="gold">
            <Text style={styles.sectionTitle}>Your Health Profile</Text>
            <View style={styles.healthInfo}>
              <HealthInfoRow
                icon="information-circle"
                label="Blood Type"
                value="Not Set"
              />
              <HealthInfoRow
                icon="warning"
                label="Allergies"
                value="Not Set"
              />
              <HealthInfoRow
                icon="medical"
                label="Emergency Contact"
                value="Not Set"
              />
            </View>
            <WKButton
              title="Update Health Info"
              onPress={() => {
                // Navigate to profile health settings
              }}
              variant="secondary"
              fullWidth
              style={styles.updateButton}
            />
          </WKCard>

          {/* Helpful Links */}
          <WKCard>
            <Text style={styles.sectionTitle}>Helpful Links</Text>
            <View style={styles.linksList}>
              <LinkItem title="Traveler's Health Guidelines" />
              <LinkItem title="Blister & Injury Treatment" />
              <LinkItem title="Mental Health Support" />
              <LinkItem title="Find Nearby Pharmacies" />
            </View>
          </WKCard>

          {/* Insurance Info */}
          <WKCard variant="parchment">
            <Text style={styles.sectionTitle}>Travel Insurance</Text>
            <Text style={styles.insuranceText}>
              Consider purchasing travel or hiking insurance that covers medical emergencies and rescue operations in your region.
            </Text>
            <WKButton
              title="Learn More About Insurance"
              onPress={() => {
                // Navigate to insurance info
              }}
              variant="ghost"
              fullWidth
              style={styles.insuranceButton}
            />
          </WKCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceItem({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View style={styles.resourceItem}>
      <View style={[styles.resourceIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.resourceContent}>
        <Text style={styles.resourceTitle}>{title}</Text>
        <Text style={styles.resourceDescription}>{description}</Text>
      </View>
    </View>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipItem}>
      <Ionicons name="checkmark-circle" size={16} color={colors.green} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function HealthInfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.healthRow}>
      <Ionicons name={icon as any} size={16} color={colors.amber} />
      <View style={styles.healthContent}>
        <Text style={styles.healthLabel}>{label}</Text>
        <Text style={styles.healthValue}>{value}</Text>
      </View>
    </View>
  );
}

function LinkItem({ title }: { title: string }) {
  return (
    <TouchableOpacity style={styles.linkItem}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Ionicons name="open" size={14} color={colors.ink3} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.redBg,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    marginBottom: spacing.md,
  },
  warningText: {
    ...typography.bodySm,
    color: colors.red,
    flex: 1,
    fontWeight: '500',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  emergencyGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  emergencyCard: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emergencyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emergencyName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emergencyNumber: {
    fontFamily: 'Courier New',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emergencyDescription: {
    ...typography.caption,
    color: colors.ink2,
    textAlign: 'center',
  },
  resourcesList: {
    gap: spacing.md,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  resourceDescription: {
    ...typography.bodySm,
    color: colors.ink2,
  },
  tipsList: {
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    paddingTop: 2,
  },
  healthInfo: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,118,42,0.1)',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  healthContent: {
    flex: 1,
  },
  healthLabel: {
    ...typography.caption,
    color: colors.ink3,
  },
  healthValue: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
  updateButton: {
    marginTop: 0,
  },
  linksList: {
    gap: spacing.md,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  linkTitle: {
    ...typography.body,
    color: colors.amber,
    fontWeight: '500',
  },
  insuranceText: {
    ...typography.bodySm,
    color: colors.parchmentInk,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  insuranceButton: {
    marginTop: 0,
  },
});
