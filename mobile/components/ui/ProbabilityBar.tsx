import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../stores/useThemeStore';

interface ProbabilityBarProps {
  modelProbability: number; // e.g. 0.618 (61.8%)
  impliedProbability: number; // e.g. 0.524 (52.4%)
  showLabels?: boolean;
}

export function ProbabilityBar({
  modelProbability,
  impliedProbability,
  showLabels = true,
}: ProbabilityBarProps) {
  const { tokens } = useTheme();

  const modelPct = Math.min(Math.max(modelProbability * 100, 0), 100);
  const impliedPct = Math.min(Math.max(impliedProbability * 100, 0), 100);
  const edgePct = modelPct - impliedPct;

  return (
    <View style={styles.container}>
      {showLabels ? (
        <View style={styles.labelRow}>
          <View style={styles.metricItem}>
            <Text variant="badge" tone="secondary" style={styles.caption}>
              CALCULATED WIN RATE
            </Text>
            <Text variant="dataSm" tone="brand">
              {modelPct.toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
            <Text variant="badge" tone="tertiary" style={styles.caption}>
              IMPLIED / EDGE
            </Text>
            <Text variant="dataSm" tone={edgePct > 0 ? 'brand' : 'negative'}>
              {impliedPct.toFixed(1)}% ({edgePct >= 0 ? `+${edgePct.toFixed(1)}%` : `${edgePct.toFixed(1)}%`})
            </Text>
          </View>
        </View>
      ) : null}

      {/* Progress Track */}
      <View
        style={[
          styles.track,
          { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
        ]}
      >
        {/* Bookmaker Implied Fill */}
        <View
          style={[
            styles.impliedFill,
            {
              width: `${impliedPct}%`,
              backgroundColor: tokens.colors.borderStrong,
            },
          ]}
        />
        {/* Model Edge Margin (if model > implied) */}
        {edgePct > 0 ? (
          <View
            style={[
              styles.edgeFill,
              {
                left: `${impliedPct}%`,
                width: `${Math.min(edgePct, 100 - impliedPct)}%`,
                backgroundColor: tokens.colors.primary,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    gap: 2,
  },
  caption: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  track: {
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  impliedFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  edgeFill: {
    height: '100%',
    position: 'absolute',
    top: 0,
  },
});
