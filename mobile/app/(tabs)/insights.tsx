import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ArrowUpRight, BarChart3, Info, Radio, Zap } from 'lucide-react-native';
import { SteamCard } from '../../components/SteamCard';
import { Badge, Card, MetricTile, Text } from '../../components/ui';
import { getInsights, getLineMovements } from '../../lib/supabase';
import { LeagueTrendInsight, LineMovement, Sport } from '../../lib/types';
import { useTheme } from '../../stores/useThemeStore';

type InsightView = 'all' | 'nba' | 'epl' | 'steam';

export default function InsightsScreen() {
  const { tokens } = useTheme();
  const [activeView, setActiveView] = useState<InsightView>('all');
  const [insights, setInsights] = useState<LeagueTrendInsight[]>([]);
  const [movements, setMovements] = useState<LineMovement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [insData, movData] = await Promise.all([getInsights(), getLineMovements()]);
    setInsights(insData);
    setMovements(movData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredInsights = insights.filter((i) => {
    if (activeView === 'all') return true;
    if (activeView === 'nba') return i.league === 'NBA';
    if (activeView === 'epl') return i.league === 'Premier League';
    return true;
  });

  const viewOptions: { label: string; value: InsightView }[] = [
    { label: 'All Trends', value: 'all' },
    { label: 'NBA Analytics 🏀', value: 'nba' },
    { label: 'EPL Analytics ⚽', value: 'epl' },
    { label: 'Sharp Steam Radar ⚡', value: 'steam' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.background }]}>
      {/* Top Filter Chips */}
      <View style={[styles.navBar, { borderBottomColor: tokens.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navScroll}
        >
          {viewOptions.map((opt) => {
            const active = activeView === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.navChip,
                  {
                    backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surface,
                    borderColor: active ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => setActiveView(opt.value)}
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

      {/* Main View: Steam Radar OR League Trends */}
      {activeView === 'steam' ? (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.radarHeader}>
              <View style={styles.radarStatus}>
                <Radio size={14} color={tokens.colors.primary} />
                <Text variant="badge" tone="brand">
                  RADAR SCANNING 14 SPORTSBOOKS
                </Text>
              </View>
              <Text variant="bodySm" tone="secondary">
                Tracking institutional steam at Pinnacle vs lagging retail lines (SportyBet, Bet365, Bet9ja).
              </Text>
            </View>
          }
          renderItem={({ item }) => <SteamCard movement={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primary}
              colors={[tokens.colors.primary]}
            />
          }
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredInsights}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.trendsHeader}>
              <Text variant="title">Analytical Trends & Matchup Profiles</Text>
              <Text variant="bodySm" tone="secondary">
                High-confidence empirical patterns filtered by pace, xG, and defensive efficiency splits.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.insightCard}>
              <View style={styles.cardHeader}>
                <Badge
                  label={item.league === 'NBA' ? 'NBA 🏀' : 'PREMIER LEAGUE ⚽'}
                  tone={item.league === 'NBA' ? 'positive' : 'info'}
                  size="sm"
                />
                <Text variant="dataLg" tone="brand">
                  {item.stat}
                </Text>
              </View>

              <Text variant="headlineSm" style={styles.insightTitle}>
                {item.title}
              </Text>
              <Text variant="body" tone="secondary" style={styles.insightSub}>
                {item.subtitle}
              </Text>

              <View
                style={[
                  styles.metricFooter,
                  { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
                ]}
              >
                <Text variant="badge" tone="tertiary">
                  {item.statLabel}
                </Text>
                <Text variant="bodySm" tone="primary" style={{ flex: 1, textAlign: 'right' }}>
                  {item.description}
                </Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BarChart3 size={32} color={tokens.colors.borderStrong} />
              <Text variant="title" tone="secondary" style={{ marginTop: 10, marginBottom: 4 }}>
                No Trend Profiles Found
              </Text>
              <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', marginBottom: 12 }}>
                No statistical profiles recorded for this category.
              </Text>
              <TouchableOpacity
                style={[styles.emptyResetBtn, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}
                onPress={() => setActiveView('all')}
                activeOpacity={0.7}
              >
                <Text variant="badge" tone="brand">
                  View All Trends
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
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  navChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  radarHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 4,
  },
  radarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendsHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 4,
  },
  insightCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTitle: {
    marginTop: 2,
  },
  insightSub: {
    lineHeight: 18,
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
    gap: 8,
  },
  listPadding: {
    paddingBottom: 24,
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
