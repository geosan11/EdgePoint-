import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Activity, Flame, Radio, Zap } from 'lucide-react-native';
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

  const filterOptions: { label: string; count: number; value: FilterType }[] = [
    { label: 'ALL SLATES', count: fixtures.length, value: 'all' },
    { label: 'LIVE IN-PLAY', count: fixtures.filter((f) => f.status === 'live').length, value: 'live' },
    { label: 'NBA', count: fixtures.filter((f) => f.league === 'NBA').length, value: 'nba' },
    { label: 'PREMIER LEAGUE', count: fixtures.filter((f) => f.league === 'Premier League').length, value: 'epl' },
  ];

  const liveCount = fixtures.filter((f) => f.status === 'live').length;
  const edgeCount = fixtures.filter((f) => !!f.modelEdge).length;

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.background }]}>
      {/* 1. Terminal Scanner Header Bar */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: tokens.colors.surfaceInset, borderBottomColor: tokens.colors.border },
        ]}
      >
        <View style={styles.statusLeft}>
          <View style={styles.pulseDot} />
          <Text variant="label" tone="brand" style={{ letterSpacing: 0.8 }}>
            QUANT SCANNER ACTIVE
          </Text>
          <Text variant="label" tone="tertiary">
            · 14 BOOKS
          </Text>
        </View>

        <View style={styles.statusRight}>
          <View style={[styles.badgePill, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}>
            <Zap size={10} color={tokens.colors.primary} />
            <Text variant="badge" tone="brand">
              {edgeCount} +EV FOUND
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Sleek High-Density Filter Rail */}
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
                <Text
                  variant="label"
                  tone={active ? 'brand' : 'secondary'}
                  style={{ fontWeight: active ? '800' : '600' }}
                >
                  {opt.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: active ? tokens.colors.primary : tokens.colors.surfaceInset,
                    },
                  ]}
                >
                  <Text
                    variant="badge"
                    style={{
                      color: active ? tokens.colors.onPrimary : tokens.colors.textTertiary,
                      fontSize: 9,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {opt.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Fixtures List */}
      <FlatList
        data={filteredFixtures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
            <Radio size={28} color={tokens.colors.textTertiary} />
            <Text variant="title" tone="secondary" style={{ marginTop: 12, marginBottom: 4 }}>
              No Fixtures in Selected Filter
            </Text>
            <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', marginBottom: 14 }}>
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E599',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 96,
  },
  emptyContainer: {
    margin: 16,
    padding: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
});
