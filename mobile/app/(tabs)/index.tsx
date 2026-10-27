import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Activity, Flame, Radio } from 'lucide-react-native';
import { MatchCard, Text } from '../../components/ui';
import { getFixtures } from '../../lib/supabase';
import { MatchFixture, Sport } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

type FilterType = 'all' | 'nba' | 'epl' | 'live';

export default function FixturesScreen() {
  const { tokens } = useTheme();
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getFixtures();
    setFixtures(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredFixtures = fixtures.filter((f) => {
    if (filter === 'all') return true;
    if (filter === 'live') return f.status === 'live';
    if (filter === 'nba') return f.league === 'NBA';
    if (filter === 'epl') return f.league === 'Premier League';
    return true;
  });

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All Slates', value: 'all' },
    { label: 'Live In-Play', value: 'live' },
    { label: 'NBA 🏀', value: 'nba' },
    { label: 'Premier League ⚽', value: 'epl' },
  ];

  const liveCount = fixtures.filter((f) => f.status === 'live').length;
  const edgeCount = fixtures.filter((f) => !!f.modelEdge).length;

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.background }]}>
      {/* Top Filter Chips */}
      <View style={[styles.filterBar, { borderBottomColor: tokens.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map((opt) => {
            const active = filter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surface,
                    borderColor: active ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => setFilter(opt.value)}
                activeOpacity={0.7}
              >
                <Text variant="title" tone={active ? 'brand' : 'secondary'} style={styles.chipText}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Terminal Status Ribbon */}
      <View
        style={[
          styles.statusRibbon,
          { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
        ]}
      >
        <View style={styles.ribbonItem}>
          <Radio size={13} color={tokens.colors.primary} />
          <Text variant="badge" tone="brand">
            {liveCount} LIVE IN-PLAY
          </Text>
        </View>

        <View style={styles.ribbonItem}>
          <Flame size={13} color={tokens.colors.tertiary} />
          <Text variant="badge" tone="secondary">
            {edgeCount} +EV EDGES DETECTED
          </Text>
        </View>
      </View>

      {/* Fixtures List */}
      <FlatList
        data={filteredFixtures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Radio size={32} color={tokens.colors.borderStrong} />
            <Text variant="title" tone="secondary" style={{ marginTop: 10, marginBottom: 4 }}>
              No Fixtures in Selected Filter
            </Text>
            <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', marginBottom: 12 }}>
              There are currently no active matches matching this filter. Switch to all slates to view upcoming games.
            </Text>
            <TouchableOpacity
              style={[styles.emptyResetBtn, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text variant="badge" tone="brand">
                View All Slates
              </Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  statusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ribbonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listContainer: {
    paddingTop: 4,
    paddingBottom: 96,
  },
  emptyContainer: {
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
