import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Check,
  Crown,
  Flame,
  Lock,
  MessageSquare,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react-native';
import { CommunityPost } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useCommunityStore } from '../stores/useCommunityStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, Text } from './ui';

interface CommunityFeedCardProps {
  post: CommunityPost;
}

export function CommunityFeedCard({ post }: CommunityFeedCardProps) {
  const { tokens } = useTheme();
  const { isSubscribed, subscribeToTipster, toggleReaction } = useCommunityStore();
  const { addCustomLeg, slipLegs, currency } = useBetStore();

  const subscribed = isSubscribed(post.authorId);
  const isLockedVip = post.isVip && !subscribed;

  const totalVotes = post.tailCount + post.fadeCount;
  const tailPct = totalVotes > 0 ? Math.round((post.tailCount / totalVotes) * 100) : 50;

  const currencySymbol = currency === 'NGN' ? '₦' : '$';
  const subPrice = currency === 'NGN' ? '3,500/mo' : '10/mo';

  const inSlip = post.predictionData
    ? slipLegs.some(
        (l) =>
          l.fixture === post.predictionData?.fixture &&
          l.prop === post.predictionData?.prop &&
          l.selection === post.predictionData?.selection
      )
    : false;

  const handleTailToSlip = () => {
    if (!post.predictionData) return;
    addCustomLeg({
      fixture: post.predictionData.fixture,
      prop: `${post.predictionData.prop} (${post.predictionData.selection} ${post.predictionData.line ?? ''})`,
      selection: post.predictionData.selection,
      odds: post.predictionData.odds,
      ev: '+EV Tipster',
      bookmaker: post.predictionData.bookmaker,
    });
    Alert.alert('Pick Added', `Tailed @${post.authorUsername}'s pick to your betslip.`);
  };

  const handleSubscribe = () => {
    Alert.alert(
      `Subscribe to @${post.authorUsername}`,
      `Unlock all VIP predictions, closing line alerts, and staking models for ${currencySymbol}${subPrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            subscribeToTipster(post.authorId);
            Alert.alert('Subscribed! 👑', `You are now subscribed to @${post.authorUsername}. All VIP picks are unlocked.`);
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      {/* 1. Author Header */}
      <View style={styles.authorRow}>
        <View style={styles.authorLeft}>
          <View style={[styles.avatarBox, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
            <Text style={{ fontSize: 16 }}>
              {post.authorBadge === 'algo_model' ? '⚡' : post.authorUsername.charAt(0)}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <View style={styles.nameRow}>
              <Text variant="title">{post.authorName}</Text>
              {post.authorBadge === 'verified_sharp' ? (
                <ShieldCheck size={14} color={tokens.colors.primary} />
              ) : post.authorBadge === 'algo_model' ? (
                <Zap size={14} color={tokens.colors.primary} />
              ) : (
                <Crown size={14} color={tokens.colors.warning} />
              )}
              <Text variant="label" tone="tertiary">
                @{post.authorUsername}
              </Text>
            </View>

            <View style={styles.statsPillRow}>
              <Badge
                label={`${post.authorWinRate}% Win Rate`}
                tone={post.authorWinRate >= 65 ? 'positive' : 'info'}
                size="sm"
              />
              <Text variant="label" tone="secondary">
                +{post.authorRoi}% ROI
              </Text>
              <Text variant="label" tone="tertiary">
                · {post.createdAt}
              </Text>
            </View>
          </View>
        </View>

        <Badge
          label={post.type === 'prediction' ? 'PICK 🎯' : 'INTEL 📰'}
          tone={post.type === 'prediction' ? 'positive' : 'info'}
          size="sm"
        />
      </View>

      {/* 2. Post Title & Text */}
      <View style={styles.contentWrap}>
        <Text variant="headlineSm" numberOfLines={2}>
          {post.title}
        </Text>
        <Text variant="bodySm" tone="secondary" style={styles.contentText}>
          {post.content}
        </Text>
      </View>

      {/* 3. Prediction Card Section (Free vs VIP Gated) */}
      {post.type === 'prediction' && post.predictionData ? (
        isLockedVip ? (
          /* Locked VIP Preview */
          <View style={[styles.lockedCard, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.primary }]}>
            <View style={styles.lockedHeader}>
              <View style={[styles.lockIconBox, { backgroundColor: tokens.colors.surface }]}>
                <Lock size={16} color={tokens.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="title" tone="brand">
                  🔒 VIP Subscriber Prediction
                </Text>
                <Text variant="label" tone="secondary">
                  Exclusive to @{post.authorUsername} subscribers
                </Text>
              </View>
              <Badge label="VIP ONLY" tone="positive" filled size="sm" />
            </View>

            <Text variant="bodySm" tone="tertiary" style={styles.lockedDesc}>
              Subscribe to unlock verified selection, fair line analysis, sportsbook value arbitrage, and recommended units.
            </Text>

            <Button
              label={`Subscribe to @${post.authorUsername} (${currencySymbol}${subPrice})`}
              variant="primary"
              icon={<Crown size={15} color={tokens.colors.onPrimary} />}
              onPress={handleSubscribe}
              fullWidth
              style={styles.subscribeBtn}
            />
          </View>
        ) : (
          /* Unlocked Prediction Ticket */
          <View style={[styles.ticketBox, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
            <View style={styles.ticketHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="label" tone="tertiary">
                  {post.predictionData.fixture} · {post.league}
                </Text>
                <Text variant="title" tone="brand" style={styles.ticketPropTitle}>
                  {post.predictionData.prop}: {post.predictionData.selection}{' '}
                  {post.predictionData.line !== undefined ? post.predictionData.line : ''}
                </Text>
              </View>

              {post.isVip ? (
                <Badge
                  label="VIP UNLOCKED 👑"
                  tone="positive"
                  filled
                  size="sm"
                />
              ) : null}
            </View>

            <View style={styles.ticketDetailsRow}>
              <View style={styles.ticketStat}>
                <Text variant="label" tone="tertiary">
                  ODDS
                </Text>
                <Text variant="dataMd" tone="brand">
                  @{post.predictionData.odds.toFixed(2)}
                </Text>
              </View>

              <View style={styles.ticketStat}>
                <Text variant="label" tone="tertiary">
                  BOOKMAKER
                </Text>
                <Text variant="dataSm" tone="primary">
                  {post.predictionData.bookmaker}
                </Text>
              </View>

              <View style={styles.ticketStat}>
                <Text variant="label" tone="tertiary">
                  STAKE
                </Text>
                <Text variant="dataSm" tone="warning">
                  {post.predictionData.units} Units
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.tailBtn,
                  { backgroundColor: inSlip ? tokens.colors.primary : tokens.colors.surface, borderColor: tokens.colors.primary },
                ]}
                onPress={handleTailToSlip}
                activeOpacity={0.7}
              >
                {inSlip ? (
                  <>
                    <Check size={13} color={tokens.colors.onPrimary} />
                    <Text variant="badge" style={{ color: tokens.colors.onPrimary }}>
                      Tailed
                    </Text>
                  </>
                ) : (
                  <>
                    <Plus size={13} color={tokens.colors.primary} />
                    <Text variant="badge" tone="brand">
                      Tail
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : null}

      {/* 4. Community Consensus Bar & Reactions Footer */}
      <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
        {/* Consensus Meter */}
        <View style={styles.consensusWrap}>
          <View style={styles.consensusLabelRow}>
            <Text variant="label" tone="secondary">
              Community Consensus ({tailPct}% Tail)
            </Text>
            <Text variant="label" tone="tertiary">
              {post.tailCount} Tails · {post.fadeCount} Fades
            </Text>
          </View>
          <View style={[styles.consensusTrack, { backgroundColor: tokens.colors.surfaceInset }]}>
            <View style={[styles.consensusFill, { width: `${tailPct}%`, backgroundColor: tokens.colors.primary }]} />
          </View>
        </View>

        {/* Reaction Buttons */}
        <View style={styles.reactionButtons}>
          <TouchableOpacity
            style={[
              styles.reactBtn,
              post.userReaction === 'tail' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
              { borderColor: tokens.colors.border },
            ]}
            onPress={() => toggleReaction(post.id, 'tail')}
            activeOpacity={0.7}
          >
            <TrendingUp size={14} color={post.userReaction === 'tail' ? tokens.colors.primary : tokens.colors.textSecondary} />
            <Text variant="badge" tone={post.userReaction === 'tail' ? 'brand' : 'secondary'}>
              Tail (+EV) ({post.tailCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reactBtn,
              post.userReaction === 'fade' && { backgroundColor: tokens.colors.negativeSoft, borderColor: tokens.colors.negative },
              { borderColor: tokens.colors.border },
            ]}
            onPress={() => toggleReaction(post.id, 'fade')}
            activeOpacity={0.7}
          >
            <TrendingDown size={14} color={post.userReaction === 'fade' ? tokens.colors.negative : tokens.colors.textSecondary} />
            <Text variant="badge" tone={post.userReaction === 'fade' ? 'negative' : 'secondary'}>
              Fade ({post.fadeCount})
            </Text>
          </TouchableOpacity>

          <View style={styles.commentCount}>
            <MessageSquare size={13} color={tokens.colors.textTertiary} />
            <Text variant="label" tone="tertiary">
              {post.commentsCount}
            </Text>
          </View>
        </View>
      </View>
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
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contentWrap: {
    gap: 6,
  },
  contentText: {
    lineHeight: 20,
  },
  lockedCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  subscribeBtn: {
    minHeight: 42,
    marginTop: 4,
  },
  ticketBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketPropTitle: {
    marginTop: 2,
  },
  ticketDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  ticketStat: {
    gap: 2,
  },
  tailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 34,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  consensusWrap: {
    gap: 4,
  },
  consensusLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consensusTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  consensusFill: {
    height: '100%',
    borderRadius: 2,
  },
  reactionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
});
