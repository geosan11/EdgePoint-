import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Info, Radio } from 'lucide-react-native';
import { SteamCard } from '../../components/SteamCard';
import { Text } from '../../components/ui';
import { getLineMovements } from '../../lib/supabase';
import { LineMovement } from '../../lib/types';
import { useTheme } from '../../stores/useThemeStore';

export default function RadarScreen() {
  const { tokens } = useTheme();
  const [movements, setMovements] = useState<LineMovement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getLineMovements();
    setMovements(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      {/* Top Header & Radar Status */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Radio size={16} color={tokens.colors.secondary} />
          <Text variant="label" tone="info" style={{ letterSpacing: 1 }}>
            RADAR SCANNING 14 SPORTSBOOKS
          </Text>
        </View>
        <Text variant="title">Real-time sharp steam and retail line divergence tracking</Text>
      </View>

      {/* Educational Strategy Callout */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: tokens.colors.secondarySoft,
          borderWidth: 1,
          borderColor: tokens.colors.secondary,
          borderRadius: tokens.radius.xl,
          marginHorizontal: 16,
          marginVertical: 10,
          padding: 10,
          gap: 8,
        }}
      >
        <Info size={16} color={tokens.colors.secondary} style={{ marginTop: 2 }} />
        <Text variant="bodySm" tone="secondary" style={{ flex: 1 }}>
          <Text variant="bodySm" tone="info" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
            Sharp Steam Advantage:{' '}
          </Text>
          When sharp market makers (Pinnacle) move lines aggressively, retail books often lag by 5–25 minutes. Bet
          the lagging line before they adjust.
        </Text>
      </View>

      {/* Line Movement Alert Stream */}
      <FlatList
        data={movements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SteamCard movement={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.secondary}
            colors={[tokens.colors.secondary]}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
