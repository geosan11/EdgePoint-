import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Layers, MapPin, Radio, Zap } from 'lucide-react-native';
import { MatchFixture } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';
import { Badge } from './Badge';
import { Card } from './Card';
import { OddsBadge } from './OddsBadge';
import { Text } from './Text';

interface MatchCardProps {
  match: MatchFixture;
  onSelectOdd?: (market: string, pick: string, odds: number, bookmaker: string) => void;
}

export function MatchCard({ match, onSelectOdd }: MatchCardProps) {
  const { tokens } = useTheme();
  const { toggleCustomLeg, isLegInSlip } = useBetStore();
  const [showMatrix, setShowMatrix] = useState(false);

  const isLive = match.status === 'live';
  const leagueTone = match.league === 'NBA' ? 'positive' : 'info';

  // Consistent Leg IDs for Slip Matching & Toggling
  const spreadLegId = `${match.id}_spread_${match.awayTeam}`;
  const totalLegId = `${match.id}_total_over`;
  const mlLegId = `${match.id}_ml_${match.homeTeam}`;

  const isSpreadSelected = isLegInSlip(spreadLegId);
  const isTotalSelected = isLegInSlip(totalLegId);
  const isMlSelected = isLegInSlip(mlLegId);

  const handleOddPress = (
    legId: string,
    marketName: string,
    pick: string,
    odds: number,
    book: string
  ) => {
    if (onSelectOdd) {
      onSelectOdd(marketName, pick, odds, book);
    } else {
      toggleCustomLeg({
        prediction_id: legId,
        fixture: `${match.awayTeam} @ ${match.homeTeam}`,
        prop: `${marketName}: ${pick}`,
        selection: pick,
        odds,
        ev: match.modelEdge?.market === marketName ? `+${match.modelEdge.edgePct}% EV` : '+0.0% EV',
        bookmaker: book,
      });
    }
  };

  // Multi-book comparison lines
  const booksComparison = [
    { name: 'Pinnacle (Sharp)', spread: 1.91, total: 1.90, ml: 1.62, isSharp: true },
    { name: 'Bet365', spread: 1.93, total: 1.91, ml: 1.67 },
    { name: 'SportyBet', spread: 1.95, total: 1.92, ml: 1.68 },
    { name: 'DraftKings', spread: 1.90, total: 1.93, ml: 1.65 },
  ];

  return (
    <Card style={styles.card}>
      {/* 1. Terminal Header: Sport, Live Ticker, Model Edge */}
      <View style={[styles.headerRow, { borderBottomColor: tokens.colors.border }]}>
        <View style={styles.badgeWrap}>
          <Badge
            label={match.league === 'NBA' ? 'NBA 🏀' : 'PREMIER LEAGUE ⚽'}
            tone={leagueTone}
            size="sm"
          />
          {isLive ? (
            <View style={[styles.liveIndicator, { backgroundColor: 'rgba(0, 229, 153, 0.12)', borderColor: tokens.colors.primary }]}>
              <View style={[styles.liveDot, { backgroundColor: tokens.colors.primary }]} />
              <Text variant="badge" tone="brand">
                {match.gameClock || 'LIVE'}
              </Text>
            </View>
          ) : (
            <Text variant="dataSm" tone="tertiary">
              {match.commenceTime}
            </Text>
          )}
        </View>

        {match.modelEdge ? (
          <View
            style={[
              styles.edgePill,
              { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
            ]}
          >
            <Zap size={11} color={tokens.colors.primary} />
            <Text variant="badge" tone="brand">
              +{match.modelEdge.edgePct.toFixed(1)}% EDGE
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. Scoreboard & Team Face-Off */}
      <View style={styles.teamsSection}>
        <View style={styles.teamRow}>
          <Text variant="headlineSm" numberOfLines={1} style={styles.teamName}>
            {match.awayTeam}
          </Text>
          {match.awayScore !== undefined ? (
            <Text variant="dataHero" tone={isLive ? 'brand' : 'primary'} style={styles.scoreText}>
              {match.awayScore}
            </Text>
          ) : (
            <Text variant="dataSm" tone="tertiary">
              AWAY
            </Text>
          )}
        </View>

        <View style={styles.teamRow}>
          <Text variant="headlineSm" numberOfLines={1} style={styles.teamName}>
            {match.homeTeam}
          </Text>
          {match.homeScore !== undefined ? (
            <Text variant="dataHero" tone={isLive ? 'brand' : 'primary'} style={styles.scoreText}>
              {match.homeScore}
            </Text>
          ) : (
            <Text variant="dataSm" tone="tertiary">
              HOME
            </Text>
          )}
        </View>

        {match.stadium ? (
          <View style={styles.stadiumRow}>
            <MapPin size={11} color={tokens.colors.textTertiary} />
            <Text variant="label" tone="tertiary">
              {match.stadium}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 3. The 3-Column Betting Board */}
      <View style={styles.oddsBoard}>
        <View style={styles.oddsColHeaders}>
          <Text variant="label" tone="tertiary" style={styles.oddsColTitle}>
            SPREAD
          </Text>
          <Text variant="label" tone="tertiary" style={styles.oddsColTitle}>
            TOTAL
          </Text>
          <Text variant="label" tone="tertiary" style={styles.oddsColTitle}>
            MONEYLINE
          </Text>
        </View>

        <View style={styles.oddsContainer}>
          {match.markets.spread ? (
            <View style={styles.oddsCol}>
              <OddsBadge
                label={`${match.markets.spread.line > 0 ? `+${match.markets.spread.line}` : match.markets.spread.line}`}
                odds={match.markets.spread.awayOdds}
                bookmaker={match.markets.spread.bestBook}
                hasEdge={match.modelEdge?.market === 'Spread'}
                edgeText={match.modelEdge?.market === 'Spread' ? `+${match.modelEdge.edgePct}%` : undefined}
                isSelected={isSpreadSelected}
                onPress={() =>
                  handleOddPress(
                    spreadLegId,
                    'Spread',
                    `${match.awayTeam} ${match.markets.spread?.line}`,
                    match.markets.spread!.awayOdds,
                    match.markets.spread!.bestBook
                  )
                }
              />
            </View>
          ) : null}

          {match.markets.total ? (
            <View style={styles.oddsCol}>
              <OddsBadge
                label={`O ${match.markets.total.line}`}
                odds={match.markets.total.overOdds}
                bookmaker={match.markets.total.bestBook}
                hasEdge={match.modelEdge?.market === 'Total'}
                edgeText={match.modelEdge?.market === 'Total' ? `+${match.modelEdge.edgePct}%` : undefined}
                isSelected={isTotalSelected}
                onPress={() =>
                  handleOddPress(
                    totalLegId,
                    'Total',
                    `Over ${match.markets.total?.line}`,
                    match.markets.total!.overOdds,
                    match.markets.total!.bestBook
                  )
                }
              />
            </View>
          ) : null}

          {match.markets.moneyline ? (
            <View style={styles.oddsCol}>
              <OddsBadge
                label="HOME ML"
                odds={match.markets.moneyline.home}
                bookmaker={match.markets.moneyline.bestBook}
                hasEdge={match.modelEdge?.market === 'Moneyline'}
                edgeText={match.modelEdge?.market === 'Moneyline' ? `+${match.modelEdge.edgePct}%` : undefined}
                isSelected={isMlSelected}
                onPress={() =>
                  handleOddPress(
                    mlLegId,
                    'Moneyline',
                    `${match.homeTeam} ML`,
                    match.markets.moneyline!.home,
                    match.markets.moneyline!.bestBook
                  )
                }
              />
            </View>
          ) : null}
        </View>
      </View>

      {/* 4. Multi-Bookmaker Drawer Toggle */}
      <TouchableOpacity
        style={[styles.matrixToggle, { borderTopColor: tokens.colors.border }]}
        onPress={() => setShowMatrix(!showMatrix)}
        activeOpacity={0.7}
      >
        <Text variant="badge" tone="secondary">
          {showMatrix ? 'HIDE SPORTSBOOK MATRIX' : 'COMPARE 4 SPORTSBOOKS (PINNACLE / B365 / DK)'}
        </Text>
        {showMatrix ? (
          <ChevronUp size={13} color={tokens.colors.textSecondary} />
        ) : (
          <ChevronDown size={13} color={tokens.colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Multi-Bookmaker Financial Table */}
      {showMatrix ? (
        <View style={[styles.matrixTable, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
          <View style={[styles.matrixHeaderRow, { borderBottomColor: tokens.colors.border }]}>
            <Text variant="label" tone="tertiary" style={{ flex: 1.6 }}>
              BOOKMAKER
            </Text>
            <Text variant="label" tone="tertiary" style={{ flex: 1, textAlign: 'center' }}>
              SPREAD
            </Text>
            <Text variant="label" tone="tertiary" style={{ flex: 1, textAlign: 'center' }}>
              TOTAL
            </Text>
            <Text variant="label" tone="tertiary" style={{ flex: 1, textAlign: 'right' }}>
              ML
            </Text>
          </View>

          {booksComparison.map((b) => (
            <View key={b.name} style={[styles.matrixRow, { borderBottomColor: tokens.colors.border }]}>
              <View style={{ flex: 1.6 }}>
                <Text variant="dataSm" tone={b.isSharp ? 'brand' : 'primary'}>
                  {b.name}
                </Text>
              </View>
              <Text variant="dataSm" tone={b.spread === 1.95 ? 'brand' : 'secondary'} style={{ flex: 1, textAlign: 'center' }}>
                {b.spread.toFixed(2)}
              </Text>
              <Text variant="dataSm" tone={b.total === 1.93 ? 'brand' : 'secondary'} style={{ flex: 1, textAlign: 'center' }}>
                {b.total.toFixed(2)}
              </Text>
              <Text variant="dataSm" tone={b.ml === 1.68 ? 'brand' : 'secondary'} style={{ flex: 1, textAlign: 'right' }}>
                {b.ml.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  edgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  teamsSection: {
    gap: 4,
    paddingVertical: 2,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  scoreText: {
    minWidth: 32,
    textAlign: 'right',
  },
  stadiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  oddsBoard: {
    gap: 6,
    marginTop: 2,
  },
  oddsColHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsColTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  oddsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  oddsCol: {
    flex: 1,
  },
  matrixToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
  },
  matrixTable: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    gap: 4,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
});
