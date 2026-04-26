import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { supabase } from '../../../src/lib/supabase';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

interface AnalyticsData {
  totalHosts: number;
  freeHosts: number;
  donativoHosts: number;
  budgetHosts: number;
  paidHosts: number;
  totalWalkers: number;
  activeWalkers: number;
  totalStamps: number;
  hostsByCountry: { country: string; count: number }[];
  topHosts: { name: string; total_hosted: number }[];
}

const EMPTY_DATA: AnalyticsData = {
  totalHosts: 0,
  freeHosts: 0,
  donativoHosts: 0,
  budgetHosts: 0,
  paidHosts: 0,
  totalWalkers: 0,
  activeWalkers: 0,
  totalStamps: 0,
  hostsByCountry: [],
  topHosts: [],
};

export default function AnalyticsPage() {
  useAuthGuard();
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch hosts data
      const { data: hosts } = await supabase
        .from('hosts')
        .select('id, host_type, country, name, total_hosted, is_available')
        .eq('is_available', true);

      // Fetch profiles data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, is_walking')
        .limit(1000);

      // Fetch stamps count
      const { count: stampCount } = await supabase
        .from('stamps')
        .select('*', { count: 'exact', head: true });

      const hostList = hosts || [];
      const profileList = profiles || [];

      // Host type breakdown
      const freeHosts = hostList.filter(h => h.host_type === 'free').length;
      const donativoHosts = hostList.filter(h => h.host_type === 'donativo').length;
      const budgetHosts = hostList.filter(h => h.host_type === 'budget').length;
      const paidHosts = hostList.filter(h => h.host_type === 'paid').length;

      // Country breakdown
      const countryMap = new Map<string, number>();
      hostList.forEach(h => {
        const country = h.country || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });
      const hostsByCountry = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top hosts by total hosted
      const topHosts = hostList
        .filter(h => h.total_hosted > 0)
        .sort((a, b) => (b.total_hosted || 0) - (a.total_hosted || 0))
        .slice(0, 5)
        .map(h => ({ name: h.name, total_hosted: h.total_hosted || 0 }));

      setData({
        totalHosts: hostList.length,
        freeHosts,
        donativoHosts,
        budgetHosts,
        paidHosts,
        totalWalkers: profileList.length,
        activeWalkers: profileList.filter(p => p.is_walking).length,
        totalStamps: stampCount || 0,
        hostsByCountry,
        topHosts,
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    const lines = [
      'Metric,Value',
      `Total Hosts,${data.totalHosts}`,
      `Free Hosts,${data.freeHosts}`,
      `Donativo Hosts,${data.donativoHosts}`,
      `Budget Hosts,${data.budgetHosts}`,
      `Paid Hosts,${data.paidHosts}`,
      `Total Walkers,${data.totalWalkers}`,
      `Active Walkers,${data.activeWalkers}`,
      `Total Stamps,${data.totalStamps}`,
      '',
      'Country,Host Count',
      ...data.hostsByCountry.map(c => `${c.country},${c.count}`),
      '',
      'Top Host,Guests Hosted',
      ...data.topHosts.map(h => `"${h.name}",${h.total_hosted}`),
    ];
    const csv = lines.join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wanderkind-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        await Share.share({
          message: csv,
          title: 'Wanderkind Analytics Export',
        });
      } catch {}
    }
  };

  const StatCard = ({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const BarRow = ({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) => (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(4, (value / maxValue) * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Analytics" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  const maxCountryCount = Math.max(...data.hostsByCountry.map(c => c.count), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Analytics" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Summary Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionLabel}>OVERVIEW</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Hosts" value={data.totalHosts} icon="home" color={colors.amber} />
          <StatCard label="Walkers" value={data.totalWalkers} icon="people" color={colors.green} />
          <StatCard label="Active Now" value={data.activeWalkers} icon="walk" color={colors.blue} />
          <StatCard label="Stamps" value={data.totalStamps} icon="ribbon" color="#C8762A" />
        </View>

        {/* Host Type Breakdown */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionLabel}>HOST TYPE BREAKDOWN</Text>
        </View>

        <View style={styles.card}>
          <BarRow label="Free" value={data.freeHosts} maxValue={data.totalHosts} color={colors.green} />
          <BarRow label="Donativo" value={data.donativoHosts} maxValue={data.totalHosts} color={colors.amber} />
          <BarRow label="Budget" value={data.budgetHosts} maxValue={data.totalHosts} color={colors.blue} />
          <BarRow label="Paid" value={data.paidHosts} maxValue={data.totalHosts} color="#9B8E7E" />
        </View>

        {/* Hosts by Country */}
        {data.hostsByCountry.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabel}>HOSTS BY COUNTRY</Text>
            </View>

            <View style={styles.card}>
              {data.hostsByCountry.map((c, i) => (
                <BarRow key={c.country} label={c.country} value={c.count} maxValue={maxCountryCount} color={colors.amber} />
              ))}
            </View>
          </>
        )}

        {/* Top Hosts */}
        {data.topHosts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabel}>TOP HOSTS</Text>
            </View>

            <View style={styles.card}>
              {data.topHosts.map((h, i) => (
                <View key={i} style={styles.topHostRow}>
                  <Text style={styles.topHostRank}>#{i + 1}</Text>
                  <Text style={styles.topHostName} numberOfLines={1}>{h.name}</Text>
                  <Text style={styles.topHostCount}>{h.total_hosted} guests</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Export */}
        <TouchableOpacity style={styles.exportBtn} onPress={exportCSV} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={18} color={colors.amber} />
          <Text style={styles.exportText}>Export as CSV</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Data updated in real-time from the Wanderkind network.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  sectionLabel: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: colors.ink2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLt,
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  statLabel: {
    fontFamily: 'Courier New',
    fontSize: 9,
    letterSpacing: 1,
    color: colors.ink3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLt,
    ...shadows.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink2,
    textAlign: 'right',
  },
  topHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  topHostRank: {
    fontFamily: 'Courier New',
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
    width: 28,
  },
  topHostName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  topHostCount: {
    fontSize: 11,
    color: colors.ink3,
    fontWeight: '500',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.amber,
  },
  footer: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});
