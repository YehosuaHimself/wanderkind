import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';

/**
 * WP-G: B2B Analytics — Org Login Gate
 *
 * Organizations (hosts, trail partners, tourism boards) log in
 * with dedicated org credentials to access the analytics dashboard.
 * For now, a demo code ("wanderkind2026") grants access.
 */

// Demo org codes — in production this would be server-validated
const VALID_ORG_CODES: Record<string, { name: string; role: string }> = {
  'wanderkind2026': { name: 'Wanderkind Admin', role: 'admin' },
  'camino2026': { name: 'Camino Association', role: 'partner' },
  'demo': { name: 'Demo Organization', role: 'viewer' },
};

export default function OrgLoginScreen() {
  const router = useRouter();
  const [orgCode, setOrgCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!orgCode.trim()) {
      setError('Please enter your organization code');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const org = VALID_ORG_CODES[orgCode.trim().toLowerCase()];
    if (org) {
      toast.success(`Welcome, ${org.name}`);
      router.push('/(tabs)/more/analytics' as any);
    } else {
      setError('Invalid organization code. Contact support@wanderkind.travel for access.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>ORGANIZATIONS</Text>
          <Text style={styles.headerTitle}>Org Login</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo / Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="business" size={36} color="#6B21A8" />
          </View>
          <Text style={styles.brandTitle}>Partner Dashboard</Text>
          <Text style={styles.brandDesc}>
            Access analytics, walker traffic insights, and community engagement data for your organization.
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>ORGANIZATION CODE</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Enter your org code"
            placeholderTextColor={colors.ink3}
            value={orgCode}
            onChangeText={(t) => { setOrgCode(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>Access Dashboard</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="analytics-outline" size={18} color={colors.amber} />
            <Text style={styles.infoText}>View walker traffic and seasonal trends</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={18} color={colors.amber} />
            <Text style={styles.infoText}>Community engagement metrics</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="download-outline" size={18} color={colors.amber} />
            <Text style={styles.infoText}>Export data as CSV for reporting</Text>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={16} color={colors.ink3} />
          <Text style={styles.contactText}>
            Need access? Contact support@wanderkind.travel
          </Text>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 3,
    color: '#6B21A8',
    fontWeight: '600',
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  scrollContent: { padding: spacing.lg },

  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(107,33,168,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  brandDesc: {
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 24,
  },
  formLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.ink3,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 8,
  },
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    fontSize: 12,
    color: colors.red,
    marginBottom: 8,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6B21A8',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: colors.ink2,
    flex: 1,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
  },
  contactText: {
    fontSize: 12,
    color: colors.ink3,
    flex: 1,
  },
});
