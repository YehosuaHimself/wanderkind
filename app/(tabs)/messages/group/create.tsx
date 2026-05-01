import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../../src/lib/theme';
import { showAlert } from '../../../../src/lib/alert';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/stores/auth';
import { Profile } from '../../../../src/types/database';
import { useAuthGuard } from '../../../../src/hooks/useAuthGuard';

// Helper function to escape SQL wildcards in ILIKE queries
function escapeIlike(input: string): string {
  return input.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export default function CreateGroupChat() {
  useAuthGuard();

  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce search by 300ms
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const escapedQuery = escapeIlike(query);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('trail_name', `%${escapedQuery}%`)
          .neq('id', user?.id || '')
          .limit(10);

        if (error) throw error;
        setSearchResults((data || []) as Profile[]);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const toggleMember = (profile: Profile) => {
    const isSelected = selectedMembers.some(m => m.id === profile.id);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== profile.id));
    } else {
      setSelectedMembers([...selectedMembers, profile]);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedMembers.length === 0) {
      showAlert('Missing information', 'Please enter a group name and select at least one member.');
      return;
    }

    setCreating(true);
    try {
      const participantIds = [user.id, ...selectedMembers.map(m => m.id)].sort();

      const { data, error } = await supabase
        .from('group_threads')
        .insert({
          name: groupName.trim(),
          participant_ids: participantIds,
        })
        .select('id')
        .single();

      if (error) throw error;

      router.replace(`/(tabs)/messages/group/${data.id}`);
    } catch (err) {
      console.error('Create group failed:', err);
      showAlert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderSearchResult = ({ item }: { item: Profile }) => {
    const isSelected = selectedMembers.some(m => m.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.userCardSelected]}
        onPress={() => toggleMember(item)}
      >
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={18} color={colors.ink3} />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.trail_name}</Text>
          <Text style={styles.userTier}>{item.tier?.toUpperCase() || 'WALKER'}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={colors.surface} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedMember = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.memberTag}
      onPress={() => toggleMember(item)}
    >
      <Text style={styles.memberTagText}>{item.trail_name}</Text>
      <Ionicons name="close" size={14} color={colors.ink} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Santiago Walkers 2024"
            placeholderTextColor={colors.ink3}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
          <Text style={styles.charCount}>{groupName.length} / 50</Text>
        </View>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Members ({selectedMembers.length})</Text>
            <FlatList
              data={selectedMembers}
              renderItem={renderSelectedMember}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={styles.memberGrid}
            />
          </View>
        )}

        {/* Add Members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add Members</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for wanderkinder..."
            placeholderTextColor={colors.ink3}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.amber} />
            </View>
          )}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              style={styles.searchResults}
            />
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No wanderkinder found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={creating}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.createBtn,
            (!groupName.trim() || selectedMembers.length === 0) && styles.createBtnDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={creating || !groupName.trim() || selectedMembers.length === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Ionicons name="add" size={16} color={colors.surface} />
              <Text style={styles.createBtnText}>Create Group</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  headerTitle: { ...typography.h3, color: colors.ink },
  headerSpacer: { width: 28 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  section: { marginTop: spacing.xl, marginBottom: spacing.lg },
  sectionLabel: { ...typography.bodySm, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
  },
  charCount: { ...typography.caption, color: colors.ink3, marginTop: 6, textAlign: 'right' },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
  },
  loadingContainer: { paddingVertical: spacing.lg, alignItems: 'center' },
  searchResults: { marginTop: spacing.md },
  emptySearch: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptySearchText: { ...typography.bodySm, color: colors.ink3 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: 8,
  },
  userCardSelected: { backgroundColor: colors.goldBg, borderColor: colors.gold },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: { width: '100%', height: '100%' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  userTier: { fontSize: 10, letterSpacing: 2, color: colors.amber, marginTop: 2 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: colors.green, borderColor: colors.green },
  memberGrid: { justifyContent: 'space-between', marginBottom: spacing.md },
  memberTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.goldBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  memberTagText: { fontSize: 12, fontWeight: '600', color: colors.gold, flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  createBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { fontSize: 15, fontWeight: '600', color: colors.surface },
});
