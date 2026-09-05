import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { EdgeCard } from '../../components/EdgeCard';
import { Text } from '../../components/ui';
import { getPredictions } from '../../lib/supabase';
import { MarketType, Prediction, Sport } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

export default function FeedScreen() {
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

  // Filter by market if selected
  const filteredPredictions = predictions.filter((p) => {
    if (selectedMarket === 'all') return true;
    return p.market_type === selectedMarket;
  });

  const sportsOptions: { label: string; value: Sport | 'all' }[] = [
    { label: 'All Slates', value: 'all' },
    { label: 'Basketball 🏀', value: 'basketball' },
    { label: 'Football ⚽', value: 'football' },
  ];

  const marketOptions: { label: string; value: MarketType | 'all' }[] = [
    { label: 'All Markets', value: 'all' },
    { label: 'Points', value: 'player_points' },
    { label: 'Assists', value: 'player_assists' },
    { label: 'PRA Combo', value: 'pra_combo' },
    { label: 'Match Totals', value: 'match_total' },
    { label: 'BTTS', value: 'btts' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      {/* Top Filter Bar: Sport Selector */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: tokens.colors.border }}>
        {sportsOptions.map((opt) => {
          const active = selectedSport === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: tokens.radius.lg,
                backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surface,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: active ? tokens.colors.primary : tokens.colors.border,
              }}
              onPress={() => setSport(opt.value)}
              activeOpacity={0.8}
            >
              <Text variant="title" tone={active ? 'brand' : 'secondary'} style={{ fontSize: 12 }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sub-Filter: Market Types */}
      <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: tokens.colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {marketOptions.map((m) => {
            const active = selectedMarket === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: tokens.radius.full,
                  backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surface,
                  borderWidth: 1,
                  borderColor: active ? tokens.colors.primary : tokens.colors.border,
                }}
                onPress={() => setMarket(m.value)}
                activeOpacity={0.8}
              >
                <Text variant="label" tone={active ? 'brand' : 'secondary'}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Live Market Alert Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: tokens.colors.primarySoft,
          borderWidth: 1,
          borderColor: tokens.colors.primary,
          marginHorizontal: 16,
          marginVertical: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: tokens.radius.lg,
          gap: 8,
        }}
      >
        <Sparkles size={14} color={tokens.colors.primary} />
        <Text variant="title" tone="brand" style={{ flex: 1, fontSize: 11 }}>
          {filteredPredictions.length} +EV Discrepancies Detected Across Active Boards
        </Text>
      </View>

      {/* Main Predictions Feed */}
      <FlatList
        data={filteredPredictions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EdgeCard prediction={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
