import React from 'react';
import { View } from 'react-native';
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

  let alertBadgeText = 'STEAM MOVE';
  let tone: BadgeTone = 'positive';

  if (movement.alert_type === 'reverse_line_movement') {
    alertBadgeText = 'REVERSE LINE MOVE (RLM)';
    tone = 'info';
  } else if (movement.alert_type === 'off_market_line') {
    alertBadgeText = 'OFF-MARKET DIVERGENCE';
    tone = 'warning';
  }

  const toneColor = tone === 'positive' ? tokens.colors.primary : tone === 'info' ? tokens.colors.secondary : tokens.colors.tertiary;

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
      {/* Top Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Badge label={alertBadgeText} tone={tone} icon={<Zap size={11} color={toneColor} />} />
        <Text variant="dataSm" tone="tertiary">
          {movement.created_at}
        </Text>
      </View>

      {/* Match and Selection Info */}
      <Text variant="bodySm" tone="secondary">
        {movement.match_title}
      </Text>
      <Text variant="headlineSm" style={{ marginTop: 2, marginBottom: 10 }}>
        {movement.selection}
      </Text>

      {/* Line Movement & Odds Shift Comparison */}
      <Card elevation="inset" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="label" tone="tertiary" style={{ marginBottom: 4 }}>
            LINE SHIFT
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text variant="dataMd" tone="secondary" style={{ textDecorationLine: 'line-through' }}>
              {movement.opening_line !== undefined ? movement.opening_line : movement.opening_odds.toFixed(2)}
            </Text>
            {isShortening ? (
              <ArrowDownRight size={14} color={tokens.colors.primary} />
            ) : (
              <ArrowUpRight size={14} color={tokens.colors.tertiary} />
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
