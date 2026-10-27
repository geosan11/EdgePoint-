import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Calculator, Check, Info, RefreshCw, Zap } from 'lucide-react-native';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, MetricTile, Text } from './ui';

type MarketFormat = '2way' | '3way';
type DevigMethod = 'multiplicative' | 'power';

export function DevigCalculator() {
  const { tokens } = useTheme();

  const [marketFormat, setMarketFormat] = useState<MarketFormat>('2way');
  const [devigMethod, setDevigMethod] = useState<DevigMethod>('multiplicative');

  // Input states
  const [odd1, setOdd1] = useState('1.91');
  const [odd2, setOdd2] = useState('1.91');
  const [odd3, setOdd3] = useState('3.40'); // For 3-way draw

  // Parse numbers
  const o1 = parseFloat(odd1) || 0;
  const o2 = parseFloat(odd2) || 0;
  const o3 = marketFormat === '3way' ? parseFloat(odd3) || 0 : 0;

  // Implied probabilities: 1 / odds
  const imp1 = o1 > 1.0 ? 1.0 / o1 : 0;
  const imp2 = o2 > 1.0 ? 1.0 / o2 : 0;
  const imp3 = o3 > 1.0 ? 1.0 / o3 : 0;

  const totalOverround = imp1 + imp2 + (marketFormat === '3way' ? imp3 : 0);
  const vigMarginPct = totalOverround > 1.0 ? (totalOverround - 1.0) * 100 : 0;

  // Fair calculations
  let fairProb1 = 0;
  let fairProb2 = 0;
  let fairProb3 = 0;

  if (totalOverround > 0) {
    if (devigMethod === 'multiplicative') {
      fairProb1 = imp1 / totalOverround;
      fairProb2 = imp2 / totalOverround;
      fairProb3 = marketFormat === '3way' ? imp3 / totalOverround : 0;
    } else {
      // Power / Shin approximation
      // Solves (1/o1)^k + (1/o2)^k + (1/o3)^k = 1
      const k = marketFormat === '3way' ? 1.06 : 1.04;
      const p1 = Math.pow(imp1, k);
      const p2 = Math.pow(imp2, k);
      const p3 = marketFormat === '3way' ? Math.pow(imp3, k) : 0;
      const sumP = p1 + p2 + p3;
      fairProb1 = sumP > 0 ? p1 / sumP : 0;
      fairProb2 = sumP > 0 ? p2 / sumP : 0;
      fairProb3 = sumP > 0 && marketFormat === '3way' ? p3 / sumP : 0;
    }
  }

  const fairOdds1 = fairProb1 > 0 ? 1.0 / fairProb1 : 0;
  const fairOdds2 = fairProb2 > 0 ? 1.0 / fairProb2 : 0;
  const fairOdds3 = fairProb3 > 0 ? 1.0 / fairProb3 : 0;

  const setPreset = (oA: string, oB: string, oC?: string) => {
    setOdd1(oA);
    setOdd2(oB);
    if (oC) {
      setOdd3(oC);
      setMarketFormat('3way');
    } else {
      setMarketFormat('2way');
    }
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Calculator size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Devig & Fair Line Calculator</Text>
        </View>
        <Badge
          label={devigMethod === 'multiplicative' ? 'PROPORTIONAL' : 'POWER / SHIN'}
          tone="positive"
          size="sm"
        />
      </View>

      <Text variant="bodySm" tone="secondary">
        Strip bookmaker overround to determine true mathematical fair odds and positive expected value thresholds.
      </Text>

      {/* Mode Controls */}
      <View style={styles.modeRow}>
        <View style={styles.pillGroup}>
          <TouchableOpacity
            style={[
              styles.pillBtn,
              marketFormat === '2way' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
              { borderColor: tokens.colors.border },
            ]}
            onPress={() => setMarketFormat('2way')}
            activeOpacity={0.7}
          >
            <Text variant="badge" tone={marketFormat === '2way' ? 'brand' : 'secondary'}>
              2-Way (O/U, Spread, ML)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillBtn,
              marketFormat === '3way' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
              { borderColor: tokens.colors.border },
            ]}
            onPress={() => setMarketFormat('3way')}
            activeOpacity={0.7}
          >
            <Text variant="badge" tone={marketFormat === '3way' ? 'brand' : 'secondary'}>
              3-Way (Soccer 1X2)
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.methodToggle, { borderColor: tokens.colors.border }]}
          onPress={() => setDevigMethod(devigMethod === 'multiplicative' ? 'power' : 'multiplicative')}
          activeOpacity={0.7}
        >
          <RefreshCw size={12} color={tokens.colors.textSecondary} />
          <Text variant="badge" tone="secondary">
            {devigMethod === 'multiplicative' ? 'Switch to Power' : 'Switch to Proportional'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preset Chips */}
      <View style={styles.presetsRow}>
        <Text variant="badge" tone="tertiary">
          QUICK PRESETS:
        </Text>
        <TouchableOpacity style={styles.presetChip} onPress={() => setPreset('1.91', '1.91')}>
          <Text variant="badge" tone="secondary">
            1.91 / 1.91 (-110)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => setPreset('1.95', '1.87')}>
          <Text variant="badge" tone="secondary">
            1.95 / 1.87
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => setPreset('2.10', '3.40', '3.60')}>
          <Text variant="badge" tone="secondary">
            1X2 Match
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inputs Grid */}
      <View style={styles.inputsGrid}>
        <View style={styles.inputCol}>
          <Text variant="label" tone="secondary">
            Side A / Home Odds
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary },
            ]}
            value={odd1}
            onChangeText={setOdd1}
            keyboardType="numeric"
            placeholder="1.91"
            placeholderTextColor={tokens.colors.textTertiary}
          />
        </View>

        {marketFormat === '3way' ? (
          <View style={styles.inputCol}>
            <Text variant="label" tone="secondary">
              Draw Odds
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary },
              ]}
              value={odd3}
              onChangeText={setOdd3}
              keyboardType="numeric"
              placeholder="3.40"
              placeholderTextColor={tokens.colors.textTertiary}
            />
          </View>
        ) : null}

        <View style={styles.inputCol}>
          <Text variant="label" tone="secondary">
            Side B / Away Odds
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary },
            ]}
            value={odd2}
            onChangeText={setOdd2}
            keyboardType="numeric"
            placeholder="1.91"
            placeholderTextColor={tokens.colors.textTertiary}
          />
        </View>
      </View>

      {/* Quantitative Results Card */}
      <Card elevation="inset" style={styles.resultsCard}>
        <View style={styles.overroundRow}>
          <View style={styles.overroundLeft}>
            <Text variant="label" tone="tertiary">
              BOOKMAKER MARGIN (OVERROUND)
            </Text>
            <Text variant="dataLg" tone={vigMarginPct < 4.0 ? 'brand' : vigMarginPct < 6.5 ? 'secondary' : 'warning'}>
              {vigMarginPct.toFixed(2)}% Vig
            </Text>
          </View>
          <View style={styles.overroundRight}>
            <Text variant="badge" tone="secondary">
              TOTAL VIG: {(totalOverround * 100).toFixed(1)}%
            </Text>
            <Text variant="bodySm" tone="tertiary">
              {vigMarginPct < 3.5 ? 'Sharp / Tight Market' : 'Retail Margin'}
            </Text>
          </View>
        </View>

        {/* Calculated Fair Odds Output */}
        <View style={[styles.fairGrid, { borderTopColor: tokens.colors.border }]}>
          <View style={styles.fairCol}>
            <Text variant="label" tone="tertiary">
              SIDE A FAIR
            </Text>
            <Text variant="dataLg" tone="brand">
              {fairOdds1.toFixed(3)}
            </Text>
            <Text variant="dataSm" tone="secondary">
              {(fairProb1 * 100).toFixed(1)}% Prob
            </Text>
          </View>

          {marketFormat === '3way' ? (
            <View style={styles.fairCol}>
              <Text variant="label" tone="tertiary">
                DRAW FAIR
              </Text>
              <Text variant="dataLg" tone="brand">
                {fairOdds3.toFixed(3)}
              </Text>
              <Text variant="dataSm" tone="secondary">
                {(fairProb3 * 100).toFixed(1)}% Prob
              </Text>
            </View>
          ) : null}

          <View style={styles.fairCol}>
            <Text variant="label" tone="tertiary">
              SIDE B FAIR
            </Text>
            <Text variant="dataLg" tone="brand">
              {fairOdds2.toFixed(3)}
            </Text>
            <Text variant="dataSm" tone="secondary">
              {(fairProb2 * 100).toFixed(1)}% Prob
            </Text>
          </View>
        </View>
      </Card>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  methodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  resultsCard: {
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  overroundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overroundLeft: {
    gap: 2,
  },
  overroundRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  fairGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  fairCol: {
    flex: 1,
    gap: 2,
  },
});
