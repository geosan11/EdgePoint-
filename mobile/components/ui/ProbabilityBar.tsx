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
            <Text variant="label" tone="tertiary" style={styles.caption}>
              CALCULATED WIN PROBABILITY
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text variant="dataLg" tone="brand">
                {modelPct.toFixed(1)}%
              </Text>
              <Text variant="label" tone="tertiary">
                vs {impliedPct.toFixed(1)}% Implied
              </Text>
            </View>
          </View>

          <View style={[styles.edgePill, { backgroundColor: edgePct >= 0 ? 'rgba(0, 229, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)', borderColor: edgePct >= 0 ? tokens.colors.primary : tokens.colors.negative }]}>
            <Text variant="badge" tone={edgePct >= 0 ? 'brand' : 'negative'}>
              {edgePct >= 0 ? `+${edgePct.toFixed(1)}% PROB SURPLUS` : `${edgePct.toFixed(1)}% NEGATIVE EV`}
            </Text>
          </View>
        </View>
      ) : null}

      {/* High-Precision Probability Spectrum Track */}
      <View
        style={[
          styles.track,
          { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
        ]}
      >
        {/* Implied Breakeven Fill */}
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

        {/* Implied Breakeven Line Indicator */}
        <View
          style={[
            styles.thresholdMarker,
            {
              left: `${impliedPct}%`,
              backgroundColor: '#FFFFFF',
            },
          ]}
        />
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
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  metricItem: {
    gap: 2,
  },
  caption: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  edgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  track: {
    height: 8,
    borderRadius: 4,
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
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 3,
  },
});
