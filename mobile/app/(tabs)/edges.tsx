import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Sparkles, TrendingUp } from 'lucide-react-native';
import { EdgeCard } from '../../components/EdgeCard';
import { Text } from '../../components/ui';
import { getPredictions } from '../../lib/supabase';
import { MarketType, Prediction, Sport } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

export default function EdgesScreen() {
  const { selectedSport, setSport, selectedMarket, setMarket } = useBetStore();
  const { tokens } = useTheme();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getPredictions(selectedSport);
    setPredictions(data);
  };

  useEffect(() => {
    loadData();
  }, [selectedSport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredPredictions = predictions.filter((p) => {
    if (selectedMarket === 'all') return true;
    return p.market_type === selectedMarket;
  });

  const sportsOptions: { label: string; value: Sport | 'all' }[] = [
    { label: 'All Slates', value: 'all' },
    { label: 'NBA 🏀', value: 'basketball' },
    { label: 'Premier League ⚽', value: 'football' },
  ];

  const marketOptions: { label: string; value: MarketType | 'all' }[] =
    selectedSport === 'football'
      ? [
          { label: 'All Markets', value: 'all' },
          { label: 'Match Totals', value: 'match_total' },
          { label: 'BTTS', value: 'btts' },
          { label: 'Shots on Target', value: 'shots_on_target' },
        ]
      : selectedSport === 'basketball'
        ? [
            { label: 'All Markets', value: 'all' },
            { label: 'Points (PTS)', value: 'player_points' },
            { label: 'Assists (AST)', value: 'player_assists' },
            { label: 'Rebounds (REB)', value: 'player_rebounds' },
            { label: 'PRA Combo', value: 'pra_combo' },
          ]
        : [
            { label: 'All Markets', value: 'all' },
            { label: 'Points', value: 'player_points' },
            { label: 'Match Totals', value: 'match_total' },
            { label: 'BTTS', value: 'btts' },
            { label: 'PRA Combo', value: 'pra_combo' },
            { label: 'Shots on Target', value: 'shots_on_target' },
          ];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.background }]}>
      {/* Top Filter Bar: Sport Selector */}
      <View style={[styles.sportBar, { borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surfaceInset }]}>
        {sportsOptions.map((opt) => {
          const active = selectedSport === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sportTab,
                {
                  backgroundColor: active ? tokens.colors.surface : 'transparent',
                  borderColor: active ? tokens.colors.primary : 'transparent',
                },
              ]}
              onPress={() => setSport(opt.value)}
              activeOpacity={0.7}
            >
              <Text
                variant="label"
                tone={active ? 'brand' : 'secondary'}
                style={{ fontWeight: active ? '800' : '600', letterSpacing: 0.6 }}
              >
                {opt.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sub-Filter: Market Types */}
      <View style={[styles.marketBar, { borderBottomColor: tokens.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.marketScroll}
        >
          {marketOptions.map((m) => {
            const active = selectedMarket === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.marketChip,
                  {
                    backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surface,
                    borderColor: active ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => setMarket(m.value)}
                activeOpacity={0.7}
              >
                <Text
                  variant="label"
                  tone={active ? 'brand' : 'secondary'}
                  style={{ fontWeight: active ? '800' : '600' }}
                >
                  {m.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Live Discrepancy Terminal Banner */}
      <View
        style={[
          styles.alertBanner,
          { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
        ]}
      >
        <View style={styles.alertLeft}>
          <Sparkles size={13} color={tokens.colors.primary} />
          <Text variant="label" tone="brand" style={{ letterSpacing: 0.6 }}>
            {filteredPredictions.length} ARBITRAGE & +EV EDGES
          </Text>
        </View>
        <Text variant="label" tone="tertiary">
          BENCHMARK: PINNACLE NO-VIG
        </Text>
      </View>

      {/* Predictions Feed */}
      <FlatList
        data={filteredPredictions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EdgeCard prediction={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Sparkles size={32} color={tokens.colors.borderStrong} />
            <Text variant="title" tone="secondary" style={{ marginTop: 10, marginBottom: 4 }}>
              No Picks in Selected Market
            </Text>
            <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', marginBottom: 12 }}>
              No current +EV predictions match your active sport or market filters.
            </Text>
            <TouchableOpacity
              style={[styles.emptyResetBtn, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}
              onPress={() => {
                setSport('all');
                setMarket('all');
              }}
              activeOpacity={0.7}
            >
              <Text variant="badge" tone="brand">
                Reset All Filters
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
  sportBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  sportTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
  },
  marketBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  marketScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  marketChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertText: {
    fontSize: 11,
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
