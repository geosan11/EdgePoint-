import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowUpRight,
  BarChart3,
  Flame,
  MessageSquare,
  PenSquare,
  Radio,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react-native';
import { CommunityFeedCard } from '../../components/CommunityFeedCard';
import { CreatePostModal } from '../../components/CreatePostModal';
import { DevigCalculator } from '../../components/DevigCalculator';
import { SteamCard } from '../../components/SteamCard';
import { TipsterCard } from '../../components/TipsterCard';
import { Badge, Button, Card, Text } from '../../components/ui';
import { getInsights, getLineMovements } from '../../lib/supabase';
import { LeagueTrendInsight, LineMovement } from '../../lib/types';
import { useCommunityStore } from '../../stores/useCommunityStore';
import { useTheme } from '../../stores/useThemeStore';

type CommunityView = 'feed' | 'tipsters' | 'steam' | 'devig' | 'trends';
type FeedFilter = 'all' | 'predictions' | 'news' | 'subscribed';

export default function InsightsScreen() {
  const { tokens } = useTheme();
  const [activeView, setActiveView] = useState<CommunityView>('feed');
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [trendLeagueFilter, setTrendLeagueFilter] = useState<'all' | 'nba' | 'epl'>('all');
  const [createPostVisible, setCreatePostVisible] = useState(false);

  const { posts, tipsters, subscribedTipsterIds } = useCommunityStore();
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

  const filteredPosts = posts.filter((p) => {
    if (feedFilter === 'all') return true;
    if (feedFilter === 'predictions') return p.type === 'prediction';
    if (feedFilter === 'news') return p.type === 'news';
    if (feedFilter === 'subscribed') return subscribedTipsterIds.includes(p.authorId);
    return true;
  });

  const filteredInsights = insights.filter((i) => {
    if (trendLeagueFilter === 'all') return true;
    if (trendLeagueFilter === 'nba') return i.league === 'NBA';
    if (trendLeagueFilter === 'epl') return i.league === 'Premier League';
    return true;
  });

  const viewOptions: { label: string; value: CommunityView }[] = [
    { label: 'SYNDICATE FEED', value: 'feed' },
    { label: 'TOP TIPSTERS 👑', value: 'tipsters' },
    { label: 'LINE STEAM RADAR ⚡', value: 'steam' },
    { label: 'DEVIG CALCULATOR 🧮', value: 'devig' },
    { label: 'LEAGUE TRENDS 📊', value: 'trends' },
  ];

  const feedFilterOptions: { label: string; value: FeedFilter }[] = [
    { label: 'ALL ACTIVITY', value: 'all' },
    { label: 'PICKS 🎯', value: 'predictions' },
    { label: 'NEWS & INTEL 📰', value: 'news' },
    { label: `SUBSCRIBED (${subscribedTipsterIds.length}) 👑`, value: 'subscribed' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.background }]}>
      {/* 1. Top Primary Section Tabs */}
      <View style={[styles.navBar, { borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surfaceInset }]}>
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
                    backgroundColor: active ? tokens.colors.surface : 'transparent',
                    borderColor: active ? tokens.colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setActiveView(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  variant="label"
                  tone={active ? 'brand' : 'secondary'}
                  style={{ fontWeight: active ? '800' : '600', letterSpacing: 0.6 }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. COMMUNITY FEED VIEW */}
      {activeView === 'feed' ? (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.feedHeaderWrap}>
              {/* Post Action Banner */}
              <View style={[styles.actionBanner, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color={tokens.colors.primary} />
                    <Text variant="title">Sharp Community Intel</Text>
                  </View>
                  <Text variant="bodySm" tone="secondary">
                    Publish your quantitative pick or breaking sports news.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.postButton, { backgroundColor: tokens.colors.primary }]}
                  onPress={() => setCreatePostVisible(true)}
                  activeOpacity={0.7}
                >
                  <PenSquare size={13} color={tokens.colors.onPrimary} />
                  <Text variant="badge" style={{ color: tokens.colors.onPrimary }}>
                    + Post
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Feed Sub-filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subFilterScroll}
              >
                {feedFilterOptions.map((f) => {
                  const active = feedFilter === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      style={[
                        styles.subFilterChip,
                        {
                          backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surface,
                          borderColor: active ? tokens.colors.primary : tokens.colors.border,
                        },
                      ]}
                      onPress={() => setFeedFilter(f.value)}
                      activeOpacity={0.7}
                    >
                      <Text variant="label" tone={active ? 'brand' : 'secondary'}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => <CommunityFeedCard post={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={32} color={tokens.colors.borderStrong} />
              <Text variant="title" tone="secondary" style={{ marginTop: 10, marginBottom: 4 }}>
                No Posts in This Category
              </Text>
              <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', marginBottom: 12 }}>
                {feedFilter === 'subscribed'
                  ? "You haven't subscribed to any tipsters yet. Browse the Top Tipsters tab to subscribe."
                  : 'Be the first sharp analyst to publish a pick or intel.'}
              </Text>
              {feedFilter === 'subscribed' ? (
                <TouchableOpacity
                  style={[styles.emptyResetBtn, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}
                  onPress={() => setActiveView('tipsters')}
                  activeOpacity={0.7}
                >
                  <Text variant="badge" tone="brand">
                    Browse Top Tipsters
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.emptyResetBtn, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}
                  onPress={() => setFeedFilter('all')}
                  activeOpacity={0.7}
                >
                  <Text variant="badge" tone="brand">
                    View All Posts
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {/* 3. TOP TIPSTERS MARKETPLACE VIEW */}
      {activeView === 'tipsters' ? (
        <FlatList
          data={tipsters}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.tipstersHeader}>
              <View style={styles.tipstersTitleRow}>
                <Users size={16} color={tokens.colors.primary} />
                <Text variant="headlineSm">Verified Sharp Leaderboard</Text>
              </View>
              <Text variant="bodySm" tone="secondary">
                Audited win rates, 30-day ROI, and closing line value (CLV). Subscribe to receive locked VIP predictions.
              </Text>
            </View>
          }
          renderItem={({ item }) => <TipsterCard tipster={item} />}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {/* 4. SHARP STEAM RADAR VIEW */}
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
      ) : null}

      {/* 5. DEVIG CALCULATOR VIEW */}
      {activeView === 'devig' ? (
        <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
          <DevigCalculator />
        </ScrollView>
      ) : null}

      {/* 6. LEAGUE TRENDS VIEW */}
      {activeView === 'trends' ? (
        <FlatList
          data={filteredInsights}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.trendsHeader}>
              <Text variant="title">Analytical Trends & Matchup Profiles</Text>
              <Text variant="bodySm" tone="secondary">
                High-confidence empirical patterns filtered by pace, xG, and defensive efficiency splits.
              </Text>
              <View style={styles.trendFilterRow}>
                {[
                  { label: 'All', value: 'all' as const },
                  { label: 'NBA 🏀', value: 'nba' as const },
                  { label: 'Premier League ⚽', value: 'epl' as const },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.subFilterChip,
                      trendLeagueFilter === t.value && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                      { borderColor: tokens.colors.border },
                    ]}
                    onPress={() => setTrendLeagueFilter(t.value)}
                    activeOpacity={0.7}
                  >
                    <Text variant="label" tone={trendLeagueFilter === t.value ? 'brand' : 'secondary'}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {/* Create Post Modal */}
      <CreatePostModal visible={createPostVisible} onClose={() => setCreatePostVisible(false)} />
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
  feedHeaderWrap: {
    paddingTop: 10,
    paddingBottom: 4,
    gap: 10,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  subFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  tipstersHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 4,
  },
  tipstersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    gap: 8,
  },
  trendFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
    paddingBottom: 96,
  },
  scrollPadding: {
    paddingTop: 10,
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
