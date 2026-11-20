import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Layers,
  MessageSquareQuote,
  Palette,
  PenSquare,
  Settings2,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react-native';
import { CreatePostModal } from '../../components/CreatePostModal';
import { Badge, Button, Card, MetricTile, Text } from '../../components/ui';
import { useBetStore } from '../../stores/useBetStore';
import { useCommunityStore } from '../../stores/useCommunityStore';
import { ThemeContext, ThemeMode, useTheme } from '../../stores/useThemeStore';
import { lightTokens } from '../../theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    isPro,
    toggleProMock,
    openPaywall,
    bankroll,
    setBankroll,
    unitSize,
    setUnitSize,
    currency,
    setCurrency,
    kellyFraction,
    setKellyFraction,
    minEdgeScore,
    setMinEdgeScore,
    slipLegs,
  } = useBetStore();
  const { mode, setMode } = useTheme();
  const tokens = lightTokens;
  const { tipsters, subscribedTipsterIds, unsubscribeFromTipster } = useCommunityStore();

  const [bankrollInput, setBankrollInput] = useState(bankroll.toString());
  const [unitInput, setUnitInput] = useState(unitSize.toString());
  const [createPostVisible, setCreatePostVisible] = useState(false);

  const subscribedTipsters = tipsters.filter((t) => subscribedTipsterIds.includes(t.id));

  React.useEffect(() => {
    setBankrollInput(bankroll.toString());
  }, [bankroll]);

  React.useEffect(() => {
    setUnitInput(unitSize.toString());
  }, [unitSize]);

  const handleUpdateBankroll = () => {
    const b = parseFloat(bankrollInput);
    const u = parseFloat(unitInput);
    if (isNaN(b) || b <= 0) {
      Alert.alert('Invalid Bankroll', 'Please enter a positive bankroll amount.');
      return;
    }
    if (isNaN(u) || u <= 0) {
      Alert.alert('Invalid Unit Size', 'Please enter a positive unit size.');
      return;
    }
    if (u > b) {
      Alert.alert('Unit Size Exceeded', '1 unit cannot exceed your total bankroll.');
      return;
    }
    setBankroll(b);
    setUnitSize(u);
    Alert.alert('Parameters Saved', 'Your bankroll and Kelly staking model parameters have been updated.');
  };

  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  const modeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
    { label: 'System', value: 'system' },
  ];

  const kellyOptions = [
    { label: '1/4 Kelly (Conservative)', value: 0.25 },
    { label: '1/2 Kelly (Balanced)', value: 0.5 },
    { label: 'Full Kelly (Aggressive)', value: 1.0 },
  ];

  return (
    <ThemeContext.Provider value={lightTokens}>
      <ScrollView
        style={[styles.screen, { backgroundColor: tokens.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* 0. Hub & Sub-Screens Navigation */}
      <Card style={styles.card}>
        <Text variant="title" style={styles.cardHeaderTitle}>
          Hub & Quick Links
        </Text>
        <Text variant="bodySm" tone="secondary" style={styles.cardHeaderSub}>
          Access your tracked tickets, analytical record, and community intel
        </Text>

        <View style={styles.quickLinksContainer}>
          <TouchableOpacity
            style={[styles.quickLinkRow, { borderBottomColor: tokens.colors.border }]}
            onPress={() => router.push('/(tabs)/tracker')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: tokens.colors.primarySoft }]}>
              <Layers size={18} color={tokens.colors.primary} />
            </View>
            <View style={styles.quickLinkText}>
              <Text variant="headlineSm" style={styles.quickLinkTitle}>Watchlist & Betslip</Text>
              <Text variant="bodySm" tone="secondary">Active legs and ticket builder</Text>
            </View>
            {slipLegs.length > 0 && (
              <Badge
                label={`${slipLegs.length} ${slipLegs.length === 1 ? 'leg' : 'legs'}`}
                tone="positive"
                style={styles.badgeMargin}
              />
            )}
            <ChevronRight size={18} color={tokens.colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickLinkRow, { borderBottomColor: tokens.colors.border }]}
            onPress={() => router.push('/(tabs)/record')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: tokens.colors.secondarySoft }]}>
              <BarChart3 size={18} color={tokens.colors.secondary} />
            </View>
            <View style={styles.quickLinkText}>
              <Text variant="headlineSm" style={styles.quickLinkTitle}>Track Record</Text>
              <Text variant="bodySm" tone="secondary">Historical CLV and ROI verification</Text>
            </View>
            <ChevronRight size={18} color={tokens.colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickLinkRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/(tabs)/insights')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Users size={18} color="#F59E0B" />
            </View>
            <View style={styles.quickLinkText}>
              <Text variant="headlineSm" style={styles.quickLinkTitle}>Community Intel</Text>
              <Text variant="bodySm" tone="secondary">Verified sharp consensus and feed</Text>
            </View>
            <ChevronRight size={18} color={tokens.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* 1. Account Summary Card */}
      <Card style={styles.card}>
        <View style={styles.userHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
            ]}
          >
            <User size={24} color={tokens.colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text variant="headlineSm">Quantitative Bettor</Text>
            <Text variant="dataSm" tone="secondary">
              user@edgepointplus.ai
            </Text>
          </View>
          {isPro ? (
            <Badge label="PRO ACTIVE" tone="positive" filled icon={<Crown size={12} color={tokens.colors.onPrimary} />} />
          ) : (
            <Badge label="FREE" tone="warning" icon={<Crown size={12} color={tokens.colors.tertiary} />} />
          )}
        </View>

        {!isPro ? (
          <Button
            label="Upgrade to EdgePoint+ Pro"
            variant="primary"
            fullWidth
            onPress={openPaywall}
            icon={<Zap size={16} color={tokens.colors.onPrimary} />}
          />
        ) : (
          <View
            style={[
              styles.proBanner,
              { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
            ]}
          >
            <ShieldCheck size={16} color={tokens.colors.primary} />
            <Text variant="title" tone="brand" style={{ fontSize: 12 }}>
              All +EV Models, Sharp Steam & Parlays Unlocked
            </Text>
          </View>
        )}
      </Card>

      {/* 2. Bankroll & Kelly Staking Engine */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <CircleDollarSign size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Bankroll & Kelly Sizing</Text>
        </View>

        <View style={styles.inputsRow}>
          <View style={styles.inputCol}>
            <Text variant="label" tone="secondary" style={styles.inputLabel}>
              Total Bankroll ({currencySymbol})
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: tokens.colors.surfaceInset,
                  borderColor: tokens.colors.border,
                  color: tokens.colors.textPrimary,
                },
              ]}
              value={bankrollInput}
              onChangeText={setBankrollInput}
              keyboardType="numeric"
              placeholder="100000"
              placeholderTextColor={tokens.colors.textTertiary}
            />
          </View>

          <View style={styles.inputCol}>
            <Text variant="label" tone="secondary" style={styles.inputLabel}>
              1 Unit Size ({currencySymbol})
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: tokens.colors.surfaceInset,
                  borderColor: tokens.colors.border,
                  color: tokens.colors.textPrimary,
                },
              ]}
              value={unitInput}
              onChangeText={setUnitInput}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor={tokens.colors.textTertiary}
            />
          </View>
        </View>

        {/* Currency Switch */}
        <View style={styles.currencyRow}>
          <Text variant="bodySm" tone="secondary">
            Primary Currency:
          </Text>
          <View style={styles.currencyButtons}>
            <TouchableOpacity
              style={[
                styles.choicePill,
                currency === 'NGN' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                { borderColor: tokens.colors.border },
              ]}
              onPress={() => setCurrency('NGN')}
              activeOpacity={0.7}
            >
              <Text variant="badge" tone={currency === 'NGN' ? 'brand' : 'secondary'}>
                ₦ NGN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choicePill,
                currency === 'USD' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                { borderColor: tokens.colors.border },
              ]}
              onPress={() => setCurrency('USD')}
              activeOpacity={0.7}
            >
              <Text variant="badge" tone={currency === 'USD' ? 'brand' : 'secondary'}>
                $ USD
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Kelly Fraction Choice */}
        <View style={styles.kellyWrap}>
          <Text variant="label" tone="secondary" style={styles.inputLabel}>
            Fractional Kelly Model
          </Text>
          {kellyOptions.map((k) => (
            <TouchableOpacity
              key={k.value}
              style={[
                styles.choiceRow,
                {
                  backgroundColor: kellyFraction === k.value ? tokens.colors.primarySoft : tokens.colors.surfaceInset,
                  borderColor: kellyFraction === k.value ? tokens.colors.primary : tokens.colors.border,
                },
              ]}
              onPress={() => setKellyFraction(k.value)}
              activeOpacity={0.7}
            >
              <Text variant="title" tone={kellyFraction === k.value ? 'brand' : 'primary'} style={{ fontSize: 12 }}>
                {k.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Save Parameters" variant="ghost" fullWidth onPress={handleUpdateBankroll} style={{ marginTop: 10 }} />
      </Card>

      {/* 3. Appearance */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Palette size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Appearance</Text>
        </View>
        <View style={styles.themeChoices}>
          {modeOptions.map((opt) => {
            const active = mode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeTab,
                  {
                    backgroundColor: active ? tokens.colors.primarySoft : tokens.colors.surfaceInset,
                    borderColor: active ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => setMode(opt.value)}
                activeOpacity={0.7}
              >
                <Text variant="title" tone={active ? 'brand' : 'secondary'} style={{ fontSize: 12 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 4. Subscribed Tipsters Management */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Users size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Subscribed Tipsters ({subscribedTipsters.length})</Text>
        </View>

        {subscribedTipsters.length === 0 ? (
          <View style={[styles.emptySubBox, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}>
            <Text variant="bodySm" tone="secondary" style={{ textAlign: 'center' }}>
              You have no active tipster subscriptions. Explore the Community tab to subscribe to verified quantitative cappers.
            </Text>
          </View>
        ) : (
          <View style={styles.subsList}>
            {subscribedTipsters.map((tipster) => (
              <View
                key={tipster.id}
                style={[
                  styles.subItem,
                  { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border },
                ]}
              >
                <View style={styles.subLeft}>
                  <View style={[styles.subAvatar, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.primary }]}>
                    <Text style={{ fontSize: 16 }}>{tipster.avatar}</Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="title">{tipster.displayName}</Text>
                      <Badge label="VIP ACTIVE" tone="positive" size="sm" />
                    </View>
                    <Text variant="label" tone="secondary">
                      @{tipster.username} · {tipster.winRate}% Win Rate · +{tipster.roiPct}% ROI
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.cancelSubBtn, { borderColor: tokens.colors.border }]}
                  onPress={() => {
                    Alert.alert(
                      'Unsubscribe',
                      `Cancel subscription to @${tipster.username}?`,
                      [
                        { text: 'Keep Active', style: 'cancel' },
                        {
                          text: 'Unsubscribe',
                          style: 'destructive',
                          onPress: () => unsubscribeFromTipster(tipster.id),
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <X size={14} color={tokens.colors.negative} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* 5. Creator Hub & Personal Record */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Crown size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Creator Hub & Personal Record</Text>
        </View>

        <View style={styles.creatorMetrics}>
          <MetricTile label="WIN RATE" value="65.5%" sublabel="Tracked" tone="primary" />
          <MetricTile label="30D YIELD" value="+19.8%" sublabel="ROI" tone="primary" />
          <MetricTile label="UNITS WON" value="+18.5u" sublabel="Net" tone="primary" />
          <MetricTile label="SUBSCRIBERS" value="12" sublabel="Paying" tone="secondary" />
        </View>

        <Button
          label="+ Publish Pick to Community Feed"
          variant="ghost"
          fullWidth
          icon={<PenSquare size={15} color={tokens.colors.primary} />}
          onPress={() => setCreatePostVisible(true)}
          style={{ marginTop: 4 }}
        />
      </Card>

      {/* 6. Model Testing Simulator */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Settings2 size={18} color={tokens.colors.secondary} />
          <Text variant="headlineSm">Developer & Mock Sandbox</Text>
        </View>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text variant="title">Toggle EdgePoint+ Pro Entitlement</Text>
            <Text variant="bodySm" tone="secondary">
              Instantly unlock all NBA, EuroLeague, and Premier League model predictions.
            </Text>
          </View>
          <Switch
            value={isPro}
            onValueChange={toggleProMock}
            trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.primary }}
            thumbColor={tokens.colors.textPrimary}
          />
        </View>
      </Card>

      <CreatePostModal visible={createPostVisible} onClose={() => setCreatePostVisible(false)} />
    </ScrollView>
  </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 14,
  },
  card: {
    padding: 14,
    gap: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  kellyWrap: {
    gap: 6,
    marginTop: 4,
  },
  choiceRow: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeChoices: {
    flexDirection: 'row',
    gap: 8,
  },
  themeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  emptySubBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subsList: {
    gap: 8,
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  creatorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardHeaderSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  quickLinksContainer: {
    gap: 0,
  },
  quickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkText: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeMargin: {
    marginRight: 6,
  },
});
