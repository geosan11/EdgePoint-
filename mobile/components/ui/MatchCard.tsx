import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, ChevronDown, ChevronUp, MapPin, Zap } from 'lucide-react-native';
import { MatchFixture } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { todayTheme } from '../../theme/todayTheme';
import { OddsMatrix } from '../OddsMatrix';
import { Badge } from './Badge';

interface MatchCardProps {
  match: MatchFixture;
  onSelectOdd?: (market: string, pick: string, odds: number, bookmaker: string) => void;
}

export function MatchCard({ match, onSelectOdd }: MatchCardProps) {
  const { toggleCustomLeg, isLegInSlip } = useBetStore();
  const [showMatrix, setShowMatrix] = useState(false);

  const isLive = match.status === 'live';
  const isSample = match.dataSource !== 'live';
  const leagueTone = match.league === 'NBA' ? 'positive' : 'info';

  const sporty = match.bookOdds?.sportybet;
  const spreadLine = sporty?.spread?.line;
  const spreadOdds = sporty?.spread?.awayOdds;
  const totalLine = sporty?.total?.line;
  const totalOdds = sporty?.total?.overOdds;
  const mlOdds = sporty?.moneyline?.home;

  // Consistent Leg IDs for Slip Matching & Toggling
  const spreadLegId = `${match.id}_spread_${match.awayTeam}`;
  const totalLegId = `${match.id}_total_over`;
  const mlLegId = `${match.id}_ml_${match.homeTeam}`;

  const isSpreadSelected = isLegInSlip(spreadLegId);
  const isTotalSelected = isLegInSlip(totalLegId);
  const isMlSelected = isLegInSlip(mlLegId);

  // Check typed model edge matching (never fuzzy match)
  const hasSpreadEdge =
    match.modelEdge?.marketKey === 'spread' &&
    (match.modelEdge?.side === 'away' || !match.modelEdge?.side);
  const hasTotalEdge =
    match.modelEdge?.marketKey === 'total' &&
    (match.modelEdge?.side === 'over' || !match.modelEdge?.side);
  const hasMlEdge =
    match.modelEdge?.marketKey === 'moneyline' &&
    (match.modelEdge?.side === 'home' || !match.modelEdge?.side);

  const handleOddPress = (
    legId: string,
    marketName: string,
    pick: string,
    odds: number,
    book: string,
    hasEdge: boolean
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
        ev: hasEdge && match.modelEdge ? `+${match.modelEdge.edgePct.toFixed(1)}% EV` : '+0.0% EV',
        bookmaker: book,
      });
    }
  };

  const boardLabel = sporty ? (isSample ? 'SportyBet (sample)' : 'SportyBet') : '—';

  return (
    <View style={styles.card}>
      {/* 1. Terminal Header: Sport, Live Ticker with Sample Guard, Model Edge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeWrap}>
          <Badge
            label={match.league === 'NBA' ? 'NBA 🏀' : 'PREMIER LEAGUE ⚽'}
            tone={leagueTone}
            size="sm"
          />
          {isLive ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {match.gameClock ? `LIVE · ${match.gameClock}` : 'LIVE'}
              </Text>
              {isSample ? (
                <View style={styles.inlineSampleBadge}>
                  <Text style={styles.inlineSampleText}>SAMPLE</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.commenceText}>
              {match.commenceTime}
            </Text>
          )}
        </View>

        {match.modelEdge ? (
          <View style={styles.edgePill}>
            <Zap size={11} color={todayTheme.colors.primary} />
            <Text style={styles.edgePillText}>
              +{match.modelEdge.edgePct.toFixed(1)}% EDGE
            </Text>
            {isSample ? (
              <Text style={styles.edgeSampleTag}>[SAMPLE]</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* 2. Scoreboard & Team Face-Off */}
      <View style={styles.teamsSection}>
        <View style={styles.teamRow}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.awayTeam}
          </Text>
          {match.awayScore !== undefined ? (
            <Text
              style={[
                styles.scoreText,
                isLive && { color: todayTheme.colors.liveCyan },
              ]}
            >
              {match.awayScore}
            </Text>
          ) : (
            <Text style={styles.teamRoleText}>AWAY</Text>
          )}
        </View>

        <View style={styles.teamRow}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.homeTeam}
          </Text>
          {match.homeScore !== undefined ? (
            <Text
              style={[
                styles.scoreText,
                isLive && { color: todayTheme.colors.liveCyan },
              ]}
            >
              {match.homeScore}
            </Text>
          ) : (
            <Text style={styles.teamRoleText}>HOME</Text>
          )}
        </View>

        {match.stadium ? (
          <View style={styles.stadiumRow}>
            <MapPin size={11} color={todayTheme.colors.textTertiary} />
            <Text style={styles.stadiumText}>{match.stadium}</Text>
          </View>
        ) : null}
      </View>

      {/* 3. Compact Market Board (SportyBet only, no fake bestBook) */}
      <View style={styles.oddsBoard}>
        <View style={styles.oddsColHeaders}>
          <Text style={styles.boardHeaderTitle}>MARKET BOARD</Text>
          <Text
            style={[
              styles.boardHeaderBook,
              isSample ? { color: todayTheme.colors.sampleAmber } : { color: todayTheme.colors.primary },
            ]}
          >
            {boardLabel}
          </Text>
        </View>

        <View style={styles.oddsContainer}>
          {/* Spread Button */}
          <TouchableOpacity
            style={[
              styles.oddButton,
              hasSpreadEdge && !isSpreadSelected && styles.oddButtonEdge,
              isSpreadSelected && styles.oddButtonSelected,
              isSample && !hasSpreadEdge && !isSpreadSelected && styles.oddButtonMuted,
            ]}
            activeOpacity={0.7}
            disabled={spreadOdds === undefined}
            onPress={() => {
              if (spreadOdds !== undefined && spreadLine !== undefined) {
                const spreadStr = spreadLine > 0 ? `+${spreadLine}` : `${spreadLine}`;
                handleOddPress(
                  spreadLegId,
                  'Spread',
                  `${match.awayTeam} ${spreadStr}`,
                  spreadOdds,
                  'SportyBet',
                  hasSpreadEdge
                );
              }
            }}
          >
            <View style={styles.oddTopRow}>
              <Text
                style={[
                  styles.oddLabel,
                  isSpreadSelected && { color: todayTheme.colors.onPrimary },
                ]}
              >
                {spreadLine !== undefined
                  ? `SPREAD ${spreadLine > 0 ? `+${spreadLine}` : spreadLine}`
                  : 'SPREAD'}
              </Text>
            </View>
            <View style={styles.oddBottomRow}>
              <Text
                style={[
                  styles.oddPrice,
                  hasSpreadEdge && !isSpreadSelected && { color: todayTheme.colors.primary },
                  isSpreadSelected && { color: todayTheme.colors.onPrimary },
                  isSample && !hasSpreadEdge && !isSpreadSelected && { color: todayTheme.colors.textSecondary },
                ]}
              >
                {spreadOdds !== undefined ? spreadOdds.toFixed(2) : '—'}
              </Text>
              {hasSpreadEdge && !isSpreadSelected ? (
                <View style={styles.edgeTag}>
                  <Text style={styles.edgeTagText}>+EV</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* Total Button */}
          <TouchableOpacity
            style={[
              styles.oddButton,
              hasTotalEdge && !isTotalSelected && styles.oddButtonEdge,
              isTotalSelected && styles.oddButtonSelected,
              isSample && !hasTotalEdge && !isTotalSelected && styles.oddButtonMuted,
            ]}
            activeOpacity={0.7}
            disabled={totalOdds === undefined}
            onPress={() => {
              if (totalOdds !== undefined && totalLine !== undefined) {
                handleOddPress(
                  totalLegId,
                  'Total',
                  `Over ${totalLine}`,
                  totalOdds,
                  'SportyBet',
                  hasTotalEdge
                );
              }
            }}
          >
            <View style={styles.oddTopRow}>
              <Text
                style={[
                  styles.oddLabel,
                  isTotalSelected && { color: todayTheme.colors.onPrimary },
                ]}
              >
                {totalLine !== undefined ? `TOTAL O ${totalLine}` : 'TOTAL'}
              </Text>
            </View>
            <View style={styles.oddBottomRow}>
              <Text
                style={[
                  styles.oddPrice,
                  hasTotalEdge && !isTotalSelected && { color: todayTheme.colors.primary },
                  isTotalSelected && { color: todayTheme.colors.onPrimary },
                  isSample && !hasTotalEdge && !isTotalSelected && { color: todayTheme.colors.textSecondary },
                ]}
              >
                {totalOdds !== undefined ? totalOdds.toFixed(2) : '—'}
              </Text>
              {hasTotalEdge && !isTotalSelected ? (
                <View style={styles.edgeTag}>
                  <Text style={styles.edgeTagText}>+EV</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* Moneyline Button */}
          <TouchableOpacity
            style={[
              styles.oddButton,
              hasMlEdge && !isMlSelected && styles.oddButtonEdge,
              isMlSelected && styles.oddButtonSelected,
              isSample && !hasMlEdge && !isMlSelected && styles.oddButtonMuted,
            ]}
            activeOpacity={0.7}
            disabled={mlOdds === undefined}
            onPress={() => {
              if (mlOdds !== undefined) {
                handleOddPress(
                  mlLegId,
                  'Moneyline',
                  `${match.homeTeam} ML`,
                  mlOdds,
                  'SportyBet',
                  hasMlEdge
                );
              }
            }}
          >
            <View style={styles.oddTopRow}>
              <Text
                style={[
                  styles.oddLabel,
                  isMlSelected && { color: todayTheme.colors.onPrimary },
                ]}
              >
                HOME ML
              </Text>
            </View>
            <View style={styles.oddBottomRow}>
              <Text
                style={[
                  styles.oddPrice,
                  hasMlEdge && !isMlSelected && { color: todayTheme.colors.primary },
                  isMlSelected && { color: todayTheme.colors.onPrimary },
                  isSample && !hasMlEdge && !isMlSelected && { color: todayTheme.colors.textSecondary },
                ]}
              >
                {mlOdds !== undefined ? mlOdds.toFixed(2) : '—'}
              </Text>
              {hasMlEdge && !isMlSelected ? (
                <View style={styles.edgeTag}>
                  <Text style={styles.edgeTagText}>+EV</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Odds Matrix Toggle */}
      <TouchableOpacity
        style={styles.matrixToggle}
        onPress={() => setShowMatrix(!showMatrix)}
        activeOpacity={0.7}
      >
        <Text style={styles.matrixToggleText}>
          {showMatrix ? 'HIDE ODDS MATRIX' : 'ODDS MATRIX (4 BOOKS)'}
        </Text>
        {showMatrix ? (
          <ChevronUp size={13} color={todayTheme.colors.textSecondary} />
        ) : (
          <ChevronDown size={13} color={todayTheme.colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Reusable Odds Matrix Grid */}
      {showMatrix ? (
        <OddsMatrix match={match} onSelectOdd={onSelectOdd} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: todayTheme.colors.surface,
    borderColor: todayTheme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
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
    borderBottomColor: todayTheme.colors.borderSubtle,
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
    backgroundColor: todayTheme.colors.liveCyanSoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.liveCyanBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: todayTheme.colors.liveCyan,
  },
  liveText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9,
    color: todayTheme.colors.liveCyan,
    letterSpacing: 0.4,
  },
  inlineSampleBadge: {
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 3,
    backgroundColor: todayTheme.colors.sampleAmberSoft,
    borderWidth: 0.5,
    borderColor: todayTheme.colors.sampleAmberBorder,
    marginLeft: 2,
  },
  inlineSampleText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 7.5,
    color: todayTheme.colors.sampleAmber,
  },
  commenceText: {
    fontFamily: todayTheme.fonts.hanken.medium,
    fontSize: 11,
    color: todayTheme.colors.textTertiary,
  },
  edgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: todayTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: todayTheme.colors.primaryBorder,
  },
  edgePillText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 10,
    color: todayTheme.colors.primary,
    letterSpacing: 0.3,
  },
  edgeSampleTag: {
    fontFamily: todayTheme.fonts.mono.regular,
    fontSize: 8,
    color: todayTheme.colors.sampleAmber,
    marginLeft: 2,
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
    fontFamily: todayTheme.fonts.space.bold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: todayTheme.colors.textPrimary,
  },
  scoreText: {
    minWidth: 32,
    textAlign: 'right',
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: todayTheme.colors.textPrimary,
  },
  teamRoleText: {
    fontFamily: todayTheme.fonts.mono.medium,
    fontSize: 11,
    color: todayTheme.colors.textTertiary,
  },
  stadiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stadiumText: {
    fontFamily: todayTheme.fonts.hanken.regular,
    fontSize: 10,
    color: todayTheme.colors.textTertiary,
  },
  oddsBoard: {
    gap: 6,
    marginTop: 2,
  },
  oddsColHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  boardHeaderTitle: {
    fontFamily: todayTheme.fonts.hanken.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: todayTheme.colors.textTertiary,
  },
  boardHeaderBook: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  oddsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  oddButton: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: todayTheme.colors.surfaceInset,
    borderWidth: 1,
    borderColor: todayTheme.colors.border,
    justifyContent: 'space-between',
  },
  oddButtonMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: todayTheme.colors.borderSubtle,
  },
  oddButtonEdge: {
    backgroundColor: todayTheme.colors.primarySoft,
    borderColor: todayTheme.colors.primaryBorder,
    borderLeftWidth: 2.5,
    borderLeftColor: todayTheme.colors.primary,
  },
  oddButtonSelected: {
    backgroundColor: todayTheme.colors.primary,
    borderColor: todayTheme.colors.primary,
  },
  oddTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oddLabel: {
    fontFamily: todayTheme.fonts.hanken.semiBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
    color: todayTheme.colors.textSecondary,
  },
  oddBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  oddPrice: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: todayTheme.colors.textPrimary,
  },
  edgeTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 229, 163, 0.2)',
  },
  edgeTagText: {
    fontFamily: todayTheme.fonts.mono.bold,
    fontSize: 8.5,
    color: todayTheme.colors.primary,
  },
  matrixToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: todayTheme.colors.borderSubtle,
  },
  matrixToggleText: {
    fontFamily: todayTheme.fonts.hanken.semiBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: todayTheme.colors.textSecondary,
  },
});
