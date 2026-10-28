import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart2, Check, ChevronDown, ChevronUp, Lock, Plus, Sparkles, TrendingUp, Zap } from 'lucide-react-native';
import { Prediction } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { DeepAnalyticsModal } from './DeepAnalyticsModal';
import { Badge, Button, Card, ProbabilityBar, StatRow, Text } from './ui';
import { EdgeScoreBadge } from './EdgeScoreBadge';

interface EdgeCardProps {
  prediction: Prediction;
}

export function EdgeCard({ prediction }: EdgeCardProps) {
  const { isPro, openPaywall, addLegToSlip, removeLegFromSlip, isLegInSlip } = useBetStore();
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  const isLocked = prediction.tier === 'pro' && !isPro;
  const inSlip = isLegInSlip(prediction.id);

  const toggleSlip = () => {
    if (inSlip) {
      removeLegFromSlip(prediction.id);
    } else {
      addLegToSlip(prediction);
    }
  };

  const leagueTone = prediction.sport === 'basketball' ? 'positive' : 'info';
  const cushion = prediction.edge_delta !== undefined
    ? prediction.edge_delta
    : prediction.model_projected_stat && prediction.line
      ? prediction.model_projected_stat - prediction.line
      : null;

  return (
    <Card style={styles.cardContainer}>
      {/* 1. Top Header: League, Matchup, EdgeScore */}
      <View style={[styles.cardHeader, { borderBottomColor: tokens.colors.border }]}>
        <View style={styles.headerLeft}>
          <Badge
            label={prediction.league_name || (prediction.sport === 'basketball' ? 'NBA 🏀' : 'EPL ⚽')}
            tone={leagueTone}
            size="sm"
          />
          <Text variant="bodySm" tone="secondary" style={styles.matchTitleText} numberOfLines={1}>
            {prediction.match_title}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text variant="dataSm" tone="tertiary">
            {prediction.commence_time}
          </Text>
          <EdgeScoreBadge score={prediction.edge_score} size="md" />
        </View>
      </View>

      {/* 2. Main Selection Hero Banner */}
      <View style={styles.propHeroSection}>
        <View style={styles.propDetails}>
          <Text variant="headline" numberOfLines={1} style={styles.playerName}>
            {prediction.player_name ? prediction.player_name : prediction.match_title}
          </Text>

          <View style={styles.selectionRow}>
            <Text variant="dataLg" tone="brand">
              {prediction.selection} {prediction.line !== undefined ? prediction.line : ''}
            </Text>
            <View style={[styles.marketPill, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
              <Text variant="label" tone="secondary">
                {prediction.market_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            {cushion !== null ? (
              <View style={[styles.cushionPill, { backgroundColor: 'rgba(0, 229, 153, 0.12)', borderColor: tokens.colors.primary }]}>
                <Sparkles size={10} color={tokens.colors.primary} />
                <Text variant="badge" tone="brand">
                  +{cushion.toFixed(1)} CUSHION
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* 3. Contextual Intelligence Chips */}
      {(prediction.analysis_notes?.game_pace !== undefined ||
        prediction.analysis_notes?.combined_xg !== undefined ||
        prediction.analysis_notes?.opp_def_rank !== undefined) && (
        <View style={styles.contextPillsRow}>
          {prediction.analysis_notes?.game_pace !== undefined && (
            <View style={[styles.contextChip, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
              <Text variant="dataSm" tone={prediction.analysis_notes.game_pace >= 101 ? 'brand' : 'tertiary'}>
                ⚡ {prediction.analysis_notes.game_pace} Pace
              </Text>
              <Text variant="label" tone="secondary">
                {prediction.analysis_notes.game_pace >= 101 ? 'Fast' : 'Controlled'}
              </Text>
            </View>
          )}

          {prediction.analysis_notes?.combined_xg !== undefined && (
            <View style={[styles.contextChip, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
              <Text variant="dataSm" tone="brand">
                ⚽ {prediction.analysis_notes.combined_xg} xG
              </Text>
              <Text variant="label" tone="secondary">
                Expectancy
              </Text>
            </View>
          )}

          {prediction.analysis_notes?.opp_def_rank !== undefined && (
            <View style={[styles.contextChip, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
              <Text
                variant="dataSm"
                tone={prediction.analysis_notes.opp_def_rank >= 20 ? 'brand' : 'secondary'}
              >
                🛡️ #{prediction.analysis_notes.opp_def_rank} Def Rank
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 4. Model Calculated Probability Spectrum */}
      <View style={styles.probWrap}>
        <ProbabilityBar
          modelProbability={prediction.model_probability}
          impliedProbability={prediction.implied_probability}
        />
      </View>

      {/* 5. Quantitative Arbitrage Matrix Strip */}
      <View style={[styles.arbitrageStrip, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
        <View style={styles.arbitrageCol}>
          <Text variant="label" tone="tertiary">
            MODEL EDGE
          </Text>
          <Text variant="dataHero" tone="brand">
            +{prediction.ev_percentage.toFixed(1)}%
          </Text>
          <Text variant="label" tone="secondary">
            Expected Value
          </Text>
        </View>

        <View style={[styles.stripDivider, { backgroundColor: tokens.colors.border }]} />

        <View style={styles.arbitrageCol}>
          <Text variant="label" tone="tertiary">
            MARKET SPREAD
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text variant="dataLg" tone="primary">
              @{prediction.sportsbook_odds.toFixed(2)}
            </Text>
            <Text variant="label" tone="tertiary">
              vs {prediction.fair_odds.toFixed(2)}
            </Text>
          </View>
          <Text variant="label" tone="secondary">
            {prediction.best_bookmaker} vs Fair
          </Text>
        </View>

      </View>

      {/* 6. Expandable Matchup Context */}
      {(
        <View style={styles.contextContainer}>
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Text variant="badge" tone="tertiary">
              {expanded ? 'HIDE THE MATH' : 'SHOW THE MATH'}
            </Text>
            {expanded ? (
              <ChevronUp size={13} color={tokens.colors.textTertiary} />
            ) : (
              <ChevronDown size={13} color={tokens.colors.textTertiary} />
            )}
          </TouchableOpacity>

          {expanded ? (
            <View style={[styles.statsList, { borderColor: tokens.colors.border }]}>
              <StatRow
                label="Fair odds vs book"
                value={`${prediction.fair_odds.toFixed(2)} vs ${prediction.sportsbook_odds.toFixed(2)}`}
                sublabel={`Model ${(prediction.model_probability * 100).toFixed(1)}% · Book ${(prediction.implied_probability * 100).toFixed(1)}%`}
              />
              <StatRow
                label="Suggested size (¼ Kelly)"
                value={`${prediction.recommended_units}u`}
                sublabel="Pro figure: share of bankroll the model's edge supports"
              />
              {prediction.analysis_notes?.l5_avg !== undefined ? (
                <StatRow
                  label="L5 Game Average"
                  value={prediction.analysis_notes.l5_avg}
                  projection={prediction.model_projected_stat}
                  delta={prediction.edge_delta}
                  isPositive={prediction.edge_delta ? prediction.edge_delta > 0 : true}
                />
              ) : null}
              {prediction.analysis_notes?.opp_def_rank !== undefined ? (
                <StatRow
                  label="Opponent Defensive Rank"
                  value={`#${prediction.analysis_notes.opp_def_rank} in League`}
                  sublabel="Matchup Difficulty"
                />
              ) : null}
              {prediction.analysis_notes?.game_pace !== undefined ? (
                <View style={styles.expandedMetricBlock}>
                  <StatRow label="Projected Pace" value={`${prediction.analysis_notes.game_pace} Possessions`} />
                  <View style={[styles.meterTrack, { backgroundColor: tokens.colors.surfaceInset }]}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, Math.max(10, ((prediction.analysis_notes.game_pace - 95) / 15) * 100))}%`,
                          backgroundColor: tokens.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
              {prediction.analysis_notes?.combined_xg !== undefined ? (
                <View style={styles.expandedMetricBlock}>
                  <StatRow
                    label="Combined xG Expectancy"
                    value={`${prediction.analysis_notes.combined_xg} Expected Goals`}
                    sublabel={`Home: ${prediction.analysis_notes.home_xg ?? '—'} | Away: ${prediction.analysis_notes.away_xg ?? '—'}`}
                  />
                  <View style={[styles.meterTrack, { backgroundColor: tokens.colors.surfaceInset }]}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, Math.max(10, (prediction.analysis_notes.combined_xg / 5.0) * 100))}%`,
                          backgroundColor: tokens.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      {/* 7. Action Footer: Deep Analytics & Watchlist */}
      <View style={[styles.cardFooter, { borderTopColor: tokens.colors.border }]}>
        <TouchableOpacity
          style={[styles.analyticsTriggerBtn, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surfaceInset }]}
          onPress={() => setAnalyticsVisible(true)}
          activeOpacity={0.7}
        >
          <BarChart2 size={14} color={tokens.colors.primary} />
          <Text variant="badge" tone="brand">
            Deep Analytics
          </Text>
        </TouchableOpacity>

        <Button
          label={inSlip ? 'On Watchlist ✓' : '+ Watchlist'}
          variant={inSlip ? 'primary' : 'primary'}
          icon={inSlip ? <Check size={16} color={tokens.colors.onPrimary} /> : <Plus size={16} color={tokens.colors.onPrimary} />}
          onPress={toggleSlip}
          style={styles.actionBtn}
        />
      </View>

      <Text variant="label" tone="tertiary" style={styles.disclaimer}>
        Model analysis, not a guarantee. Edges can lose.
      </Text>

      {/* Deep Analytics Modal */}
      <DeepAnalyticsModal
        visible={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
        prediction={prediction}
      />

      {/* Pro Tier Lock Screen (if locked) */}
      {isLocked ? (
        <View
          style={[
            styles.lockedOverlay,
            { backgroundColor: tokens.colors.overlay },
          ]}
        >
          <View style={[styles.lockBadge, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.primary }]}>
            <Lock size={16} color={tokens.colors.primary} />
            <Text variant="title" tone="brand">
              Pro Value Pick
            </Text>
          </View>
          <Text variant="bodySm" tone="secondary" style={styles.lockDesc}>
            Unlock sharp probability models, true fair odds, and 1/4 Kelly sizing.
          </Text>
          <Button
            label="Unlock EdgePoint+ Pro"
            variant="primary"
            onPress={openPaywall}
            style={styles.unlockBtn}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    textAlign: 'center',
    marginTop: 8,
  },
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchTitleText: {
    flex: 1,
  },
  propHeroSection: {
    gap: 4,
  },
  propDetails: {
    gap: 4,
  },
  playerName: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  marketPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cushionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  contextPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  probWrap: {
    paddingVertical: 2,
  },
  arbitrageStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  arbitrageCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  stripDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  contextContainer: {
    gap: 4,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  statsList: {
    borderTopWidth: 1,
    paddingTop: 6,
  },
  expandedMetricBlock: {
    paddingVertical: 4,
    gap: 4,
  },
  meterTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    marginTop: 2,
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  analyticsTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtn: {
    minHeight: 42,
    paddingHorizontal: 18,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockDesc: {
    textAlign: 'center',
    maxWidth: 280,
  },
  unlockBtn: {
    minHeight: 44,
    marginTop: 4,
  },
});
