import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Activity, BarChart2, Check, Plus, ShieldCheck, Target, X, Zap } from 'lucide-react-native';
import { getDeepAnalytics } from '../lib/supabase';
import { Prediction } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, Text } from './ui';

interface DeepAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  prediction: Prediction;
}

export function DeepAnalyticsModal({ visible, onClose, prediction }: DeepAnalyticsModalProps) {
  const { tokens } = useTheme();
  const { isLegInSlip, addLegToSlip, removeLegFromSlip } = useBetStore();

  const inSlip = isLegInSlip(prediction.id);
  const analytics = getDeepAnalytics(prediction.id);

  const toggleSlip = () => {
    if (inSlip) {
      removeLegFromSlip(prediction.id);
    } else {
      addLegToSlip(prediction);
    }
  };

  const lineValue = prediction.line !== undefined ? prediction.line : 2.5;
  const maxBarValue = Math.max(
    ...analytics.l10Logs.map((l) => l.value),
    lineValue * 1.3
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: tokens.colors.overlay }]}>
        <View style={[styles.modalSheet, { backgroundColor: tokens.colors.background, borderColor: tokens.colors.border }]}>
          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: tokens.colors.border }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Badge
                  label={analytics.convictionGrade === 'A+' ? 'GRADE A+ CONVICTION' : 'GRADE A CONVICTION'}
                  tone="positive"
                  filled
                  icon={<Zap size={11} color={tokens.colors.onPrimary} />}
                  size="sm"
                />
                <Text variant="dataSm" tone="brand">
                  +{prediction.ev_percentage.toFixed(1)}% True EV
                </Text>
              </View>
              <Text variant="headlineSm" numberOfLines={1}>
                {prediction.player_name || prediction.match_title}
              </Text>
              <Text variant="dataSm" tone="secondary">
                {prediction.selection} {prediction.line !== undefined ? prediction.line : ''} ·{' '}
                {prediction.market_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { borderColor: tokens.colors.border }]} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={tokens.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Quantitative Conviction Summary */}
            <Card elevation="inset" style={styles.cushionCard}>
              <View style={styles.cushionRow}>
                <View style={styles.cushionItem}>
                  <Text variant="label" tone="tertiary">
                    MODEL PROJECTION
                  </Text>
                  <Text variant="dataLg" tone="brand">
                    {prediction.model_projected_stat ? prediction.model_projected_stat.toFixed(1) : (lineValue + analytics.projectionCushion).toFixed(1)}
                  </Text>
                  <Text variant="dataSm" tone="secondary">
                    vs {lineValue} Line
                  </Text>
                </View>

                <View style={[styles.dividerVertical, { backgroundColor: tokens.colors.border }]} />

                <View style={styles.cushionItem}>
                  <Text variant="label" tone="tertiary">
                    SAFETY CUSHION
                  </Text>
                  <Text variant="dataLg" tone="brand">
                    +{analytics.projectionCushion.toFixed(1)}
                  </Text>
                  <Text variant="dataSm" tone="secondary">
                    Above Sportsbook
                  </Text>
                </View>

                <View style={[styles.dividerVertical, { backgroundColor: tokens.colors.border }]} />

                <View style={styles.cushionItem}>
                  <Text variant="label" tone="tertiary">
                    CALCULATED WIN %
                  </Text>
                  <Text variant="dataLg" tone="brand">
                    {(prediction.model_probability * 100).toFixed(1)}%
                  </Text>
                  <Text variant="dataSm" tone="tertiary">
                    Implied: {(prediction.implied_probability * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </Card>

            {/* 2. Last 10 Games Performance Bar Chart */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <BarChart2 size={16} color={tokens.colors.primary} />
                <Text variant="title">Last 10 Games Performance</Text>
                <Badge
                  label={`${analytics.hitRateL10.hits}/${analytics.hitRateL10.total} (${analytics.hitRateL10.pct}%)`}
                  tone={analytics.hitRateL10.pct >= 70 ? 'positive' : 'warning'}
                  size="sm"
                />
              </View>

              <Text variant="bodySm" tone="secondary">
                Target Sportsbook Line:{' '}
                <Text variant="dataSm" tone="brand">
                  {lineValue}
                </Text>
              </Text>

              {/* Bar Chart Container */}
              <View style={styles.chartWrap}>
                {/* Horizontal Target Line Marker */}
                <View
                  style={[
                    styles.targetLine,
                    {
                      bottom: `${(lineValue / maxBarValue) * 100}%`,
                      borderColor: tokens.colors.primary,
                    },
                  ]}
                />

                <View style={styles.barsContainer}>
                  {analytics.l10Logs.map((log, index) => {
                    const barHeightPct = Math.min(100, (log.value / maxBarValue) * 100);
                    return (
                      <View key={index} style={styles.barCol}>
                        <Text variant="label" tone={log.hit ? 'brand' : 'tertiary'} style={styles.barValText}>
                          {log.value}
                        </Text>
                        <View style={[styles.barTrack, { backgroundColor: tokens.colors.surfaceInset }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${barHeightPct}%`,
                                backgroundColor: log.hit ? tokens.colors.primary : tokens.colors.borderStrong,
                              },
                            ]}
                          />
                        </View>
                        <Text variant="label" tone="tertiary" style={styles.barLabelText} numberOfLines={1}>
                          {log.game.split(' ')[1] || log.game}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: tokens.colors.primary }]} />
                  <Text variant="label" tone="secondary">
                    Over Target (Hit)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: tokens.colors.borderStrong }]} />
                  <Text variant="label" tone="secondary">
                    Under Target (Miss)
                  </Text>
                </View>
              </View>
            </Card>

            {/* 3. Key Quantitative Drivers */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Target size={16} color={tokens.colors.primary} />
                <Text variant="title">Model Selection Drivers</Text>
              </View>

              <View style={styles.driversList}>
                {analytics.keyDrivers.map((driver, idx) => (
                  <View key={idx} style={[styles.driverItem, { borderBottomColor: tokens.colors.border }]}>
                    <ShieldCheck size={14} color={tokens.colors.primary} style={{ marginTop: 2 }} />
                    <Text variant="bodySm" tone="secondary" style={styles.driverText}>
                      {driver}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* 4. Multi-Bookmaker Discrepancy Breakdown */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Activity size={16} color={tokens.colors.primary} />
                <Text variant="title">Market Discrepancy Matrix</Text>
              </View>

              <View style={styles.bookGrid}>
                <View style={[styles.bookCol, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.primary }]}>
                  <Text variant="label" tone="brand">
                    PINNACLE (FAIR)
                  </Text>
                  <Text variant="dataMd" tone="brand">
                    {prediction.fair_odds.toFixed(2)}
                  </Text>
                  <Text variant="label" tone="secondary">
                    Zero-Vig Benchmark
                  </Text>
                </View>

                <View style={[styles.bookCol, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
                  <Text variant="label" tone="tertiary">
                    {prediction.best_bookmaker.toUpperCase()}
                  </Text>
                  <Text variant="dataMd" tone="primary">
                    {prediction.sportsbook_odds.toFixed(2)}
                  </Text>
                  <Text variant="label" tone="brand">
                    +{prediction.ev_percentage.toFixed(1)}% EV Edge
                  </Text>
                </View>

                <View style={[styles.bookCol, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
                  <Text variant="label" tone="tertiary">
                    1/4 KELLY
                  </Text>
                  <Text variant="dataMd" tone="warning">
                    {prediction.recommended_units} Units
                  </Text>
                  <Text variant="label" tone="secondary">
                    Risk-Managed
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
            <Button
              label={inSlip ? 'On Watchlist ✓' : '+ Add to Watchlist'}
              variant={inSlip ? 'primary' : 'primary'}
              icon={inSlip ? <Check size={16} color={tokens.colors.onPrimary} /> : <Plus size={16} color={tokens.colors.onPrimary} />}
              onPress={toggleSlip}
              fullWidth
              style={styles.actionBtn}
            />
            <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', marginTop: 10 }}>
              Analysis, not betting advice. Edges can lose.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  cushionCard: {
    padding: 14,
  },
  cushionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cushionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  dividerVertical: {
    width: 1,
    height: 40,
  },
  sectionCard: {
    padding: 14,
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartWrap: {
    height: 140,
    position: 'relative',
    marginTop: 8,
    marginBottom: 4,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 16,
    paddingBottom: 16,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 9,
    marginBottom: 2,
  },
  barTrack: {
    width: 14,
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  barLabelText: {
    fontSize: 8,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  driversList: {
    gap: 8,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  driverText: {
    flex: 1,
    lineHeight: 18,
  },
  bookGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  bookCol: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    minHeight: 46,
  },
});
