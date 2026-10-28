import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Bookmark, Calculator, Check, CheckCircle2, Flame, Layers, Percent, Trash2, TrendingUp, X, Zap } from 'lucide-react-native';
import { DailySlipCard } from '../../components/DailySlipCard';
import { Badge, Button, Card, MetricTile, Text } from '../../components/ui';
import { getDailySlip } from '../../lib/supabase';
import { CuratedParlay, TrackerBet } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

type TrackerTab = 'slip' | 'ledger' | 'anchor';
type BetResultFilter = 'all' | 'pending' | 'won' | 'lost';

export default function TrackerScreen() {
  const {
    slipLegs,
    removeLegFromSlip,
    clearSlip,
    getSlipMetrics,
    getAvgClv,
    unitSize,
    bankroll,
    currency,
    trackerBets,
    saveSlipToTracker,
    settleBet,
    deleteBet,
  } = useBetStore();
  const { tokens } = useTheme();

  const [activeTab, setActiveTab] = useState<TrackerTab>('slip');
  const [dailySlip, setDailySlip] = useState<CuratedParlay | null>(null);
  const [stakeUnits, setStakeUnits] = useState('1.0');
  const [betFilter, setBetFilter] = useState<BetResultFilter>('all');

  useEffect(() => {
    getDailySlip().then(setDailySlip);
  }, []);

  const metrics = getSlipMetrics();

  // Smooth numeric stake parsing without jumping on "0."
  const parsedStake = parseFloat(stakeUnits);
  const numericStake = isNaN(parsedStake) || parsedStake < 0 ? 0 : parsedStake;
  const stakeCash = numericStake * unitSize;
  const potentialPayout = Math.round(stakeCash * metrics.totalOdds);

  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  // Bankroll stats & CLV
  const settledBets = trackerBets.filter((b) => b.result !== 'pending');
  const wonBets = settledBets.filter((b) => b.result === 'won');
  const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;
  const totalPnl = settledBets.reduce((acc, b) => acc + b.pnl, 0);
  const totalStaked = settledBets.reduce((acc, b) => acc + b.stake, 0);
  const roiPct = totalStaked > 0 ? (totalPnl / totalStaked) * 100 : 0;
  const avgClv = getAvgClv();

  const filteredBets = trackerBets.filter((b) => {
    if (betFilter === 'all') return true;
    return b.result === betFilter;
  });

  const handleSaveToTracker = () => {
    if (slipLegs.length === 0) return;
    if (numericStake <= 0) {
      Alert.alert('Invalid Stake', 'Please enter a positive stake amount.');
      return;
    }
    saveSlipToTracker(numericStake);
    Alert.alert('Slip Logged', `Logged ${slipLegs.length}-leg ticket to your bankroll tracker.`);
    setActiveTab('ledger');
  };

  const applyKellyStake = () => {
    if (metrics.recommendedUnits > 0) {
      setStakeUnits(metrics.recommendedUnits.toString());
    } else {
      setStakeUnits('0.5');
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: tokens.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Tracker Sub-navigation */}
      <View style={[styles.subNavBar, { borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surfaceInset }]}>
        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === 'slip' && { borderBottomColor: tokens.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('slip')}
          activeOpacity={0.7}
        >
          <Text
            variant="label"
            tone={activeTab === 'slip' ? 'brand' : 'secondary'}
            style={{ fontWeight: activeTab === 'slip' ? '800' : '600', letterSpacing: 0.6 }}
          >
            BETSLIP ({slipLegs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === 'ledger' && { borderBottomColor: tokens.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('ledger')}
          activeOpacity={0.7}
        >
          <Text
            variant="label"
            tone={activeTab === 'ledger' ? 'brand' : 'secondary'}
            style={{ fontWeight: activeTab === 'ledger' ? '800' : '600', letterSpacing: 0.6 }}
          >
            BANKROLL & ROI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === 'anchor' && { borderBottomColor: tokens.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('anchor')}
          activeOpacity={0.7}
        >
          <Text
            variant="label"
            tone={activeTab === 'anchor' ? 'brand' : 'secondary'}
            style={{ fontWeight: activeTab === 'anchor' ? '800' : '600', letterSpacing: 0.6 }}
          >
            DAILY ANCHOR
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. BETSLIP BUILDER VIEW */}
      {activeTab === 'slip' ? (
        slipLegs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Layers size={36} color={tokens.colors.borderStrong} />
            <Text variant="title" tone="secondary" style={styles.emptyTitle}>
              Your Betslip is Empty
            </Text>
            <Text variant="bodySm" tone="tertiary" style={styles.emptyDesc}>
              Tap the odds button on any Fixture or "+ Add to Slip" on Edges to build a synergistic ticket.
            </Text>
          </Card>
        ) : (
          <Card style={styles.slipCard}>
            {/* Slip Legs List */}
            <View style={styles.legsList}>
              {slipLegs.map((leg, index) => (
                <View
                  key={leg.prediction_id || index}
                  style={[
                    styles.legItem,
                    { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
                  ]}
                >
                  <View style={styles.legDetails}>
                    <Text variant="label" tone="tertiary">
                      {leg.fixture.toUpperCase()}
                    </Text>
                    <Text variant="title" style={styles.propTitle}>
                      {leg.prop}
                    </Text>
                    <Text variant="label" tone="brand">
                      {leg.bookmaker.toUpperCase()} · {leg.ev}
                    </Text>
                  </View>

                  <View style={styles.legAction}>
                    <Text variant="dataLg" tone="brand">
                      {leg.odds.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => {
                        if (leg.prediction_id) {
                          removeLegFromSlip(leg.prediction_id);
                        } else {
                          clearSlip();
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <X size={16} color={tokens.colors.negative} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Dynamic Mathematical Slip Summary */}
            <Card elevation="inset" style={styles.metricsSummary}>
              <View style={styles.metricRow}>
                <Text variant="label" tone="secondary">
                  COMBINED PARLAY ODDS
                </Text>
                <Text variant="dataHero" tone="brand">
                  {metrics.totalOdds.toFixed(2)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="label" tone="secondary">
                  CALCULATED WIN PROBABILITY
                </Text>
                <Text variant="dataMd">{(metrics.jointProb * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="label" tone="secondary">
                  COMBINED MODEL SURPLUS
                </Text>
                <Text variant="dataMd" tone="brand">
                  +{metrics.jointEv.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="label" tone="secondary">
                  1/4 KELLY ALLOCATION
                </Text>
                <Text variant="dataMd" tone="warning">
                  {metrics.recommendedUnits} Units
                </Text>
              </View>
            </Card>

            {/* Quick Staking Presets */}
            <View style={styles.presetsWrap}>
              <Text variant="label" tone="tertiary">
                QUICK STAKE:
              </Text>
              <View style={styles.presetButtons}>
                {['0.5', '1.0', '2.0'].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      stakeUnits === preset && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                      { borderColor: tokens.colors.border },
                    ]}
                    onPress={() => setStakeUnits(preset)}
                    activeOpacity={0.7}
                  >
                    <Text variant="badge" tone={stakeUnits === preset ? 'brand' : 'secondary'}>
                      {preset}u
                    </Text>
                  </TouchableOpacity>
                ))}

                {metrics.recommendedUnits > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                    ]}
                    onPress={applyKellyStake}
                    activeOpacity={0.7}
                  >
                    <Zap size={11} color={tokens.colors.primary} />
                    <Text variant="badge" tone="brand">
                      Kelly ({metrics.recommendedUnits}u)
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Staking & Payout Calculator */}
            <View style={styles.stakeGrid}>
              <View
                style={[
                  styles.stakeBox,
                  { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
                ]}
              >
                <Text variant="label" tone="tertiary">
                  Stake (Units)
                </Text>
                <TextInput
                  style={[styles.stakeInput, { color: tokens.colors.textPrimary }]}
                  value={stakeUnits}
                  onChangeText={setStakeUnits}
                  keyboardType="numeric"
                  placeholder="1.0"
                  placeholderTextColor={tokens.colors.textTertiary}
                />
              </View>

              <View
                style={[
                  styles.stakeBox,
                  { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                ]}
              >
                <Text variant="label" tone="brand">
                  Est. Payout ({currencySymbol})
                </Text>
                <Text variant="dataLg" tone="brand">
                  {currencySymbol}
                  {potentialPayout.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Buttons: Clear & Log to Tracker */}
            <View style={styles.actionRow}>
              <Button
                label="Clear"
                variant="danger"
                onPress={clearSlip}
                icon={<Trash2 size={16} color={tokens.colors.negative} />}
              />
              <Button
                label="Log to Tracker"
                variant="primary"
                onPress={handleSaveToTracker}
                icon={<Bookmark size={16} color={tokens.colors.onPrimary} />}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )
      ) : null}

      {/* 2. BANKROLL LEDGER VIEW */}
      {activeTab === 'ledger' ? (
        <View style={styles.ledgerSection}>
          {/* Performance Overview Cards */}
          <Card elevation="inset" style={styles.kpiGrid}>
            <MetricTile
              label="TOTAL BANKROLL"
              value={`${currencySymbol}${bankroll.toLocaleString()}`}
              sublabel={`Unit: ${currencySymbol}${unitSize}`}
            />
            <MetricTile
              label="CALCULATED ROI"
              value={`${roiPct >= 0 ? `+${roiPct.toFixed(1)}%` : `${roiPct.toFixed(1)}%`}`}
              tone={roiPct >= 0 ? 'primary' : 'negative'}
            />
            <MetricTile
              label="WIN RATE"
              value={`${winRate.toFixed(1)}%`}
              sublabel={`${wonBets.length}/${settledBets.length} Won`}
              tone="primary"
            />
            <MetricTile
              label="AVG CLV"
              value={`+${avgClv}%`}
              sublabel="Beat Close"
              tone="secondary"
            />
          </Card>

          {/* Ledger Filter Chips */}
          <View style={styles.filterRow}>
            <Text variant="headlineSm" style={styles.sectionTitle}>
              Logged Bets ({filteredBets.length})
            </Text>

            <View style={styles.filterPills}>
              {(['all', 'pending', 'won', 'lost'] as BetResultFilter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterChip,
                    betFilter === f && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                    { borderColor: tokens.colors.border },
                  ]}
                  onPress={() => setBetFilter(f)}
                  activeOpacity={0.7}
                >
                  <Text variant="badge" tone={betFilter === f ? 'brand' : 'secondary'}>
                    {f.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {filteredBets.length === 0 ? (
            <Card style={styles.emptyCard}>
              <TrendingUp size={32} color={tokens.colors.borderStrong} />
              <Text variant="title" tone="secondary" style={styles.emptyTitle}>
                No Bets in Filter
              </Text>
              <Text variant="bodySm" tone="tertiary" style={styles.emptyDesc}>
                Log your custom tickets or individual value picks from the Betslip to track your edge over time.
              </Text>
            </Card>
          ) : (
            filteredBets.map((bet) => (
              <Card key={bet.id} style={styles.betCard}>
                <View style={styles.betHeader}>
                  <View style={styles.betLeft}>
                    <Text variant="label" tone="tertiary">
                      {bet.fixture.toUpperCase()} · {bet.date}
                    </Text>
                    <Text variant="title" style={{ marginTop: 2 }}>{bet.prop}</Text>
                  </View>

                  <View style={styles.betRight}>
                    <Badge
                      label={bet.result.toUpperCase()}
                      tone={bet.result === 'won' ? 'positive' : bet.result === 'lost' ? 'negative' : 'warning'}
                      size="sm"
                    />
                    <Text variant="dataLg" tone="brand" style={{ marginTop: 2 }}>
                      @{bet.odds.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Settle Actions for Pending Bets */}
                {bet.result === 'pending' ? (
                  <View style={[styles.settleRow, { borderTopColor: tokens.colors.border }]}>
                    <Text variant="label" tone="tertiary">
                      Settle Outcome:
                    </Text>
                    <View style={styles.settleButtons}>
                      <TouchableOpacity
                        style={[styles.settleBtn, { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary }]}
                        onPress={() => settleBet(bet.id, 'won')}
                        activeOpacity={0.7}
                      >
                        <Check size={12} color={tokens.colors.primary} />
                        <Text variant="badge" tone="brand">
                          WON
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.settleBtn, { backgroundColor: tokens.colors.negativeSoft, borderColor: tokens.colors.negative }]}
                        onPress={() => settleBet(bet.id, 'lost')}
                        activeOpacity={0.7}
                      >
                        <X size={12} color={tokens.colors.negative} />
                        <Text variant="badge" tone="negative">
                          LOST
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteBtn, { borderColor: tokens.colors.border }]}
                        onPress={() => deleteBet(bet.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color={tokens.colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={[styles.betFooter, { borderTopColor: tokens.colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text variant="dataSm" tone="tertiary">
                      Stake: {bet.stakeUnits}u ({currencySymbol}{bet.stake.toLocaleString()})
                    </Text>
                    {bet.closingLineValue !== undefined ? (
                      <Text variant="badge" tone="brand">
                        +{bet.closingLineValue}% CLV
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    variant="dataSm"
                    tone={bet.pnl > 0 ? 'brand' : bet.pnl < 0 ? 'negative' : 'secondary'}
                  >
                    {bet.result === 'won'
                      ? `+${currencySymbol}${bet.pnl.toLocaleString()}`
                      : bet.result === 'lost'
                        ? `-${currencySymbol}${Math.abs(bet.pnl).toLocaleString()}`
                        : 'Pending Settlement'}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      ) : null}

      {/* 3. DAILY ANCHOR VIEW */}
      {activeTab === 'anchor' ? (
        <View style={styles.anchorSection}>
          <View style={styles.anchorHeader}>
            <Flame size={16} color={tokens.colors.primary} />
            <Text variant="headlineSm">Algorithm's Daily Anchor</Text>
          </View>
          {dailySlip ? <DailySlipCard parlay={dailySlip} /> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingVertical: 12,
    paddingBottom: 96,
  },
  subNavBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  navTab: {
    paddingVertical: 10,
    marginRight: 20,
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    textAlign: 'center',
    maxWidth: 280,
  },
  slipCard: {
    marginHorizontal: 16,
    padding: 14,
  },
  legsList: {
    gap: 10,
    marginBottom: 14,
  },
  legItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  legDetails: {
    flex: 1,
    paddingRight: 8,
    gap: 2,
  },
  propTitle: {
    marginTop: 1,
  },
  legAction: {
    alignItems: 'flex-end',
    gap: 6,
  },
  removeBtn: {
    padding: 4,
  },
  metricsSummary: {
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stakeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  stakeBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  stakeInput: {
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ledgerSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  betCard: {
    padding: 12,
    gap: 8,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  betLeft: {
    flex: 1,
    gap: 2,
  },
  betRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  settleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  settleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  anchorSection: {
    paddingHorizontal: 16,
  },
  anchorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
});
