import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react-native';
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
      {/* Top Header: League, Clock / Start Time */}
      <View style={styles.headerRow}>
        <View style={styles.badgeWrap}>
          <Badge
            label={match.league === 'NBA' ? 'NBA 🏀' : 'PREMIER LEAGUE ⚽'}
            tone={leagueTone}
            size="sm"
          />
          {isLive ? (
            <View style={styles.liveIndicator}>
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
            <Text variant="badge" tone="brand">
              MODEL EDGE: +{match.modelEdge.edgePct.toFixed(1)}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* Matchup Teams & Live Score */}
      <View style={styles.teamsSection}>
        <View style={styles.teamRow}>
          <Text variant="headlineSm" numberOfLines={1} style={styles.teamName}>
            {match.awayTeam}
          </Text>
          {match.awayScore !== undefined ? (
            <Text variant="dataLg" tone={isLive ? 'brand' : 'primary'}>
              {match.awayScore}
            </Text>
          ) : null}
        </View>

        <View style={styles.teamRow}>
          <Text variant="headlineSm" numberOfLines={1} style={styles.teamName}>
            {match.homeTeam}
          </Text>
          {match.homeScore !== undefined ? (
            <Text variant="dataLg" tone={isLive ? 'brand' : 'primary'}>
              {match.homeScore}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Quick Odds Grid: Touch targets >= 44px with accurate toggle states */}
      <View style={[styles.oddsContainer, { borderTopColor: tokens.colors.border }]}>
        {match.markets.spread ? (
          <View style={styles.oddsCol}>
            <OddsBadge
              label={`Spread ${match.markets.spread.line > 0 ? `+${match.markets.spread.line}` : match.markets.spread.line}`}
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
              label={`O/U ${match.markets.total.line}`}
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
              label="Moneyline"
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

      {/* Multi-Bookmaker Comparison Toggle */}
      <TouchableOpacity
        style={styles.matrixToggle}
        onPress={() => setShowMatrix(!showMatrix)}
        activeOpacity={0.7}
      >
        <Text variant="badge" tone="tertiary">
          {showMatrix ? 'HIDE SPORTSBOOK MATRIX' : 'COMPARE ALL SPORTSBOOK LINES'}
        </Text>
        {showMatrix ? (
          <ChevronUp size={13} color={tokens.colors.textTertiary} />
        ) : (
          <ChevronDown size={13} color={tokens.colors.textTertiary} />
        )}
      </TouchableOpacity>

      {/* Expandable Multi-Bookmaker Matrix */}
      {showMatrix ? (
        <View style={[styles.matrixTable, { borderTopColor: tokens.colors.border }]}>
          <View style={styles.matrixHeaderRow}>
            <Text variant="label" tone="tertiary" style={{ flex: 1.5 }}>
              SPORTSBOOK
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
              <View style={{ flex: 1.5 }}>
                <Text variant="bodySm" tone={b.isSharp ? 'brand' : 'primary'}>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  edgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  teamsSection: {
    gap: 6,
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    flex: 1,
  },
  oddsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  oddsCol: {
    flex: 1,
  },
  matrixToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    marginTop: 6,
  },
  matrixTable: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 6,
    gap: 4,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
});
