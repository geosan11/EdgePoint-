import React from 'react';
import { View } from 'react-native';
import { Flame, Layers, Lock, Sparkles } from 'lucide-react-native';
import { CuratedParlay } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, MetricTile, Text } from './ui';

interface DailySlipCardProps {
  parlay: CuratedParlay;
}

export function DailySlipCard({ parlay }: DailySlipCardProps) {
  const { isPro, openPaywall } = useBetStore();
  const { tokens } = useTheme();

  const isLocked = parlay.tier === 'pro' && !isPro;

  const handleLoadSlip = () => {
    if (isLocked) {
      openPaywall();
      return;
    }
    useBetStore.setState({ slipLegs: parlay.legs });
  };

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
      {/* Top Banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
          <Flame size={16} color={tokens.colors.primary} />
          <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
            {parlay.title}
          </Text>
        </View>
        <Badge label={`+${parlay.combined_ev_percentage}% EV`} tone="positive" />
      </View>

      {/* Parlay Stats Bar */}
      <Card elevation="inset" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <MetricTile label="TOTAL ODDS" value={parlay.total_sportsbook_odds.toFixed(2)} tone="primary" />
        <MetricTile label="FAIR ODDS" value={parlay.total_fair_odds.toFixed(2)} />
        <MetricTile label="WIN PROB" value={`${(parlay.model_win_probability * 100).toFixed(1)}%`} />
        <MetricTile
          label="CORRELATION"
          value={`+${Math.round((parlay.correlation_score - 1.0) * 100)}%`}
          tone="secondary"
        />
      </Card>

      {/* Legs List */}
      <View style={{ gap: 8, marginBottom: 12 }}>
        {parlay.legs.map((leg, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: tokens.colors.surfaceInset,
              borderRadius: tokens.radius.lg,
              padding: 10,
              borderWidth: 1,
              borderColor: tokens.colors.border,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: tokens.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Text variant="dataSm" tone="brand">
                {index + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodySm" tone="secondary">
                {leg.fixture}
              </Text>
              <Text variant="title" style={{ marginTop: 1 }}>
                {leg.prop}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="dataMd" tone="info">
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
      {parlay.summary_analysis && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: tokens.colors.secondarySoft,
            borderWidth: 1,
            borderColor: tokens.colors.secondary,
            borderRadius: tokens.radius.lg,
            padding: 9,
            marginBottom: 14,
            gap: 6,
          }}
        >
          <Sparkles size={12} color={tokens.colors.secondary} />
          <Text variant="bodySm" tone="secondary" style={{ flex: 1 }}>
            {parlay.summary_analysis}
          </Text>
        </View>
      )}

      {/* Action CTA */}
      <Button
        label={isLocked ? 'Unlock PointBlank Daily Slip' : 'Load All Legs Into Betslip'}
        variant="primary"
        fullWidth
        onPress={handleLoadSlip}
        icon={<Layers size={16} color={tokens.colors.onPrimary} />}
      />

      {/* Gated Pro Overlay */}
      {isLocked && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: tokens.colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View style={{ alignItems: 'center', maxWidth: 290 }}>
            <Lock size={24} color={tokens.colors.primary} />
            <Text variant="headlineSm" style={{ marginTop: 8, marginBottom: 4 }}>
              PointBlank Exclusive
            </Text>
            <Text variant="bodySm" tone="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
              Unlock the highest expected value correlated parlay of the day.
            </Text>
            <Button label="Unlock with EdgePoint+" variant="primary" onPress={openPaywall} />
          </View>
        </View>
      )}
    </Card>
  );
}
