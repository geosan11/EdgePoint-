import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../stores/useThemeStore';

interface StatRowProps {
  label: string;
  value: string | number;
  projection?: string | number;
  delta?: string | number;
  sublabel?: string;
  isPositive?: boolean;
}

export function StatRow({
  label,
  value,
  projection,
  delta,
  sublabel,
  isPositive = true,
}: StatRowProps) {
  const { tokens } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: tokens.colors.border }]}>
      <View style={styles.left}>
        <Text variant="bodySm" tone="secondary">
          {label}
        </Text>
        {sublabel ? (
          <Text variant="badge" tone="tertiary" style={styles.sublabel}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {projection !== undefined ? (
          <View style={styles.projectionWrap}>
            <Text variant="badge" tone="tertiary">
              PROJ:
            </Text>
            <Text variant="dataSm" tone="primary">
              {projection}
            </Text>
          </View>
        ) : null}

        <Text variant="dataMd" tone="primary">
          {value}
        </Text>

        {delta !== undefined ? (
          <Text
            variant="badge"
            tone={isPositive ? 'brand' : 'negative'}
            style={styles.delta}
          >
            {typeof delta === 'number' && delta > 0 ? `+${delta}` : `${delta}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  sublabel: {
    fontSize: 9,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  projectionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  delta: {
    fontSize: 11,
    fontWeight: '700',
  },
});
