import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';
import { Badge, Card, MetricTile, Text } from '../../components/ui';
import { calculateRecordStats, filterPicksByPeriod, RecordPeriod } from '../../lib/record';
import { getTrackRecord } from '../../lib/supabase';
import { RecordPick } from '../../lib/types';
import { useTheme } from '../../stores/useThemeStore';

export default function RecordScreen() {
  const { tokens } = useTheme();
  const [picks, setPicks] = useState<RecordPick[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<RecordPeriod>('30d');

  const loadData = async () => {
    const res = await getTrackRecord();
    setPicks(res.picks);
    setIsMock(res.isMock);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter picks by selected timeframe
  const filteredPicks = useMemo(() => {
    return filterPicksByPeriod(picks, period);
  }, [picks, period]);

  // Compute stats on filtered picks
  const stats = useMemo(() => {
    return calculateRecordStats(filteredPicks);
  }, [filteredPicks]);

  const periods: { label: string; value: RecordPeriod }[] = [
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: 'All time', value: 'all' },
  ];

  const formatPickDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.background }]}>
      <FlatList
        data={filteredPicks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            {/* 1. Example Data Banner (when using mock data) */}
            {isMock ? (
              <View
                style={[
                  styles.mockBanner,
                  {
                    backgroundColor: tokens.colors.surfaceInset,
                    borderColor: tokens.colors.border,
                  },
                ]}
              >
                <Info size={13} color={tokens.colors.textSecondary} />
                <Text variant="bodySm" tone="secondary">
                  Example data · Sample audited history while live sync connects.
                </Text>
              </View>
            ) : null}

            {/* 2. Screen Title & Subtitle */}
            <View style={styles.titleBlock}>
              <Text variant="headline" style={styles.titleText}>
                Track Record
              </Text>
              <Text variant="body" tone="secondary" style={styles.subtitleText}>
                Every pick the model posted. Losses stay.
              </Text>
            </View>

            {/* 3. Period Filter Chips */}
            <View style={styles.periodRow}>
              {periods.map((p) => {
                const active = period === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.periodChip,
                      {
                        backgroundColor: active
                          ? tokens.colors.primarySoft
                          : tokens.colors.surface,
                        borderColor: active
                          ? tokens.colors.primary
                          : tokens.colors.border,
                      },
                    ]}
                    onPress={() => setPeriod(p.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="label"
                      tone={active ? 'brand' : 'secondary'}
                      style={{ fontWeight: active ? '700' : '500' }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. 2x2 Stat Grid */}
            <Card style={styles.statGridCard}>
              <View style={styles.gridRow}>
                {/* 1. Beat Closing Line */}
                <View style={styles.gridCell}>
                  <Text variant="label" tone="tertiary">
                    BEAT CLOSING LINE
                  </Text>
                  <Text variant="dataHero" tone="brand" style={styles.metricVal}>
                    {stats.beatClosingFormatted}
                  </Text>
                  <Text variant="bodySm" tone="tertiary">
                    {stats.beatClosingCount} of {stats.settledWithClosingCount} settled picks
                  </Text>
                </View>

                <View
                  style={[
                    styles.verticalDivider,
                    { backgroundColor: tokens.colors.border },
                  ]}
                />

                {/* 2. Hit Rate */}
                <View style={styles.gridCell}>
                  <Text variant="label" tone="tertiary">
                    HIT RATE
                  </Text>
                  <Text variant="dataHero" style={styles.metricVal}>
                    {stats.hitRateFormatted}
                  </Text>
                  <Text variant="bodySm" tone="tertiary">
                    vs {stats.avgModelProbFormatted} expected
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.horizontalDivider,
                  { backgroundColor: tokens.colors.border },
                ]}
              />

              <View style={styles.gridRow}>
                {/* 3. Return Per Pick */}
                <View style={styles.gridCell}>
                  <Text variant="label" tone="tertiary">
                    RETURN PER PICK
                  </Text>
                  <Text
                    variant="dataHero"
                    tone={stats.returnPerPickUnits >= 0 ? 'brand' : 'negative'}
                    style={styles.metricVal}
                  >
                    {stats.returnPerPickFormatted}
                  </Text>
                  <Text variant="bodySm" tone="tertiary">
                    Flat 1 unit ({stats.roiFormatted} ROI)
                  </Text>
                </View>

                <View
                  style={[
                    styles.verticalDivider,
                    { backgroundColor: tokens.colors.border },
                  ]}
                />

                {/* 4. Record */}
                <View style={styles.gridCell}>
                  <Text variant="label" tone="tertiary">
                    RECORD (W–L)
                  </Text>
                  <Text variant="dataHero" style={styles.metricVal}>
                    {stats.recordFormatted}
                  </Text>
                  <Text variant="bodySm" tone="tertiary">
                    {stats.pendingCount > 0
                      ? `${stats.pendingCount} pending`
                      : '0 pending'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* 5. Closing Line Explainer Card */}
            <Card
              elevation="inset"
              style={[
                styles.explainerCard,
                { borderColor: tokens.colors.border },
              ]}
            >
              <View style={styles.explainerHeader}>
                <HelpCircle size={14} color={tokens.colors.primary} />
                <Text variant="label" tone="brand">
                  WHY CLOSING LINE MATTERS
                </Text>
              </View>
              <Text variant="bodySm" tone="secondary" style={{ marginTop: 4 }}>
                Closing line = the sportsbook's final price before kickoff.
                Beating it more often than not is the best sign the model finds real value.
              </Text>
            </Card>

            {/* List Header */}
            <View style={styles.listHeaderRow}>
              <Text variant="label" tone="tertiary">
                PICK HISTORY ({filteredPicks.length})
              </Text>
              <Text variant="label" tone="tertiary">
                STATUS
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const beatClose =
            item.closing_odds !== undefined && item.posted_odds > item.closing_odds;

          const pillTone =
            item.result === 'won'
              ? 'positive'
              : item.result === 'lost'
                ? 'negative'
                : 'neutral';

          const pillLabel = item.result.toUpperCase();

          return (
            <Card style={styles.pickRowCard}>
              <View style={styles.pickInfo}>
                <View style={styles.metaRow}>
                  <Text variant="label" tone="tertiary">
                    {item.league.toUpperCase()} · {item.market.toUpperCase()}
                  </Text>
                </View>
                <Text variant="title" numberOfLines={1} style={styles.selectionTitle}>
                  {item.selection}
                </Text>

                <View style={styles.oddsLine}>
                  <Text variant="bodySm" tone="secondary">
                    Posted{' '}
                    <Text variant="dataSm" tone="brand" style={{ fontWeight: '700' }}>
                      {item.posted_odds.toFixed(2)}
                    </Text>
                  </Text>
                  {item.closing_odds !== undefined ? (
                    <>
                      <Text variant="bodySm" tone="tertiary">
                        {' '}·{' '}
                      </Text>
                      <Text variant="bodySm" tone="secondary">
                        Closed{' '}
                        <Text
                          variant="dataSm"
                          tone={beatClose ? 'brand' : 'tertiary'}
                        >
                          {item.closing_odds.toFixed(2)}
                        </Text>
                      </Text>
                    </>
                  ) : null}
                  <Text variant="bodySm" tone="tertiary">
                    {' '}· {formatPickDate(item.posted_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.statusCol}>
                <Badge label={pillLabel} tone={pillTone} size="sm" filled={item.result === 'won'} />
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          <View style={styles.footerWrap}>
            <Text variant="bodySm" tone="tertiary" style={styles.disclaimerText}>
              Analysis, not betting advice. Edges can lose.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 96,
  },
  headerArea: {
    marginBottom: 8,
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  titleBlock: {
    marginBottom: 14,
  },
  titleText: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  subtitleText: {
    marginTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  statGridCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  metricVal: {
    marginTop: 4,
    marginBottom: 2,
  },
  verticalDivider: {
    width: 1,
  },
  horizontalDivider: {
    height: 1,
  },
  explainerCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  pickRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  pickInfo: {
    flex: 1,
    marginRight: 12,
  },
  metaRow: {
    marginBottom: 2,
  },
  selectionTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  oddsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  footerWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    textAlign: 'center',
  },
});
