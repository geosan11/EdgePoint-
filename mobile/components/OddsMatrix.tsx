import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, Check, Sparkles, TrendingUp } from 'lucide-react-native';
import { BOOKS, BookConfig, BookId } from '../lib/books';
import { MatchFixture } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { todayTheme } from '../theme/todayTheme';

export interface OddsMatrixProps {
  match: MatchFixture;
  onSelectOdd?: (market: string, pick: string, odds: number, bookmaker: string) => void;
}

interface MatrixRowDef {
  key: string;
  category: string;
  label: string;
  marketKey: 'moneyline' | 'spread' | 'total';
  side: 'home' | 'away' | 'over' | 'under' | 'draw';
  pick: string;
  getSportyOdds: (match: MatchFixture) => number | undefined;
  getLineText?: (match: MatchFixture) => string | undefined;
}

export function OddsMatrix({ match, onSelectOdd }: OddsMatrixProps) {
  const { toggleCustomLeg, isLegInSlip } = useBetStore();
  const isSample = match.dataSource !== 'live';

  const sportyOdds = match.bookOdds?.sportybet;
  const spreadLine = sportyOdds?.spread?.line ?? match.markets?.spread?.line;
  const totalLine = sportyOdds?.total?.line ?? match.markets?.total?.line;
  const hasDraw = sportyOdds?.moneyline?.draw !== undefined || match.markets?.moneyline?.draw !== undefined;

  const awayShort = match.awayTeam.split(' ').pop() || match.awayTeam;
  const homeShort = match.homeTeam.split(' ').pop() || match.homeTeam;

  // Build matrix rows dynamically
  const rows: MatrixRowDef[] = [];

  // Spread rows
  if (spreadLine !== undefined) {
    const awaySpreadStr = spreadLine > 0 ? `+${spreadLine}` : `${spreadLine}`;
    const homeSpreadStr = -spreadLine > 0 ? `+${-spreadLine}` : `${-spreadLine}`;

    rows.push({
      key: 'spread_away',
      category: 'SPREAD',
      label: `${awayShort} ${awaySpreadStr}`,
      marketKey: 'spread',
      side: 'away',
      pick: `${match.awayTeam} ${awaySpreadStr}`,
      getSportyOdds: (m) => m.bookOdds?.sportybet?.spread?.awayOdds,
      getLineText: () => awaySpreadStr,
    });
    rows.push({
      key: 'spread_home',
      category: 'SPREAD',
      label: `${homeShort} ${homeSpreadStr}`,
      marketKey: 'spread',
      side: 'home',
      pick: `${match.homeTeam} ${homeSpreadStr}`,
      getSportyOdds: (m) => m.bookOdds?.sportybet?.spread?.homeOdds,
      getLineText: () => homeSpreadStr,
    });
  }

  // Total rows
  if (totalLine !== undefined) {
    rows.push({
      key: 'total_over',
      category: 'TOTAL',
      label: `Over ${totalLine}`,
      marketKey: 'total',
      side: 'over',
      pick: `Over ${totalLine}`,
      getSportyOdds: (m) => m.bookOdds?.sportybet?.total?.overOdds,
      getLineText: () => `O ${totalLine}`,
    });
    rows.push({
      key: 'total_under',
      category: 'TOTAL',
      label: `Under ${totalLine}`,
      marketKey: 'total',
      side: 'under',
      pick: `Under ${totalLine}`,
      getSportyOdds: (m) => m.bookOdds?.sportybet?.total?.underOdds,
      getLineText: () => `U ${totalLine}`,
    });
  }

  // Moneyline rows
  rows.push({
    key: 'ml_away',
    category: 'MONEYLINE',
    label: `${awayShort} ML`,
    marketKey: 'moneyline',
    side: 'away',
    pick: `${match.awayTeam} ML`,
    getSportyOdds: (m) => m.bookOdds?.sportybet?.moneyline?.away,
  });

  if (hasDraw) {
    rows.push({
      key: 'ml_draw',
      category: 'MONEYLINE',
      label: 'Draw',
      marketKey: 'moneyline',
      side: 'draw',
      pick: 'Draw',
      getSportyOdds: (m) => m.bookOdds?.sportybet?.moneyline?.draw,
    });
  }

  rows.push({
    key: 'ml_home',
    category: 'MONEYLINE',
    label: `${homeShort} ML`,
    marketKey: 'moneyline',
    side: 'home',
    pick: `${match.homeTeam} ML`,
    getSportyOdds: (m) => m.bookOdds?.sportybet?.moneyline?.home,
  });

  const isEdgeCell = (row: MatrixRowDef, bookId: BookId) => {
    // Only active books with real model edges are highlighted
    if (bookId !== 'sportybet') return false;
    const edge = match.modelEdge;
    if (!edge || !edge.marketKey) return false;
    if (edge.marketKey !== row.marketKey) return false;
    if (edge.side && edge.side !== row.side) return false;
    return true;
  };

  const handleCellPress = (row: MatrixRowDef, odds: number, bookmaker: string) => {
    const legId = `${match.id}_${row.key}`;
    if (onSelectOdd) {
      onSelectOdd(row.category, row.pick, odds, bookmaker);
    } else {
      toggleCustomLeg({
        prediction_id: legId,
        fixture: `${match.awayTeam} @ ${match.homeTeam}`,
        prop: `${row.category}: ${row.pick}`,
        selection: row.pick,
        odds,
        ev: isEdgeCell(row, 'sportybet') && match.modelEdge
          ? `+${match.modelEdge.edgePct.toFixed(1)}% EV`
          : '+0.0% EV',
        bookmaker,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Matrix Header Strip */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <TrendingUp size={12} color={todayTheme.colors.primary} />
          <Text style={styles.matrixTitle}>ODDS MATRIX · MULTI-BOOK COMPARISON</Text>
        </View>
        {isSample ? (
          <View style={styles.sampleBadge}>
            <AlertCircle size={10} color={todayTheme.colors.sampleAmber} />
            <Text style={styles.sampleBadgeText}>SAMPLE</Text>
          </View>
        ) : null}
      </View>

      {/* Horizontally scrollable table with fixed column widths */}
      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {/* Header Row: Markets label column + Bookmaker Columns */}
          <View style={styles.headerRow}>
            <View style={styles.marketLabelCol}>
              <Text style={styles.colHeaderLabel}>MARKET</Text>
            </View>

            {BOOKS.map((book) => {
              const isSporty = book.id === 'sportybet';
              const isComingSoon = book.status === 'coming_soon';

              return (
                <View key={book.id} style={styles.bookColHeader}>
                  <Text
                    style={[
                      styles.bookName,
                      isSporty && !isSample && { color: todayTheme.colors.textPrimary },
                      isSporty && isSample && { color: todayTheme.colors.textSecondary },
                      isComingSoon && { color: todayTheme.colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {isSporty ? (isSample ? 'SportyBet (sample)' : 'SportyBet') : book.label}
                  </Text>
                  {isComingSoon ? (
                    <View style={styles.soonPill}>
                      <Text style={styles.soonPillText}>
                        {'role' in book && book.role === 'sharp_benchmark' ? 'Benchmark' : 'Soon'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Data Rows */}
          {rows.map((row, idx) => {
            const isLast = idx === rows.length - 1;
            const sportyPrice = row.getSportyOdds(match);
            const edge = isEdgeCell(row, 'sportybet');
            const legId = `${match.id}_${row.key}`;
            const isSelected = isLegInSlip(legId);

            return (
              <View
                key={row.key}
                style={[
                  styles.dataRow,
                  isLast && { borderBottomWidth: 0 },
                  idx % 2 === 1 && { backgroundColor: todayTheme.colors.surfaceMuted },
                ]}
              >
                {/* Market Row Label */}
                <View style={styles.marketLabelCol}>
                  <Text style={styles.marketRowText} numberOfLines={1}>
                    {row.label}
                  </Text>
                </View>

                {/* Book Columns */}
                {BOOKS.map((book) => {
                  if (book.id === 'sportybet') {
                    if (sportyPrice !== undefined) {
                      return (
                        <TouchableOpacity
                          key={book.id}
                          style={[
                            styles.cell,
                            edge && !isSelected && styles.edgeCell,
                            isSelected && styles.selectedCell,
                            isSample && !edge && !isSelected && styles.sampleCell,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleCellPress(row, sportyPrice, 'SportyBet')}
                        >
                          <Text
                            style={[
                              styles.cellOdds,
                              edge && !isSelected && { color: todayTheme.colors.primary },
                              isSelected && { color: todayTheme.colors.onPrimary },
                              isSample && !edge && !isSelected && { color: todayTheme.colors.textSecondary },
                            ]}
                          >
                            {sportyPrice.toFixed(2)}
                          </Text>
                          {edge && !isSelected ? (
                            <View style={styles.edgeTag}>
                              <Text style={styles.edgeTagText}>
                                +{match.modelEdge?.edgePct.toFixed(0)}%
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <View key={book.id} style={styles.cell}>
                        <Text style={styles.dashText}>—</Text>
                      </View>
                    );
                  }

                  // Coming soon books: Bet9ja, BetKing, Pinnacle (Sharp Benchmark)
                  return (
                    <View key={book.id} style={styles.cell}>
                      <Text style={styles.dashText}>—</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: todayTheme.colors.surfaceInset,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: todayTheme.colors.border,
    overflow: 'hidden',
    marginTop: 8,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: todayTheme.colors.borderSubtle,
    backgroundColor: todayTheme.colors.surface,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matrixTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: todayTheme.colors.textSecondary,
  },
  sampleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: todayTheme.colors.sampleAmberSoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.sampleAmberBorder,
  },
  sampleBadgeText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: todayTheme.colors.sampleAmber,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  grid: {
    minWidth: 480,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: todayTheme.colors.border,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  marketLabelCol: {
    width: 116,
    paddingRight: 8,
    justifyContent: 'center',
  },
  colHeaderLabel: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 9,
    letterSpacing: 0.7,
    color: todayTheme.colors.textTertiary,
  },
  bookColHeader: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bookName: {
    fontFamily: todayTheme.fonts.hanken.semiBold,
    fontSize: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  soonPill: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: todayTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: todayTheme.colors.borderSubtle,
  },
  soonPillText: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 8,
    color: todayTheme.colors.textMuted,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: todayTheme.colors.borderSubtle,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  marketRowText: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 11,
    color: todayTheme.colors.textSecondary,
  },
  cell: {
    width: 92,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 5,
    marginHorizontal: 1,
  },
  sampleCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  edgeCell: {
    backgroundColor: todayTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.primaryBorder,
  },
  selectedCell: {
    backgroundColor: todayTheme.colors.primary,
  },
  cellOdds: {
    fontFamily: todayTheme.fonts.mono.semiBold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: todayTheme.colors.textPrimary,
  },
  dashText: {
    fontFamily: todayTheme.fonts.mono.regular,
    fontSize: 12,
    color: todayTheme.colors.textDisabled,
  },
  edgeTag: {
    position: 'absolute',
    top: -2,
    right: 2,
  },
  edgeTagText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 7,
    color: todayTheme.colors.primary,
  },
});
