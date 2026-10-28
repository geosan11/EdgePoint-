import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Flame, Layers, Lock, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CuratedParlay } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, MetricTile, Text } from './ui';

interface DailySlipCardProps {
  parlay: CuratedParlay;
}

export function DailySlipCard({ parlay }: DailySlipCardProps) {
  const router = useRouter();
  const { isPro, openPaywall } = useBetStore();
  const { tokens } = useTheme();

  const isLocked = parlay.tier === 'pro' && !isPro;

  const handleLoadSlip = () => {
    if (isLocked) {
      openPaywall();
      return;
    }
    useBetStore.setState({ slipLegs: parlay.legs });
    router.push('/(tabs)/tracker');
  };

  return (
    <Card style={styles.card}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.titleWrap}>
          <Flame size={16} color={tokens.colors.primary} />
          <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
            {parlay.title}
          </Text>
        </View>
        <Badge label={`+${parlay.combined_ev_percentage}% EV`} tone="positive" size="sm" />
      </View>

      {/* Parlay Stats Bar */}
      <Card elevation="inset" style={styles.statsBar}>
        <MetricTile label="TOTAL ODDS" value={parlay.total_sportsbook_odds.toFixed(2)} tone="primary" />
        <MetricTile label="FAIR ODDS" value={parlay.total_fair_odds.toFixed(2)} />
        <MetricTile label="WIN PROB" value={`${(parlay.model_win_probability * 100).toFixed(1)}%`} />
        <MetricTile
          label="SYNERGY"
          value={`+${Math.round((parlay.correlation_score - 1.0) * 100)}%`}
          tone="secondary"
        />
      </Card>

      {/* Legs List */}
      <View style={styles.legsList}>
        {parlay.legs.map((leg, index) => (
          <View
            key={index}
            style={[
              styles.legItem,
              { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
            ]}
          >
            <View
              style={[
                styles.legIndex,
                { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border },
              ]}
            >
              <Text variant="dataSm" tone="brand">
                {index + 1}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodySm" tone="secondary">
                {leg.fixture}
              </Text>
              <Text variant="title">{leg.prop}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text variant="dataMd" tone="brand">
                {leg.odds.toFixed(2)}
              </Text>
              <Text variant="dataSm" tone="tertiary">
                {leg.bookmaker}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Analytical Reasoning */}
      {parlay.summary_analysis ? (
        <View
          style={[
            styles.analysisBox,
            { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
          ]}
        >
          <Sparkles size={14} color={tokens.colors.primary} style={{ marginTop: 2 }} />
          <Text variant="bodySm" tone="secondary" style={{ flex: 1 }}>
            {parlay.summary_analysis}
          </Text>
        </View>
      ) : null}

      {/* Action CTA */}
      <Button
        label={isLocked ? 'Unlock PointBlank Daily Anchor' : 'Add All to Watchlist'}
        variant="primary"
        fullWidth
        onPress={handleLoadSlip}
        icon={<Layers size={16} color={tokens.colors.onPrimary} />}
      />

      {/* Gated Pro Overlay */}
      {isLocked ? (
        <View style={[styles.lockedOverlay, { backgroundColor: tokens.colors.overlay }]}>
          <View style={styles.lockedContent}>
            <Lock size={24} color={tokens.colors.primary} />
            <Text variant="headlineSm" style={{ marginTop: 8, marginBottom: 4 }}>
              PointBlank Exclusive
            </Text>
            <Text variant="bodySm" tone="secondary" style={styles.lockedDesc}>
              Unlock the highest expected value correlated ticket across NBA and Premier League.
            </Text>
            <Button label="Unlock with EdgePoint+" variant="primary" onPress={openPaywall} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    padding: 14,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 14,
  },
  legsList: {
    gap: 8,
    marginBottom: 12,
  },
  legItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    gap: 10,
  },
  legIndex: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
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
  },
  lockedContent: {
    alignItems: 'center',
    maxWidth: 290,
  },
  lockedDesc: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
