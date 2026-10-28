import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Check, Crown, Flame, ShieldCheck, Users, Zap } from 'lucide-react-native';
import { TipsterProfile } from '../lib/types';
import { useBetStore } from '../stores/useBetStore';
import { useCommunityStore } from '../stores/useCommunityStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, Text } from './ui';

interface TipsterCardProps {
  tipster: TipsterProfile;
}

export function TipsterCard({ tipster }: TipsterCardProps) {
  const { tokens } = useTheme();
  const { isSubscribed, subscribeToTipster, unsubscribeFromTipster } = useCommunityStore();
  const { currency } = useBetStore();

  const subscribed = isSubscribed(tipster.id);
  const currencySymbol = currency === 'NGN' ? '₦' : '$';
  const price = currency === 'NGN' ? tipster.monthlyPriceNGN.toLocaleString() : tipster.monthlyPriceUSD;

  const handleToggleSubscription = () => {
    if (subscribed) {
      Alert.alert(
        `Manage Subscription`,
        `You are currently subscribed to @${tipster.username}. Would you like to cancel?`,
        [
          { text: 'Keep Active', style: 'cancel' },
          {
            text: 'Unsubscribe',
            style: 'destructive',
            onPress: () => {
              unsubscribeFromTipster(tipster.id);
              Alert.alert('Unsubscribed', `You have canceled your subscription to @${tipster.username}.`);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `Subscribe to @${tipster.username}`,
        `Unlock verified VIP predictions, closing line alerts, and unit sizing for ${currencySymbol}${price}/month?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm & Subscribe',
            onPress: () => {
              subscribeToTipster(tipster.id);
              Alert.alert('Subscribed! 👑', `You are now subscribed to @${tipster.username}. All VIP picks are unlocked.`);
            },
          },
        ]
      );
    }
  };

  return (
    <Card style={styles.card}>
      {/* 1. Header with Avatar & Audited Identity */}
      <View style={styles.header}>
        <View style={styles.identityLeft}>
          <View style={[styles.avatarBox, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.primary }]}>
            <Text style={{ fontSize: 20 }}>{tipster.avatar}</Text>
          </View>
          <View style={{ gap: 2 }}>
            <View style={styles.nameRow}>
              <Text variant="headlineSm">{tipster.displayName}</Text>
              {tipster.badge === 'verified_sharp' ? (
                <ShieldCheck size={16} color={tokens.colors.primary} />
              ) : tipster.badge === 'algo_model' ? (
                <Zap size={16} color={tokens.colors.primary} />
              ) : (
                <Crown size={16} color={tokens.colors.warning} />
              )}
            </View>
            <View style={styles.handleRow}>
              <Text variant="dataSm" tone="secondary">
                @{tipster.username}
              </Text>
              <Text variant="label" tone="brand">
                · {tipster.recentStreak}
              </Text>
            </View>
          </View>
        </View>

        <Badge
          label={`${tipster.subscribersCount} Subs`}
          tone="positive"
          size="sm"
          icon={<Users size={11} color={tokens.colors.primary} />}
        />
      </View>

      {/* 2. Specialty & Bio */}
      <View style={styles.bioWrap}>
        <View style={[styles.specialtyPill, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
          <Text variant="label" tone="brand">
            {tipster.specialty}
          </Text>
        </View>
        <Text variant="body" tone="secondary" style={styles.bioText}>
          {tipster.bio}
        </Text>
      </View>

      {/* 3. Audited Performance Grid */}
      <View style={[styles.metricsGrid, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
        <View style={styles.metricCol}>
          <Text variant="label" tone="tertiary">
            WIN RATE
          </Text>
          <Text variant="dataLg" tone="brand">
            {tipster.winRate}%
          </Text>
          <Text variant="label" tone="secondary">
            Audited
          </Text>
        </View>

        <View style={[styles.gridDivider, { backgroundColor: tokens.colors.border }]} />

        <View style={styles.metricCol}>
          <Text variant="label" tone="tertiary">
            30D ROI
          </Text>
          <Text variant="dataLg" tone="brand">
            +{tipster.roiPct}%
          </Text>
          <Text variant="label" tone="secondary">
            Yield
          </Text>
        </View>

        <View style={[styles.gridDivider, { backgroundColor: tokens.colors.border }]} />

        <View style={styles.metricCol}>
          <Text variant="label" tone="tertiary">
            NET UNITS
          </Text>
          <Text variant="dataLg" tone="primary">
            +{tipster.unitsWon}u
          </Text>
          <Text variant="label" tone="secondary">
            Profit
          </Text>
        </View>

        <View style={[styles.gridDivider, { backgroundColor: tokens.colors.border }]} />

        <View style={styles.metricCol}>
          <Text variant="label" tone="tertiary">
            AVG CLV
          </Text>
          <Text variant="dataLg" tone="brand">
            +{tipster.clvPct}%
          </Text>
          <Text variant="label" tone="secondary">
            Beating Line
          </Text>
        </View>
      </View>

      {/* 4. Subscription Footer */}
      <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
        <View style={styles.priceWrap}>
          <Text variant="label" tone="tertiary">
            MEMBERSHIP TIER
          </Text>
          <Text variant="headline" tone="brand">
            {currencySymbol}
            {price}
            <Text variant="dataSm" tone="secondary">
              /month
            </Text>
          </Text>
        </View>

        <Button
          label={subscribed ? 'Subscribed 👑' : 'Subscribe'}
          variant={subscribed ? 'ghost' : 'primary'}
          icon={subscribed ? <Check size={16} color={tokens.colors.primary} /> : <Crown size={16} color={tokens.colors.onPrimary} />}
          onPress={handleToggleSubscription}
          style={styles.subBtn}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bioWrap: {
    gap: 6,
  },
  specialtyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  bioText: {
    lineHeight: 19,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  gridDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  priceWrap: {
    gap: 2,
  },
  subBtn: {
    minHeight: 42,
    paddingHorizontal: 22,
  },
});
