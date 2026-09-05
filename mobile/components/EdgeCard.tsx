import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Lock, Plus } from 'lucide-react-native';
import { Prediction } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, MetricTile, Text } from './ui';
import { EdgeScoreBadge } from './EdgeScoreBadge';

interface EdgeCardProps {
  prediction: Prediction;
}

export function EdgeCard({ prediction }: EdgeCardProps) {
  const { isPro, openPaywall, addLegToSlip, removeLegFromSlip, isLegInSlip } = useBetStore();
  const { tokens } = useTheme();

  const isLocked = prediction.tier === 'pro' && !isPro;
  const inSlip = isLegInSlip(prediction.id);

  const toggleSlip = () => {
    if (inSlip) {
      removeLegFromSlip(prediction.id);
    } else {
      addLegToSlip(prediction);
    }
  };

  return (
    <Card style={styles.cardContainer}>
      {/* Top Header: League & Match Info */}
      <View style={[styles.cardHeader, { borderBottomColor: tokens.colors.border }]}>
        <Badge label={prediction.league_name || prediction.sport.toUpperCase()} tone="info" />
        <Text variant="bodySm" tone="secondary" style={styles.matchTitleText} numberOfLines={1}>
          {prediction.match_title}
        </Text>
        <Text variant="dataSm" tone="tertiary">
          {prediction.commence_time}
        </Text>
      </View>

      {/* Main Prop Line & EdgeScore */}
      <View style={styles.propRow}>
        <View style={styles.propDetails}>
          <Text variant="headlineSm">
            {prediction.player_name ? prediction.player_name : prediction.match_title}
          </Text>
          <View style={styles.selectionRow}>
            <Text variant="dataMd" tone="brand">
              {prediction.selection} {prediction.line !== undefined ? prediction.line : ''}
            </Text>
            <Text
              variant="label"
              tone="secondary"
              style={[styles.marketTypeText, { backgroundColor: tokens.colors.surfaceInset }]}
            >
              {prediction.market_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <EdgeScoreBadge score={prediction.edge_score} size="md" />
      </View>

      {/* Quantitative Breakdown: EV%, EdgeDelta, Odds Comparison */}
      <Card elevation="inset" style={styles.metricsGrid}>
        <MetricTile
          label="EXP. VALUE"
          value={`+${prediction.ev_percentage.toFixed(1)}%`}
          tone="primary"
        />
        <MetricTile
          label="EDGE DELTA (Δ)"
          value={
            prediction.edge_delta !== undefined
              ? prediction.edge_delta > 0
                ? `+${prediction.edge_delta}`
                : `${prediction.edge_delta}`
              : '--'
          }
          sublabel={
            prediction.model_projected_stat !== undefined && prediction.model_projected_stat !== null
              ? `Proj: ${prediction.model_projected_stat}`
              : undefined
          }
          tone="secondary"
        />
        <MetricTile label="BEST ODDS" value={prediction.sportsbook_odds.toFixed(2)} sublabel={prediction.best_bookmaker} />
        <MetricTile label="STAKE REC" value={`${prediction.recommended_units}u`} sublabel="1/4 Kelly" tone="tertiary" />
      </Card>

      {/* Action Footer: Add to Bet Slip */}
      <View style={styles.cardFooter}>
        <Text variant="bodySm" tone="tertiary">
          Fair Model Odds: <Text variant="dataSm" tone="secondary">{prediction.fair_odds.toFixed(2)}</Text>
        </Text>

        <Button
          label={inSlip ? 'In Slip' : 'Add to Slip'}
          variant={inSlip ? 'primary' : 'ghost'}
          onPress={toggleSlip}
          style={inSlip ? undefined : { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primarySoft }}
          icon={
            inSlip ? (
              <Check size={14} color={tokens.colors.onPrimary} />
            ) : (
              <Plus size={14} color={tokens.colors.primary} />
            )
          }
        />
      </View>

      {/* Gated Pro Lock Overlay */}
      {isLocked && (
        <View style={[styles.lockOverlay, { backgroundColor: tokens.colors.overlay }]}>
          <View style={styles.lockCard}>
            <View
              style={[
                styles.lockIconCircle,
                { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
              ]}
            >
              <Lock size={20} color={tokens.colors.primary} />
            </View>
            <Text variant="headlineSm" style={styles.lockTitle}>
              EdgePoint+ Pro Pick
            </Text>
            <Text variant="bodySm" tone="secondary" style={styles.lockDescription}>
              This high-confidence model prediction is exclusively unlocked for EdgePoint+ subscribers.
            </Text>
            <Button label="Unlock with EdgePoint+" variant="primary" onPress={openPaywall} />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  matchTitleText: {
    flex: 1,
    marginHorizontal: 8,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propDetails: {
    flex: 1,
    paddingRight: 10,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  marketTypeText: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Lock Overlay
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lockCard: {
    alignItems: 'center',
    maxWidth: 280,
  },
  lockIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lockTitle: {
    marginBottom: 4,
  },
  lockDescription: {
    textAlign: 'center',
    marginBottom: 14,
  },
});
