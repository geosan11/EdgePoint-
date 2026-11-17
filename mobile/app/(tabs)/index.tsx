import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Info,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Text,
} from '../../components/reusables';
import {
  bestPick,
  fairOdds,
  featured,
  generateKeyInsight,
  getSportyBetOdds,
  getTeamMonogram,
  todaysPicks,
  winProb,
} from '../../lib/homeSelectors';
import { getFixtures, getPredictions } from '../../lib/supabase';
import { MatchFixture, Prediction } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';

export default function HomeScreen() {
  const router = useRouter();
  const { toggleCustomLeg, isLegInSlip } = useBetStore();

  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [fData, pData] = await Promise.all([getFixtures(), getPredictions()]);
      setFixtures(fData || []);
      setPredictions(pData || []);
    } catch (err: any) {
      console.error('Home data load error:', err);
      setError('Unable to load analytics slate. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // Derived selectors
  const bestPickResult = useMemo(() => {
    return bestPick(predictions, fixtures);
  }, [predictions, fixtures]);

  const heroPick = bestPickResult?.pick;
  const heroFixture = bestPickResult?.fixture;

  const secondaryPicks = useMemo(() => {
    return todaysPicks(predictions, heroPick?.id, 4);
  }, [predictions, heroPick?.id]);

  const featuredList = useMemo(() => {
    return featured(fixtures, 6);
  }, [fixtures]);

  const hasSampleData = useMemo(() => {
    return fixtures.some((f) => f.dataSource !== 'live');
  }, [fixtures]);

  // Hero calculations
  const heroProb = winProb(heroPick) || winProb(heroFixture);
  const heroSportyOdds = getSportyBetOdds(
    heroFixture,
    heroFixture?.modelEdge?.marketKey,
    heroFixture?.modelEdge?.side
  ) ?? heroPick?.sportsbook_odds ?? null;

  const heroEdgePct = heroPick?.ev_percentage ?? heroFixture?.modelEdge?.edgePct ?? 0;
  const heroEdgeScore = heroPick?.edge_score ?? null;
  const hasValidHeroScore =
    typeof heroEdgeScore === 'number' && heroEdgeScore > 0 && heroEdgeScore <= 100;

  const heroInsight = useMemo(() => {
    return generateKeyInsight({
      pickName: heroPick?.selection || heroFixture?.modelEdge?.pick,
      modelProb: heroProb,
      sportyOdds: heroSportyOdds,
      edgePct: heroEdgePct,
    });
  }, [heroPick, heroFixture, heroProb, heroSportyOdds, heroEdgePct]);

  // Monogram Crests for Hero
  const heroTeams = useMemo(() => {
    if (heroFixture) {
      return {
        home: heroFixture.homeTeam,
        away: heroFixture.awayTeam,
        league: heroFixture.league,
        commence: heroFixture.commenceTime,
      };
    }
    if (heroPick?.match_title) {
      const parts = heroPick.match_title.split(/ vs | @ /i);
      return {
        away: parts[0]?.trim() || 'Team A',
        home: parts[1]?.trim() || 'Team B',
        league: heroPick.league_name || 'Sports',
        commence: heroPick.commence_time,
      };
    }
    return {
      away: 'Team A',
      home: 'Team B',
      league: 'Sports',
      commence: 'Today',
    };
  }, [heroFixture, heroPick]);

  const homeCrest = useMemo(() => getTeamMonogram(heroTeams.home), [heroTeams.home]);
  const awayCrest = useMemo(() => getTeamMonogram(heroTeams.away), [heroTeams.away]);

  const heroPickName =
    heroFixture?.modelEdge?.pick ||
    (heroPick ? `${heroPick.selection} ${heroPick.line ?? ''} (${heroPick.market_type})` : 'Best Edge');
  const heroLegId = heroPick?.id || heroFixture?.id || 'hero-leg';
  const isHeroInSlip = isLegInSlip(heroLegId);

  const handleToggleHeroSlip = () => {
    toggleCustomLeg({
      prediction_id: heroLegId,
      fixture: `${heroTeams.away} vs ${heroTeams.home}`,
      prop: heroFixture?.modelEdge?.market || heroPick?.market_type || 'Model Pick',
      selection: heroPickName,
      odds: heroSportyOdds ?? 1.9,
      ev: `+${heroEdgePct.toFixed(1)}% EV`,
      bookmaker: 'SportyBet',
      edge_score: heroEdgeScore ?? undefined,
    });
  };

  const navigateToFixture = (fixId?: string) => {
    if (!fixId) {
      router.push('/(tabs)/matches');
      return;
    }
    router.push({
      pathname: '/match/[id]',
      params: { id: fixId },
    });
  };

  // ========================================================
  // RENDER STATES: Loading Skeleton
  // ========================================================
  if (loading && !refreshing) {
    return (
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 100,
        }}
      >
        <View className="w-full max-w-[560px]">
          {/* Top Banner Skeleton */}
          <Skeleton className="h-7 w-full rounded-xl mb-4" />

          {/* Hero Card Skeleton */}
          <View className="rounded-2xl bg-white border border-[#E2E8F0] p-5 mb-6 shadow-xs">
            <View className="flex-row justify-between mb-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </View>
            <View className="flex-row items-center justify-between py-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-6 w-12 rounded-lg" />
              <Skeleton className="h-14 w-14 rounded-2xl" />
            </View>
            <Skeleton className="h-14 w-full rounded-xl my-3" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </View>

          {/* Carousel Skeleton */}
          <View className="mb-6">
            <Skeleton className="h-6 w-40 rounded-lg mb-3" />
            <View className="flex-row gap-3">
              <Skeleton className="h-32 w-44 rounded-2xl" />
              <Skeleton className="h-32 w-44 rounded-2xl" />
            </View>
          </View>

          {/* List Skeleton */}
          <Skeleton className="h-6 w-36 rounded-lg mb-3" />
          <Skeleton className="h-20 w-full rounded-2xl mb-2" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </View>
      </ScrollView>
    );
  }

  // ========================================================
  // RENDER STATES: Error State
  // ========================================================
  if (error && fixtures.length === 0) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-6">
        <View className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 items-center justify-center mb-4">
          <AlertCircle size={28} color="#DC2626" />
        </View>
        <Text className="text-lg font-bold text-[#0F172A] mb-1">Slate Unavailable</Text>
        <Text className="text-sm text-[#64748B] text-center mb-6 max-w-[320px]">
          {error}
        </Text>
        <Button variant="default" className="bg-[#059669] px-6 h-11" onPress={loadData}>
          <View className="flex-row items-center">
            <RefreshCw size={16} color="#FFFFFF" className="mr-2" />
            <Text className="text-white font-semibold">Retry Loading</Text>
          </View>
        </Button>
      </View>
    );
  }

  // ========================================================
  // RENDER STATES: Empty Slate State
  // ========================================================
  if (!loading && fixtures.length === 0 && predictions.length === 0) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-6">
        <View className="w-16 h-16 rounded-2xl bg-[#059669]/10 items-center justify-center mb-4">
          <CalendarDays size={32} color="#059669" />
        </View>
        <Text className="text-xl font-bold text-[#0F172A] mb-1">No Analysed Matches Yet</Text>
        <Text className="text-sm text-[#64748B] text-center mb-6 max-w-[360px] leading-relaxed">
          The quant models are currently processing upcoming lines for today's slate. Check back shortly.
        </Text>
        <Button variant="default" className="bg-[#059669] px-6" onPress={() => router.push('/(tabs)/matches')}>
          <Text className="text-white font-semibold">View Live Board</Text>
        </Button>
      </View>
    );
  }

  // ========================================================
  // MAIN VIEW
  // ========================================================
  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC]"
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 100,
      }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-[560px]">
        {/* 1. Slim Sample Data Notice Banner */}
        {hasSampleData && (
          <View className="flex-row items-center justify-between bg-amber-50/80 border border-amber-200/90 rounded-xl px-3 py-2 mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <Info size={14} color="#B45309" />
              <Text className="text-xs text-amber-900 ml-2 font-medium" numberOfLines={1}>
                Sample data active • Live SportyBet lines sync when connected
              </Text>
            </View>
            <Badge variant="amber" className="px-2 py-0.5 border-amber-300">
              <Text className="text-[10px] font-bold text-amber-800">Sample</Text>
            </Badge>
          </View>
        )}

        {/* 2. Best Analysis Pick of the Day Hero Card */}
        {heroPick && (
          <View className="mb-6">
            <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-2xl p-5">
              {/* Card Header: League Tag + Kickoff + Sample pill */}
              <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-[#F1F5F9]">
                <View className="flex-row items-center gap-1.5">
                  <Badge variant="outline" className="border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-[#475569]">{heroTeams.league}</Text>
                  </Badge>
                  <View className="flex-row items-center ml-1">
                    <Clock size={12} color="#64748B" />
                    <Text className="text-xs text-[#64748B] ml-1 font-medium">{heroTeams.commence}</Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mr-1.5">
                    <Text className="text-[10px] font-bold text-emerald-800">PICK OF THE DAY</Text>
                  </View>
                  {heroFixture?.dataSource !== 'live' && (
                    <Badge variant="amber" className="px-1.5 py-0.5">
                      <Text className="text-[9px] font-bold text-amber-800">Sample</Text>
                    </Badge>
                  )}
                </View>
              </View>

              {/* Matchup Row with Monogram Crests */}
              <View className="flex-row items-center justify-between py-2">
                {/* Away Team */}
                <View className="flex-1 items-center">
                  <View
                    style={{ backgroundColor: awayCrest.bgColor }}
                    className="w-13 h-13 rounded-2xl items-center justify-center mb-1.5 shadow-xs"
                  >
                    <Text style={{ color: awayCrest.textColor }} className="text-base font-extrabold tracking-wide">
                      {awayCrest.initials}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-[#0F172A] text-center" numberOfLines={2}>
                    {heroTeams.away}
                  </Text>
                </View>

                {/* Center Edge Rating Ring */}
                <View className="px-3 items-center">
                  <Text className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1">
                    Edge Rating
                  </Text>
                  {hasValidHeroScore ? (
                    <View className="h-12 w-12 rounded-full border-[2.5px] border-[#059669] items-center justify-center bg-white shadow-xs">
                      <Text className="text-base font-black text-[#059669]">{Math.round(heroEdgeScore)}</Text>
                    </View>
                  ) : (
                    <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <Text className="text-sm font-black text-[#059669]">+{heroEdgePct.toFixed(1)}%</Text>
                    </View>
                  )}
                  <Text className="text-[9px] text-[#94A3B8] mt-0.5 font-medium">Model Conf</Text>
                </View>

                {/* Home Team */}
                <View className="flex-1 items-center">
                  <View
                    style={{ backgroundColor: homeCrest.bgColor }}
                    className="w-13 h-13 rounded-2xl items-center justify-center mb-1.5 shadow-xs"
                  >
                    <Text style={{ color: homeCrest.textColor }} className="text-base font-extrabold tracking-wide">
                      {homeCrest.initials}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-[#0F172A] text-center" numberOfLines={2}>
                    {heroTeams.home}
                  </Text>
                </View>
              </View>

              {/* Metrics Row: Win Prob, SportyBet, Fair Odds */}
              <View className="flex-row items-center justify-between bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] my-3">
                <View className="items-center flex-1">
                  <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Win Prob</Text>
                  <Text className="text-base font-black text-[#0F172A]">
                    {heroProb > 0 ? `${Math.round(heroProb * 100)}%` : '—'}
                  </Text>
                </View>

                <View className="h-7 w-[1px] bg-[#E2E8F0]" />

                <View className="items-center flex-1">
                  <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">SportyBet</Text>
                  <Text className="text-base font-black text-[#0F172A]">
                    {heroSportyOdds ? heroSportyOdds.toFixed(2) : '—'}
                  </Text>
                </View>

                <View className="h-7 w-[1px] bg-[#E2E8F0]" />

                <View className="items-center flex-1">
                  <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Edge %</Text>
                  <Text className="text-base font-black text-[#059669]">+{heroEdgePct.toFixed(1)}%</Text>
                </View>
              </View>

              {/* Key Insight Block */}
              <View className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 mb-4">
                <View className="flex-row items-center mb-1">
                  <Sparkles size={13} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-950 ml-1.5">
                    Recommended: {heroPickName}
                  </Text>
                </View>
                <Text className="text-xs text-[#334155] leading-relaxed">{heroInsight}</Text>
              </View>

              {/* CTAs: View Full Analysis & Watchlist */}
              <View className="gap-2">
                <Button
                  variant="default"
                  className="w-full bg-[#059669] h-11 rounded-xl"
                  onPress={() => navigateToFixture(heroFixture?.id || heroPick.fixture_id)}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-white font-bold text-sm mr-2">View Full Analysis</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </View>
                </Button>

                <TouchableOpacity
                  className="flex-row items-center justify-center py-2"
                  onPress={handleToggleHeroSlip}
                  activeOpacity={0.7}
                >
                  {isHeroInSlip ? (
                    <>
                      <Check size={14} color="#059669" />
                      <Text className="text-xs font-bold text-[#059669] ml-1.5">Saved in Watchlist</Text>
                    </>
                  ) : (
                    <>
                      <Bookmark size={14} color="#64748B" />
                      <Text className="text-xs font-semibold text-[#64748B] ml-1.5">+ Add to Watchlist</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* 3. Featured Matches Horizontal Carousel */}
        {featuredList.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center">
                <Text className="text-base font-extrabold text-[#0F172A]">Featured Matches</Text>
                <Badge variant="outline" className="border-[#E2E8F0] bg-white ml-2 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-[#64748B]">{featuredList.length}</Text>
                </Badge>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/matches')}>
                <Text className="text-xs font-bold text-[#059669]">See Board →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, gap: 12 }}
            >
              {featuredList.map((m) => {
                const homeM = getTeamMonogram(m.homeTeam);
                const awayM = getTeamMonogram(m.awayTeam);
                const isMatchLive = m.status === 'live' && m.dataSource === 'live';
                const edge = m.modelEdge?.edgePct ?? 0;

                return (
                  <TouchableOpacity
                    key={m.id}
                    className="w-[175px] bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs"
                    onPress={() => navigateToFixture(m.id)}
                    activeOpacity={0.8}
                  >
                    {/* Top row: league and live or kickoff */}
                    <View className="flex-row items-center justify-between mb-2.5">
                      <Text className="text-[10px] font-bold text-[#64748B]">{m.league}</Text>
                      {isMatchLive ? (
                        <View className="flex-row items-center bg-sky-50 px-1.5 py-0.5 rounded-full border border-sky-200">
                          <View className="w-1.5 h-1.5 rounded-full bg-[#0284C7] mr-1" />
                          <Text className="text-[9px] font-bold text-[#0284C7]">{m.gameClock || 'LIVE'}</Text>
                        </View>
                      ) : (
                        <Text className="text-[10px] text-[#94A3B8]" numberOfLines={1}>
                          {m.commenceTime}
                        </Text>
                      )}
                    </View>

                    {/* Matchup Monograms */}
                    <View className="flex-row items-center justify-between my-1">
                      <View className="items-center flex-1">
                        <View
                          style={{ backgroundColor: awayM.bgColor }}
                          className="w-8 h-8 rounded-xl items-center justify-center mb-1"
                        >
                          <Text style={{ color: awayM.textColor }} className="text-[10px] font-bold">
                            {awayM.initials}
                          </Text>
                        </View>
                        <Text className="text-[10px] font-bold text-[#0F172A] text-center" numberOfLines={1}>
                          {m.awayTeam.split(' ').pop()}
                        </Text>
                        {isMatchLive && m.awayScore !== undefined && (
                          <Text className="text-xs font-bold text-[#0F172A]">{m.awayScore}</Text>
                        )}
                      </View>

                      <Text className="text-[10px] font-bold text-[#CBD5E1] px-1">
                        {isMatchLive ? '–' : 'vs'}
                      </Text>

                      <View className="items-center flex-1">
                        <View
                          style={{ backgroundColor: homeM.bgColor }}
                          className="w-8 h-8 rounded-xl items-center justify-center mb-1"
                        >
                          <Text style={{ color: homeM.textColor }} className="text-[10px] font-bold">
                            {homeM.initials}
                          </Text>
                        </View>
                        <Text className="text-[10px] font-bold text-[#0F172A] text-center" numberOfLines={1}>
                          {m.homeTeam.split(' ').pop()}
                        </Text>
                        {isMatchLive && m.homeScore !== undefined && (
                          <Text className="text-xs font-bold text-[#0F172A]">{m.homeScore}</Text>
                        )}
                      </View>
                    </View>

                    {/* Bottom Edge Pill */}
                    <View className="mt-2 pt-2 border-t border-[#F1F5F9] flex-row items-center justify-between">
                      <Text className="text-[9px] text-[#64748B] font-semibold">
                        {m.modelEdge?.pick ? 'Model Edge' : 'Analysis'}
                      </Text>
                      {edge > 0 ? (
                        <Text className="text-[10px] font-extrabold text-[#059669]">+{edge.toFixed(1)}%</Text>
                      ) : (
                        <Text className="text-[10px] font-semibold text-[#94A3B8]">Review</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 4. Today's Picks Short List */}
        {secondaryPicks.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View>
                <Text className="text-base font-extrabold text-[#0F172A]">Today's Top Picks</Text>
                <Text className="text-xs text-[#64748B]">Ranked by quantified edge score</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/edges')}>
                <Text className="text-xs font-bold text-[#059669]">See all →</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-2.5">
              {secondaryPicks.map((p) => {
                const pickProb = winProb(p);
                const sporty = p.best_bookmaker === 'SportyBet' ? p.sportsbook_odds : p.sportsbook_odds;
                const score = p.edge_score;

                return (
                  <TouchableOpacity
                    key={p.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex-row items-center justify-between"
                    onPress={() => navigateToFixture(p.fixture_id)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.2">
                          <Text className="text-[9px] font-bold text-[#64748B]">{p.league_name || p.sport}</Text>
                        </Badge>
                        <Text className="text-[10px] text-[#94A3B8]">{p.commence_time}</Text>
                      </View>

                      <Text className="text-xs font-bold text-[#0F172A] mb-0.5" numberOfLines={1}>
                        {p.match_title}
                      </Text>
                      <Text className="text-xs font-extrabold text-[#059669]">
                        {p.selection} {p.line ? p.line : ''} <Text className="text-[10px] font-normal text-[#64748B]">({p.market_type})</Text>
                      </Text>
                    </View>

                    {/* Right side stats */}
                    <View className="items-end gap-1">
                      <View className="flex-row items-center gap-2">
                        <View className="items-end">
                          <Text className="text-[9px] text-[#94A3B8] font-bold">ODDS</Text>
                          <Text className="text-xs font-black text-[#0F172A]">{sporty.toFixed(2)}</Text>
                        </View>
                        <View className="h-6 w-10 rounded-lg bg-emerald-50 border border-emerald-200 items-center justify-center">
                          <Text className="text-xs font-black text-[#059669]">
                            {score > 0 ? Math.round(score) : `+${p.ev_percentage.toFixed(0)}%`}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[9px] font-semibold text-[#0284C7]">
                        Win {Math.round(pickProb * 100)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 5. Footer Line */}
        <View className="items-center py-4">
          <Text className="text-xs text-[#94A3B8] text-center">
            Analysis, not betting advice. Edges can lose.
          </Text>
          <Text className="text-[11px] text-[#CBD5E1] text-center mt-1">
            EdgePoint+ Quantitative Research Engine • Lagos WAT
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
