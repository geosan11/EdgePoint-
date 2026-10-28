import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart2, Check, ChevronDown, ChevronUp, Lock, Plus } from 'lucide-react-native';
import { Prediction } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { DeepAnalyticsModal } from './DeepAnalyticsModal';
import { Badge, Button, Card, MetricTile, ProbabilityBar, StatRow, Text } from './ui';
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

  return (
    <Card style={styles.cardContainer}>
      {/* Top Header: League & Match Info */}
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

        <Text variant="dataSm" tone="tertiary">
          {prediction.commence_time}
        </Text>
      </View>

      {/* Main Prop Line & EdgeScore */}
      <View style={styles.propRow}>
        <View style={styles.propDetails}>
          <Text variant="headlineSm" numberOfLines={1}>
            {prediction.player_name ? prediction.player_name : prediction.match_title}
          </Text>
          <View style={styles.selectionRow}>
            <Text variant="dataMd" tone="brand">
              {prediction.selection} {prediction.line !== undefined ? prediction.line : ''}
            </Text>
            <View style={[styles.marketPill, { backgroundColor: tokens.colors.surfaceInset }]}>
              <Text variant="label" tone="secondary">
                {prediction.market_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <EdgeScoreBadge score={prediction.edge_score} size="md" />
      </View>

      {/* Contextual Intelligence Pills (NBA Pace, EPL xG, Def Rank) */}
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
                {prediction.analysis_notes.game_pace >= 101 ? 'High Pace' : 'Controlled'}
              </Text>
            </View>
          )}

          {prediction.analysis_notes?.combined_xg !== undefined && (
            <View style={[styles.contextChip, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
              <Text variant="dataSm" tone="brand">
                ⚽ {prediction.analysis_notes.combined_xg} xG
              </Text>
              <Text variant="label" tone="secondary">
                Match Expectancy
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

      {/* Model Calculated Probability vs Implied */}
      <View style={styles.probWrap}>
        <ProbabilityBar
          modelProbability={prediction.model_probability}
          impliedProbability={prediction.implied_probability}
        />
      </View>

      {/* Quantitative Breakdown: Fair Odds vs Best Odds & Kelly */}
      <Card elevation="inset" style={styles.metricsGrid}>
        <MetricTile
          label="MODEL EDGE"
          value={`+${prediction.ev_percentage.toFixed(1)}%`}
          sublabel="True EV"
          tone="primary"
        />
        <MetricTile
          label="BEST ODDS"
          value={prediction.sportsbook_odds.toFixed(2)}
          sublabel={prediction.best_bookmaker}
        />
        <MetricTile
          label="FAIR ODDS"
          value={prediction.fair_odds.toFixed(2)}
          sublabel="Vig-stripped"
          tone="secondary"
        />
        <MetricTile
          label="1/4 KELLY"
          value={`${prediction.recommended_units}u`}
          sublabel="Staking"
          tone="tertiary"
        />
      </Card>

      {/* Expandable Matchup Context */}
      {prediction.analysis_notes ? (
        <View style={styles.contextContainer}>
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Text variant="badge" tone="tertiary">
              {expanded ? 'HIDE MATCHUP METRICS' : 'VIEW MATCHUP METRICS'}
            </Text>
            {expanded ? (
              <ChevronUp size={14} color={tokens.colors.textTertiary} />
            ) : (
              <ChevronDown size={14} color={tokens.colors.textTertiary} />
            )}
          </TouchableOpacity>

          {expanded ? (
            <View style={[styles.statsList, { borderColor: tokens.colors.border }]}>
              {prediction.analysis_notes.l5_avg !== undefined ? (
                <StatRow
                  label="L5 Game Average"
                  value={prediction.analysis_notes.l5_avg}
                  projection={prediction.model_projected_stat}
                  delta={prediction.edge_delta}
                  isPositive={prediction.edge_delta ? prediction.edge_delta > 0 : true}
                />
              ) : null}
              {prediction.analysis_notes.opp_def_rank !== undefined ? (
                <StatRow
                  label="Opponent Defensive Rank"
                  value={`#${prediction.analysis_notes.opp_def_rank} in League`}
                  sublabel="Matchup Difficulty"
                />
              ) : null}
              {prediction.analysis_notes.game_pace !== undefined ? (
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
              {prediction.analysis_notes.combined_xg !== undefined ? (
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
      ) : null}

      {/* Action Footer: Add to Bet Slip & Deep Analytics */}
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
          label={inSlip ? 'In Slip' : '+ Add to Slip'}
          variant={inSlip ? 'primary' : 'ghost'}
          icon={inSlip ? <Check size={16} color={tokens.colors.onPrimary} /> : <Plus size={16} color={tokens.colors.textPrimary} />}
          onPress={toggleSlip}
          style={styles.actionBtn}
        />
      </View>

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
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  matchTitleText: {
    flex: 1,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  propDetails: {
    flex: 1,
    gap: 4,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  probWrap: {
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
  },
  contextContainer: {
    marginBottom: 10,
  },
  contextPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
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
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  statsList: {
    borderTopWidth: 1,
    paddingTop: 6,
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
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  footerNote: {
    flex: 1,
  },
  actionBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
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
