import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, Check, Flame, Radio, Sparkles, TrendingUp, Zap } from 'lucide-react-native';
import { MatchCard } from '../../components/ui/MatchCard';
import { getFixtures } from '../../lib/supabase';
import { MatchFixture } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { todayTheme } from '../../theme/todayTheme';

type FilterType = 'all' | 'nba' | 'epl' | 'live';

export default function TodayScreen() {
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { toggleCustomLeg, isLegInSlip } = useBetStore();

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

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
      if (filter === 'all') return true;
      if (filter === 'live') return f.status === 'live';
      if (filter === 'nba') return f.league === 'NBA';
      if (filter === 'epl') return f.league === 'Premier League';
      return true;
    });
  }, [fixtures, filter]);

  // Live in-play games for the horizontal ticker
  const liveFixtures = useMemo(() => {
    return fixtures.filter((f) => f.status === 'live');
  }, [fixtures]);

  // Check if any fixture in the entire slate or filtered board is sample data
  const hasSampleData = useMemo(() => {
    return fixtures.some((f) => f.dataSource !== 'live');
  }, [fixtures]);

  // Sharp Action Alert: find fixture with highest modelEdge.edgePct
  const sharpActionFixture = useMemo(() => {
    const candidates = fixtures.filter((f) => f.modelEdge && f.modelEdge.edgePct > 0);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, curr) => {
      const bestPct = best.modelEdge?.edgePct ?? 0;
      const currPct = curr.modelEdge?.edgePct ?? 0;
      return currPct > bestPct ? curr : best;
    }, candidates[0]);
  }, [fixtures]);

  const filterOptions: { label: string; count: number; value: FilterType }[] = [
    { label: 'ALL SLATES', count: fixtures.length, value: 'all' },
    { label: 'LIVE IN-PLAY', count: liveFixtures.length, value: 'live' },
    { label: 'NBA', count: fixtures.filter((f) => f.league === 'NBA').length, value: 'nba' },
    { label: 'PREMIER LEAGUE', count: fixtures.filter((f) => f.league === 'Premier League').length, value: 'epl' },
  ];

  const edgeCount = fixtures.filter((f) => !!f.modelEdge).length;

  // Sharp Action alert leg details
  const sharpLegId = sharpActionFixture
    ? `sharp_${sharpActionFixture.id}_${sharpActionFixture.modelEdge?.pick}`
    : '';
  const isSharpInSlip = isLegInSlip(sharpLegId);

  const handleToggleSharpAction = () => {
    if (!sharpActionFixture || !sharpActionFixture.modelEdge) return;
    const edge = sharpActionFixture.modelEdge;
    const sportyPrice =
      (edge.marketKey === 'total'
        ? sharpActionFixture.bookOdds?.sportybet?.total?.overOdds
        : edge.marketKey === 'spread'
          ? sharpActionFixture.bookOdds?.sportybet?.spread?.awayOdds
          : sharpActionFixture.bookOdds?.sportybet?.moneyline?.home) ?? 1.91;

    toggleCustomLeg({
      prediction_id: sharpLegId,
      fixture: `${sharpActionFixture.awayTeam} @ ${sharpActionFixture.homeTeam}`,
      prop: `${edge.market}: ${edge.pick}`,
      selection: edge.pick,
      odds: sportyPrice,
      ev: `+${edge.edgePct.toFixed(1)}% EV`,
      bookmaker: 'SportyBet',
    });
  };

  return (
    <View style={styles.screen}>
      {/* 1. Board-Level Sample Data Banner (Honesty Rule) */}
      {hasSampleData ? (
        <View style={styles.sampleBanner}>
          <View style={styles.sampleBannerLeft}>
            <AlertCircle size={12} color={todayTheme.colors.sampleAmber} />
            <Text style={styles.sampleBannerTitle}>Sample data active</Text>
            <Text style={styles.sampleBannerSubtext}>· Mock slates for layout demo</Text>
          </View>
          <View style={styles.samplePill}>
            <Text style={styles.samplePillText}>SAMPLE SLATE</Text>
          </View>
        </View>
      ) : null}

      {/* 2. Terminal Scanner Header Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusLabel}>QUANT SCANNER ACTIVE</Text>
          <Text style={styles.statusSubtext}>· 4 BOOKS</Text>
        </View>

        <View style={styles.statusRight}>
          <View style={styles.edgeBadge}>
            <Zap size={10} color={todayTheme.colors.primary} />
            <Text style={styles.edgeBadgeText}>{edgeCount} +EV EDGES</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredFixtures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={todayTheme.colors.primary}
            colors={[todayTheme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderWrap}>
            {/* 3. Live Scores Ticker Strip */}
            <View style={styles.tickerSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.liveCyanDot} />
                  <Text style={styles.sectionTitle}>LIVE IN-PLAY SCORES</Text>
                </View>
                {liveFixtures.length > 0 && liveFixtures.some((f) => f.dataSource !== 'live') ? (
                  <View style={styles.tickerSampleBadge}>
                    <Text style={styles.tickerSampleText}>SAMPLE LIVE</Text>
                  </View>
                ) : null}
              </View>

              {liveFixtures.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tickerScroll}
                >
                  {liveFixtures.map((fixture) => {
                    const isFixtureSample = fixture.dataSource !== 'live';
                    const awayShort = fixture.awayTeam.split(' ').pop();
                    const homeShort = fixture.homeTeam.split(' ').pop();

                    return (
                      <View key={fixture.id} style={styles.tickerCard}>
                        {/* Top meta: League + Live clock + Sample note */}
                        <View style={styles.tickerTopRow}>
                          <View style={styles.tickerLivePill}>
                            <View style={styles.liveCyanMiniDot} />
                            <Text style={styles.tickerLiveText}>
                              {fixture.gameClock ? `LIVE · ${fixture.gameClock}` : 'LIVE'}
                            </Text>
                          </View>
                          {isFixtureSample ? (
                            <View style={styles.tickerMiniSample}>
                              <Text style={styles.tickerMiniSampleText}>SAMPLE</Text>
                            </View>
                          ) : (
                            <Text style={styles.tickerLeagueText}>{fixture.league}</Text>
                          )}
                        </View>

                        {/* Match scores */}
                        <View style={styles.tickerScoreRow}>
                          <View style={styles.tickerTeamCol}>
                            <Text style={styles.tickerTeamName} numberOfLines={1}>
                              {awayShort}
                            </Text>
                            <Text style={styles.tickerScoreText}>{fixture.awayScore ?? '-'}</Text>
                          </View>
                          <Text style={styles.tickerVs}>vs</Text>
                          <View style={styles.tickerTeamCol}>
                            <Text style={styles.tickerTeamName} numberOfLines={1}>
                              {homeShort}
                            </Text>
                            <Text style={styles.tickerScoreText}>{fixture.homeScore ?? '-'}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.noLiveCard}>
                  <Text style={styles.noLiveText}>No games currently live in-play</Text>
                </View>
              )}
            </View>

            {/* 4. Sharp Action Alert (Largest model edge on the slate) */}
            {sharpActionFixture && sharpActionFixture.modelEdge ? (
              <View style={styles.sharpAlertCard}>
                <View style={styles.sharpAlertHeader}>
                  <View style={styles.sharpHeaderLeft}>
                    <Sparkles size={13} color={todayTheme.colors.primary} />
                    <Text style={styles.sharpAlertTitle}>SHARP ACTION ALERT</Text>
                  </View>
                  <View style={styles.sharpHeaderRight}>
                    {sharpActionFixture.dataSource !== 'live' ? (
                      <View style={styles.sharpSampleBadge}>
                        <AlertCircle size={9} color={todayTheme.colors.sampleAmber} />
                        <Text style={styles.sharpSampleText}>SAMPLE MODEL EDGE</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.sharpBody}>
                  <View style={styles.sharpSubheadRow}>
                    <Text style={styles.sharpSubheadCopy}>
                      Largest model edge on the slate
                    </Text>
                    <Text style={styles.sharpMatchup}>
                      {sharpActionFixture.awayTeam} @ {sharpActionFixture.homeTeam}
                    </Text>
                  </View>

                  <View style={styles.sharpContentRow}>
                    <View style={styles.sharpPickInfo}>
                      <Text style={styles.sharpPickText}>
                        {sharpActionFixture.modelEdge.pick}
                      </Text>
                      <View style={styles.sharpStatsRow}>
                        <View style={styles.sharpEdgeTag}>
                          <Zap size={10} color={todayTheme.colors.primary} />
                          <Text style={styles.sharpEdgeTagText}>
                            +{sharpActionFixture.modelEdge.edgePct.toFixed(1)}% EDGE
                          </Text>
                        </View>
                        <Text style={styles.sharpProbText}>
                          {(sharpActionFixture.modelEdge.modelProb * 100).toFixed(1)}% Model Prob
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.sharpWatchlistBtn,
                        isSharpInSlip && styles.sharpWatchlistBtnActive,
                      ]}
                      onPress={handleToggleSharpAction}
                      activeOpacity={0.7}
                    >
                      {isSharpInSlip ? (
                        <>
                          <Check size={12} color={todayTheme.colors.onPrimary} />
                          <Text style={styles.sharpWatchlistBtnTextActive}>WATCHING</Text>
                        </>
                      ) : (
                        <>
                          <TrendingUp size={12} color={todayTheme.colors.primary} />
                          <Text style={styles.sharpWatchlistBtnText}>WATCHLIST</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            {/* 5. Sleek High-Density Filter Rail */}
            <View style={styles.filterSection}>
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
                        active && styles.filterChipActive,
                      ]}
                      onPress={() => setFilter(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          active && styles.filterChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          active && styles.countBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            active && styles.countBadgeTextActive,
                          ]}
                        >
                          {opt.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Curated Board Section Header */}
            <View style={styles.boardHeader}>
              <Text style={styles.boardHeaderTitle}>CURATED ACTION BOARD</Text>
              <Text style={styles.boardHeaderCount}>{filteredFixtures.length} MATCHES</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Radio size={28} color={todayTheme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Fixtures in Selected Filter</Text>
            <Text style={styles.emptyDesc}>
              There are currently no active matches matching this filter. Switch to all slates to view upcoming games.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyResetText}>View All Slates</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerWrap}>
            <Text style={styles.disclaimerText}>
              Analysis, not betting advice. Edges can lose.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: todayTheme.colors.background,
  },
  sampleBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: todayTheme.colors.sampleAmberSoft,
    borderBottomWidth: 1,
    borderBottomColor: todayTheme.colors.sampleAmberBorder,
  },
  sampleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sampleBannerTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    color: todayTheme.colors.sampleAmber,
    letterSpacing: 0.2,
  },
  sampleBannerSubtext: {
    fontFamily: todayTheme.fonts.hanken.regular,
    fontSize: 10,
    color: todayTheme.colors.textSecondary,
  },
  samplePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: todayTheme.colors.sampleAmber,
  },
  samplePillText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 8,
    color: '#000000',
    letterSpacing: 0.5,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: todayTheme.colors.surfaceInset,
    borderBottomWidth: 1,
    borderBottomColor: todayTheme.colors.borderSubtle,
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
    backgroundColor: todayTheme.colors.primary,
  },
  statusLabel: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9.5,
    color: todayTheme.colors.primary,
    letterSpacing: 0.6,
  },
  statusSubtext: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 10,
    color: todayTheme.colors.textTertiary,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  edgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: todayTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.primaryBorder,
  },
  edgeBadgeText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9.5,
    color: todayTheme.colors.primary,
  },
  listContainer: {
    paddingBottom: 96,
  },
  listHeaderWrap: {
    paddingTop: 8,
  },
  tickerSection: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveCyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: todayTheme.colors.liveCyan,
  },
  sectionTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: todayTheme.colors.textSecondary,
  },
  tickerSampleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: todayTheme.colors.sampleAmberSoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.sampleAmberBorder,
  },
  tickerSampleText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 8,
    color: todayTheme.colors.sampleAmber,
  },
  tickerScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tickerCard: {
    width: 148,
    padding: 10,
    borderRadius: 8,
    backgroundColor: todayTheme.colors.surface,
    borderWidth: 1,
    borderColor: todayTheme.colors.border,
    borderLeftWidth: 2.5,
    borderLeftColor: todayTheme.colors.liveCyan,
  },
  tickerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tickerLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveCyanMiniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: todayTheme.colors.liveCyan,
  },
  tickerLiveText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 8.5,
    color: todayTheme.colors.liveCyan,
  },
  tickerLeagueText: {
    fontFamily: todayTheme.fonts.hanken.regular,
    fontSize: 8.5,
    color: todayTheme.colors.textTertiary,
  },
  tickerMiniSample: {
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 2,
    backgroundColor: todayTheme.colors.sampleAmberSoft,
  },
  tickerMiniSampleText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 7,
    color: todayTheme.colors.sampleAmber,
  },
  tickerScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tickerTeamCol: {
    alignItems: 'center',
    flex: 1,
  },
  tickerTeamName: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 10.5,
    color: todayTheme.colors.textPrimary,
  },
  tickerScoreText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 14,
    color: todayTheme.colors.liveCyan,
    marginTop: 1,
  },
  tickerVs: {
    fontFamily: todayTheme.fonts.mono.regular,
    fontSize: 9,
    color: todayTheme.colors.textTertiary,
    paddingHorizontal: 4,
  },
  noLiveCard: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: todayTheme.colors.surfaceInset,
    borderWidth: 1,
    borderColor: todayTheme.colors.borderSubtle,
    alignItems: 'center',
  },
  noLiveText: {
    fontFamily: todayTheme.fonts.hanken.regular,
    fontSize: 11,
    color: todayTheme.colors.textTertiary,
  },
  sharpAlertCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: todayTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: todayTheme.colors.primaryBorder,
    overflow: 'hidden',
  },
  sharpAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(0, 229, 163, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: todayTheme.colors.borderSubtle,
  },
  sharpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sharpAlertTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: todayTheme.colors.primary,
  },
  sharpHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharpSampleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: todayTheme.colors.sampleAmberSoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.sampleAmberBorder,
  },
  sharpSampleText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 8,
    color: todayTheme.colors.sampleAmber,
    letterSpacing: 0.3,
  },
  sharpBody: {
    padding: 12,
  },
  sharpSubheadRow: {
    marginBottom: 6,
  },
  sharpSubheadCopy: {
    fontFamily: todayTheme.fonts.hanken.semiBold,
    fontSize: 12,
    color: todayTheme.colors.textSecondary,
  },
  sharpMatchup: {
    fontFamily: todayTheme.fonts.space.medium,
    fontSize: 13,
    color: todayTheme.colors.textPrimary,
    marginTop: 2,
  },
  sharpContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sharpPickInfo: {
    flex: 1,
  },
  sharpPickText: {
    fontFamily: todayTheme.fonts.space.bold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: todayTheme.colors.primary,
  },
  sharpStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sharpEdgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: todayTheme.colors.primarySoft,
  },
  sharpEdgeTagText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9.5,
    color: todayTheme.colors.primary,
  },
  sharpProbText: {
    fontFamily: todayTheme.fonts.mono.regular,
    fontSize: 10,
    color: todayTheme.colors.textTertiary,
  },
  sharpWatchlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: todayTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.primaryBorder,
  },
  sharpWatchlistBtnActive: {
    backgroundColor: todayTheme.colors.primary,
    borderColor: todayTheme.colors.primary,
  },
  sharpWatchlistBtnText: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: todayTheme.colors.primary,
  },
  sharpWatchlistBtnTextActive: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: todayTheme.colors.onPrimary,
  },
  filterSection: {
    paddingBottom: 8,
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
    backgroundColor: todayTheme.colors.surface,
    borderWidth: 1,
    borderColor: todayTheme.colors.border,
  },
  filterChipActive: {
    backgroundColor: todayTheme.colors.primarySoft,
    borderColor: todayTheme.colors.primary,
  },
  filterChipText: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 10,
    letterSpacing: 0.5,
    color: todayTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: todayTheme.fonts.hanken.bold,
    color: todayTheme.colors.primary,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: todayTheme.colors.surfaceInset,
  },
  countBadgeActive: {
    backgroundColor: todayTheme.colors.primary,
  },
  countBadgeText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9,
    color: todayTheme.colors.textTertiary,
  },
  countBadgeTextActive: {
    color: todayTheme.colors.onPrimary,
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  boardHeaderTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: todayTheme.colors.textTertiary,
  },
  boardHeaderCount: {
    fontFamily: todayTheme.fonts.mono.medium,
    fontSize: 9,
    color: todayTheme.colors.textTertiary,
  },
  emptyContainer: {
    margin: 16,
    padding: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: todayTheme.colors.border,
    backgroundColor: todayTheme.colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 13,
    color: todayTheme.colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: todayTheme.fonts.hanken.regular,
    fontSize: 11,
    color: todayTheme.colors.textTertiary,
    textAlign: 'center',
    marginBottom: 14,
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: todayTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.primaryBorder,
  },
  emptyResetText: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    color: todayTheme.colors.primary,
  },
  footerWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 11,
    color: todayTheme.colors.textTertiary,
    textAlign: 'center',
  },
});
