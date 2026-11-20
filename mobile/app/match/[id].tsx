import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Info,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { OddsMatrix } from '../../components/OddsMatrix';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  Skeleton,
  Text,
} from '../../components/reusables';
import {
  fairOdds,
  formatKickoffWAT,
  generateKeyInsight,
  getFixtureMarketEdge,
  getSportyBetOdds,
  getTeamMonogram,
  winProb,
} from '../../lib/homeSelectors';
import { getFixtures, getPredictions, MOCK_FIXTURES, MOCK_PREDICTIONS } from '../../lib/supabase';
import { MatchFixture, Prediction } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toggleCustomLeg, isLegInSlip } = useBetStore();

  const [fixture, setFixture] = useState<MatchFixture | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [fixtures, predictions] = await Promise.all([
          getFixtures(),
          getPredictions(),
        ]);

        if (!isMounted) return;

        // Find matching fixture by id
        let matchedFix = fixtures.find((f) => f.id === id);
        if (!matchedFix) {
          matchedFix = MOCK_FIXTURES.find((f) => f.id === id) || fixtures[0] || MOCK_FIXTURES[0];
        }

        // Find associated prediction
        const matchedPred =
          predictions.find((p) => p.fixture_id === matchedFix?.id) ||
          MOCK_PREDICTIONS.find((p) => p.fixture_id === matchedFix?.id) ||
          null;

        setFixture(matchedFix);
        setPrediction(matchedPred);
      } catch (err) {
        console.error('Failed to load match detail:', err);
        // Fallback to mock
        const fallbackFix = MOCK_FIXTURES.find((f) => f.id === id) || MOCK_FIXTURES[0];
        setFixture(fallbackFix);
        setPrediction(MOCK_PREDICTIONS.find((p) => p.fixture_id === fallbackFix.id) || null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const homeCrest = useMemo(
    () => getTeamMonogram(fixture?.homeTeam || 'Home Team'),
    [fixture?.homeTeam]
  );
  const awayCrest = useMemo(
    () => getTeamMonogram(fixture?.awayTeam || 'Away Team'),
    [fixture?.awayTeam]
  );

  const isLive = fixture?.status === 'live' && fixture?.dataSource === 'live';
  const isSample = fixture?.dataSource !== 'live';

  // Derived metrics via single source edge selector
  const fixtureMarketEdge = useMemo(() => {
    return getFixtureMarketEdge(fixture, prediction);
  }, [fixture, prediction]);

  const edgePct = fixtureMarketEdge.edgePct;
  const marketLabel = fixtureMarketEdge.marketLabel;
  const edgeScore = fixtureMarketEdge.edgeScore ?? prediction?.edge_score ?? null;
  const hasValidEdgeScore = typeof edgeScore === 'number' && edgeScore > 0 && edgeScore <= 100;

  const probability = winProb(prediction) || winProb(fixture);
  const fairOddsVal = fairOdds(probability);

  const sportyOdds = getSportyBetOdds(
    fixture || undefined,
    fixture?.modelEdge?.marketKey,
    fixture?.modelEdge?.side
  ) ?? prediction?.sportsbook_odds ?? null;

  const keyInsight = generateKeyInsight({
    summary: prediction?.analysis_notes ? undefined : undefined,
    pickName: fixtureMarketEdge.pickName || fixture?.modelEdge?.pick || prediction?.match_title,
    modelProb: probability,
    sportyOdds,
    edgePct,
  });

  const pickName = fixtureMarketEdge.pickName || fixture?.modelEdge?.pick || `${prediction?.selection || 'Sharp Pick'} (${marketLabel})`;
  const legId = prediction?.id || fixture?.id || '';
  const legInSlip = isLegInSlip(legId);

  const handleToggleSlip = () => {
    if (!fixture) return;
    toggleCustomLeg({
      prediction_id: legId,
      fixture: `${fixture.awayTeam} vs ${fixture.homeTeam}`,
      prop: fixture.modelEdge?.market || 'Model Edge',
      selection: pickName,
      odds: sportyOdds ?? 1.9,
      ev: `+${edgePct.toFixed(1)}% EV`,
      bookmaker: 'SportyBet',
      edge_score: edgeScore ?? undefined,
    });
  };

  if (loading) {
    return (
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 80,
        }}
      >
        <View className="w-full max-w-[560px]">
          <Skeleton className="h-10 w-24 mb-4 rounded-xl" />
          <Skeleton className="h-44 w-full mb-4 rounded-2xl" />
          <Skeleton className="h-28 w-full mb-4 rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </View>
      </ScrollView>
    );
  }

  if (!fixture) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-6">
        <Text className="text-lg font-bold text-[#0F172A] mb-2">Match Not Found</Text>
        <Text className="text-sm text-[#64748B] text-center mb-6">
          The requested fixture could not be located in today's active slate.
        </Text>
        <Button variant="default" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC]"
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-[560px]">
        {/* Navigation Bar */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            className="flex-row items-center bg-white px-3 py-2 rounded-xl border border-[#E2E8F0]"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#0F172A" />
            <Text className="text-xs font-semibold text-[#0F172A] ml-1.5">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <Badge variant="outline" className="border-[#E2E8F0] bg-white px-2.5 py-1">
              <Text className="text-xs font-bold text-[#475569]">{fixture.league}</Text>
            </Badge>
            {isSample && (
              <Badge variant="amber" className="px-2.5 py-1">
                <Text className="text-xs font-semibold text-amber-800">Sample Data</Text>
              </Badge>
            )}
          </View>
        </View>

        {/* Hero Match Card */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm mb-4 p-5">
          {/* Status Row */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#F1F5F9]">
            <View className="flex-row items-center">
              {isLive ? (
                <View className="flex-row items-center bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                  <View className="w-2 h-2 rounded-full bg-[#0284C7] mr-1.5" />
                  <Text className="text-xs font-bold text-[#0284C7]">LIVE {fixture.gameClock}</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Clock size={13} color="#64748B" />
                  <Text className="text-xs font-medium text-[#64748B] ml-1.5">{formatKickoffWAT(fixture.commenceTime)}</Text>
                </View>
              )}
            </View>

            {fixture.stadium && (
              <Text className="text-xs text-[#94A3B8]" numberOfLines={1}>
                {fixture.stadium}
              </Text>
            )}
          </View>

          {/* Teams Row with Crests */}
          <View className="flex-row items-center justify-between py-2">
            {/* Away Team */}
            <View className="flex-1 items-center">
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: awayCrest.bgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="mb-2 shadow-xs"
              >
                <Text
                  style={{
                    color: awayCrest.textColor,
                    fontSize: awayCrest.initials.length > 2 ? 12 : 14,
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: -0.2,
                  }}
                >
                  {awayCrest.initials}
                </Text>
              </View>
              <Text className="text-xs font-bold text-[#0F172A] text-center" numberOfLines={2}>
                {fixture.awayTeam}
              </Text>
              {isLive && fixture.awayScore !== undefined && (
                <Text className="text-2xl font-black text-[#0F172A] mt-1">{fixture.awayScore}</Text>
              )}
            </View>

            {/* Score / VS Center */}
            <View className="px-4 items-center">
              <View className="bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                <Text className="text-xs font-extrabold text-[#64748B]">
                  {isLive ? 'LIVE' : 'VS'}
                </Text>
              </View>
            </View>

            {/* Home Team */}
            <View className="flex-1 items-center">
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: homeCrest.bgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="mb-2 shadow-xs"
              >
                <Text
                  style={{
                    color: homeCrest.textColor,
                    fontSize: homeCrest.initials.length > 2 ? 12 : 14,
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: -0.2,
                  }}
                >
                  {homeCrest.initials}
                </Text>
              </View>
              <Text className="text-xs font-bold text-[#0F172A] text-center" numberOfLines={2}>
                {fixture.homeTeam}
              </Text>
              {isLive && fixture.homeScore !== undefined && (
                <Text className="text-2xl font-black text-[#0F172A] mt-1">{fixture.homeScore}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Quant Edge & Pick Rating Card */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm mb-4 p-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="h-6 w-6 rounded-md bg-[#059669]/10 items-center justify-center mr-2">
                <Sparkles size={14} color="#059669" />
              </View>
              <Text className="text-sm font-bold text-[#0F172A]">Quant Model Valuation</Text>
            </View>

            <Badge variant="green" className="px-2 py-0.5">
              <Text className="text-xs font-bold text-emerald-800">+{edgePct.toFixed(1)}% {marketLabel} Edge</Text>
            </Badge>
          </View>

          {/* Key Metrics Row */}
          <View className="flex-row items-center justify-between bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] mb-4">
            {/* Edge Rating / Score */}
            <View className="items-center flex-1">
              <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1" numberOfLines={1}>
                {marketLabel} Edge
              </Text>
              {hasValidEdgeScore ? (
                <View className="h-11 w-11 rounded-full border-2 border-[#059669] items-center justify-center bg-white shadow-xs">
                  <Text className="text-sm font-black text-[#059669]">{Math.round(edgeScore)}</Text>
                </View>
              ) : (
                <Text className="text-base font-extrabold text-[#059669]">+{edgePct.toFixed(1)}%</Text>
              )}
            </View>

            <View className="h-8 w-[1px] bg-[#E2E8F0]" />

            {/* Win Probability */}
            <View className="items-center flex-1">
              <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Win Prob
              </Text>
              <Text className="text-base font-black text-[#0F172A]">
                {probability > 0 ? `${Math.round(probability * 100)}%` : '—'}
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-[#E2E8F0]" />

            {/* SportyBet Line */}
            <View className="items-center flex-1">
              <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                SportyBet
              </Text>
              <Text className="text-base font-black text-[#0F172A]">
                {sportyOdds ? sportyOdds.toFixed(2) : '—'}
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-[#E2E8F0]" />

            {/* Fair Odds */}
            <View className="items-center flex-1">
              <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Fair Odds
              </Text>
              <Text className="text-base font-black text-[#0284C7]">
                {fairOddsVal > 0 ? fairOddsVal.toFixed(2) : '—'}
              </Text>
            </View>
          </View>

          {/* Model Pick Highlight */}
          <View className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-bold text-emerald-900">Recommended Model Pick</Text>
              <Text className="text-xs font-semibold text-emerald-700">SportyBet Primary</Text>
            </View>
            <Text className="text-sm font-extrabold text-[#0F172A] mb-1">{pickName}</Text>
            <Text className="text-xs text-[#475569] leading-relaxed">{keyInsight}</Text>
          </View>

          {/* Add to Watchlist CTA */}
          <Button
            variant={legInSlip ? 'secondary' : 'default'}
            className={`w-full h-11 rounded-xl ${legInSlip ? 'bg-[#F1F5F9]' : 'bg-[#059669]'}`}
            onPress={handleToggleSlip}
          >
            <View className="flex-row items-center justify-center">
              {legInSlip ? (
                <>
                  <Check size={16} color="#059669" className="mr-2" />
                  <Text className="text-xs font-bold text-[#059669]">Added to Watchlist</Text>
                </>
              ) : (
                <>
                  <Bookmark size={16} color="#FFFFFF" className="mr-2" />
                  <Text className="text-xs font-bold text-white">Add Pick to Watchlist</Text>
                </>
              )}
            </View>
          </Button>
        </Card>

        {/* Section: OddsMatrix Integration */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <View>
              <Text className="text-base font-extrabold text-[#0F172A]">Cross-Book Odds Matrix</Text>
              <Text className="text-xs text-[#64748B]">
                Active SportyBet lines vs benchmark sportsbooks
              </Text>
            </View>
            <Badge variant="outline" className="border-[#E2E8F0] bg-white px-2 py-0.5">
              <Text className="text-[10px] font-bold text-[#475569]">Multi-Book</Text>
            </Badge>
          </View>

          {/* Render OddsMatrix component */}
          <View className="rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm">
            <OddsMatrix match={fixture} />
          </View>
        </View>

        {/* Disclaimer Footer */}
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
