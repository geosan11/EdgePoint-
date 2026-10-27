import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, Zap } from 'lucide-react-native';
import { LineMovement } from '../lib/types';
import { useTheme } from '../stores/useThemeStore';
import { Badge, BadgeTone, Card, MetricTile, Text } from './ui';

interface SteamCardProps {
  movement: LineMovement;
}

export function SteamCard({ movement }: SteamCardProps) {
  const { tokens } = useTheme();
  const isShortening = movement.steam_direction === 'shortening';

  let alertBadgeText = 'SHARP STEAM';
  let tone: BadgeTone = 'positive';

  if (movement.alert_type === 'reverse_line_movement') {
    alertBadgeText = 'REVERSE LINE MOVE (RLM)';
    tone = 'info';
  } else if (movement.alert_type === 'off_market_line') {
    alertBadgeText = 'OFF-MARKET DIVERGENCE';
    tone = 'warning';
  }

  const toneColor =
    tone === 'positive'
      ? tokens.colors.primary
      : tone === 'info'
        ? tokens.colors.secondary
        : tokens.colors.warning;

  return (
    <Card style={styles.card}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Badge label={alertBadgeText} tone={tone} icon={<Zap size={11} color={toneColor} />} size="sm" />
        <Text variant="dataSm" tone="tertiary">
          {movement.created_at}
        </Text>
      </View>

      {/* Match and Selection Info */}
      <Text variant="bodySm" tone="secondary">
        {movement.match_title}
      </Text>
      <Text variant="headlineSm" style={styles.selectionTitle}>
        {movement.selection}
      </Text>

      {/* Line Movement & Odds Shift Comparison */}
      <Card elevation="inset" style={styles.metricsBox}>
        <View style={styles.shiftCol}>
          <Text variant="label" tone="tertiary">
            LINE SHIFT
          </Text>
          <View style={styles.shiftValues}>
            <Text variant="dataMd" tone="secondary" style={styles.struckLine}>
              {movement.opening_line !== undefined ? movement.opening_line : movement.opening_odds.toFixed(2)}
            </Text>
            {isShortening ? (
              <ArrowDownRight size={14} color={tokens.colors.primary} />
            ) : (
              <ArrowUpRight size={14} color={tokens.colors.warning} />
            )}
            <Text variant="dataMd" tone="brand">
              {movement.current_line !== undefined ? movement.current_line : movement.current_odds.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Divergent Book vs Sharp Book */}
        <MetricTile
          label="MARKET DIVERGENCE"
          value={`+${movement.divergence_percentage}%`}
          sublabel={`${movement.sharp_book} vs ${movement.divergent_book}`}
          tone="secondary"
          align="flex-end"
        />
      </Card>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 6,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  selectionTitle: {
    marginBottom: 8,
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  shiftCol: {
    gap: 4,
  },
  shiftValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  struckLine: {
    textDecorationLine: 'line-through',
  },
});
