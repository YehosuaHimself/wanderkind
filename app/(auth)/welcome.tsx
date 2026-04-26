import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKButton } from '../../src/components/ui/WKButton';
import { colors, typography, spacing } from '../../src/lib/theme';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ hosts: 505, routes: 26, countries: 10 });

  useEffect(() => {
    // Fetch live stats from Supabase
    const fetchStats = async () => {
      try {
        const [hostsRes, routesRes] = await Promise.all([
          supabase.from('hosts').select('id', { count: 'exact', head: true }),
          supabase.from('routes').select('id', { count: 'exact', head: true }),
        ]);
        const hostCount = hostsRes.count ?? 505;
        const routeCount = routesRes.count ?? 26;
        // Estimate countries from host data
        const { data: countryData } = await supabase
          .from('hosts')
          .select('country')
          .not('country', 'is', null);
        const uniqueCountries = new Set((countryData ?? []).map((h: any) => h.country));
        setStats({
          hosts: hostCount,
          routes: routeCount,
          countries: uniqueCountries.size || 10,
        });
      } catch {
        // Keep defaults on error
      }
    };
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Dust particles effect */}
      <View style={styles.dustOverlay} />

      <View style={styles.content}>
        {/* Eyebrow */}
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrowText}>EST. MMXXVI</Text>
        </View>

        {/* Logo mark */}
        <View style={styles.logoContainer} accessible accessibilityLabel="Wanderkind logo" accessibilityRole="image">
          <Text style={styles.logoW}>W</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} accessibilityRole="header">WANDERKIND</Text>
        <Text style={styles.subtitle}>Free shelter across Europe.{'\n'}Your pass. Open your door.</Text>

        {/* Stats row — dynamic from Supabase */}
        <View style={styles.statsRow} accessibilityLabel={`${stats.hosts} hosts, ${stats.routes} routes, ${stats.countries} countries`}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.hosts}</Text>
            <Text style={styles.statLabel}>HOSTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.routes}</Text>
            <Text style={styles.statLabel}>ROUTES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.countries}</Text>
            <Text style={styles.statLabel}>COUNTRIES</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <WKButton
          title="Begin Your Way"
          onPress={() => router.push('/(auth)/role-select')}
          variant="primary"
          size="lg"
          fullWidth
        />
        <WKButton
          title="I Already Have a Pass"
          onPress={() => router.push('/(auth)/signin')}
          variant="outline"
          size="md"
          fullWidth
        />

        <Text style={styles.footer} accessibilityRole="text">
          Every Wanderkind is a host.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  dustOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  eyebrowLine: {
    width: 32,
    height: 1,
    backgroundColor: colors.amber,
  },
  eyebrowText: {
    fontFamily: 'Courier New',
    fontSize: 11,
    letterSpacing: 4,
    color: colors.ink3,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoW: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.amber,
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ink3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 12,
  },
  footer: {
    ...typography.caption,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: 8,
  },
});
