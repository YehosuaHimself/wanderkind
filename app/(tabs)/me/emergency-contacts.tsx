import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyContactsScreen() {
  useAuthGuard();

  const { profile, user, fetchProfile } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.emergency_contacts) {
      setContacts(profile.emergency_contacts);
    }
  }, [profile]);

  const updateContact = (index: number, field: string, value: string) => {
    const updated = [...contacts];
    if (updated[index]) {
      (updated[index] as any)[field] = value;
      setContacts(updated);
    }
  };

  const addContact = () => {
    if (contacts.length < 3) {
      setContacts([...contacts, { id: Date.now(), name: '', phone: '', relationship: '' }]);
    }
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      if (!user) throw new Error('No user');

      const { error: updateError } = await supabase.from('profiles').update({
        emergency_contacts: contacts,
      }).eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Emergency Contacts" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
            <Text style={styles.successText}>Contacts saved!</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          Add up to 3 emergency contacts who can be reached if needed
        </Text>

        {contacts.map((contact, idx) => (
          <WKCard key={contact.id} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactNumber}>Contact {idx + 1}</Text>
              {contacts.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeContact(idx)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color={colors.red} />
                </TouchableOpacity>
              )}
            </View>

            <WKInput
              label="Name"
              value={contact.name}
              onChangeText={val => updateContact(idx, 'name', val)}
              placeholder="Full name"
              style={styles.input}
            />

            <WKInput
              label="Phone"
              value={contact.phone}
              onChangeText={val => updateContact(idx, 'phone', val)}
              placeholder="+1 (555) 000-0000"
              style={styles.input}
            />

            <WKInput
              label="Relationship"
              value={contact.relationship}
              onChangeText={val => updateContact(idx, 'relationship', val)}
              placeholder="e.g., Mother, Sister, Friend"
              style={styles.input}
            />
          </WKCard>
        ))}

        {contacts.length < 3 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={addContact}
          >
            <Ionicons name="add" size={24} color={colors.amber} />
            <Text style={styles.addButtonText}>Add Contact</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.amber} />
          <Text style={styles.infoText}>
            These contacts will only be used in case of emergency. We take your privacy seriously.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <WKButton
          title="Save Contacts"
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
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  contactCard: {
    marginBottom: spacing.lg,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  contactNumber: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.redBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 0,
  },
  addButton: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  addButtonText: {
    ...typography.body,
    color: colors.amber,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySm,
    color: colors.ink2,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
