import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Check,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  ANNUAL_NGN,
  FOUNDING_WEEKLY_NGN,
  PAYMENTS_ENABLED,
  PRICING_PLANS,
  TRIAL_DAYS,
  WEEKLY_NGN,
} from '../lib/pricing';
import { calculateRecordStats } from '../lib/record';
import { getTrackRecord, joinWaitlist } from '../lib/supabase';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, Text } from './ui';

export function PaywallModal() {
  const router = useRouter();
  const { isPaywallVisible, closePaywall } = useBetStore();
  const { tokens } = useTheme();

  const [selectedPlanId, setSelectedPlanId] = useState<'weekly' | 'annual'>('annual');
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [realRecord, setRealRecord] = useState<{ beatClosingPct: string } | null>(null);

  // Fetch record on open to check if real data exists
  useEffect(() => {
    if (isPaywallVisible) {
      setWaitlistStatus('idle');
      setErrorMessage('');
      getTrackRecord().then((res) => {
        if (!res.isMock && res.picks.length > 0) {
          const stats = calculateRecordStats(res.picks);
          setRealRecord({ beatClosingPct: stats.beatClosingFormatted });
        } else {
          setRealRecord(null);
        }
      });
    }
  }, [isPaywallVisible]);

  const handleJoinWaitlist = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setWaitlistStatus('error');
      return;
    }

    setWaitlistStatus('loading');
    setErrorMessage('');
    const res = await joinWaitlist(email);
    if (res.success) {
      setWaitlistStatus('success');
    } else {
      setErrorMessage(res.error || 'Failed to join waitlist. Please try again.');
      setWaitlistStatus('error');
    }
  };

  const handleViewFullRecord = () => {
    closePaywall();
    router.push('/(tabs)/record');
  };

  const benefits = [
    {
      title: 'Every pick and league',
      subtitle: 'Free tier gets 3 picks a day',
    },
    {
      title: 'Instant edge alerts',
      subtitle: 'Push notification the minute a line opens',
    },
    {
      title: 'Show the math always open',
      subtitle: 'Fair odds, model probabilities, and edge score',
    },
    {
      title: 'Props and line-move radar',
      subtitle: 'Player props and market-wide steam tracker',
    },
    {
      title: 'SportyBet / Bet9ja / 1xBet lines vs fair odds',
      subtitle: 'Local bookmaker price comparison',
      comingSoon: true,
    },
  ];

  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={closePaywall}
    >
      <View style={[styles.overlay, { backgroundColor: tokens.colors.overlay }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: tokens.colors.surfaceElevated,
              borderColor: tokens.colors.border,
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
              },
            ]}
            onPress={closePaywall}
            activeOpacity={0.7}
          >
            <X size={18} color={tokens.colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Icon & Title */}
            <View style={styles.headerBlock}>
              <View
                style={[
                  styles.badgeIcon,
                  {
                    backgroundColor: tokens.colors.primarySoft,
                    borderColor: tokens.colors.primary,
                  },
                ]}
              >
                <Zap size={22} color={tokens.colors.primary} />
              </View>

              <Text variant="headline" style={styles.headline}>
                See every edge the moment it opens.
              </Text>

              {/* Show closing line stat ONLY when real data exists */}
              {realRecord ? (
                <View style={styles.recordStatWrap}>
                  <Text variant="bodySm" tone="secondary" style={{ textAlign: 'center' }}>
                    Model beat the closing line on{' '}
                    <Text variant="dataSm" tone="brand" style={{ fontWeight: '700' }}>
                      {realRecord.beatClosingPct}
                    </Text>{' '}
                    of settled picks.
                  </Text>
                  <TouchableOpacity
                    onPress={handleViewFullRecord}
                    activeOpacity={0.7}
                    style={{ marginTop: 4 }}
                  >
                    <Text
                      variant="bodySm"
                      tone="brand"
                      style={{ textDecorationLine: 'underline', fontWeight: '600' }}
                    >
                      See the full record →
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Pro Benefits List */}
            <Card style={styles.benefitsCard}>
              <Text variant="label" tone="tertiary" style={{ marginBottom: 10 }}>
                PRO ACCESS INCLUDES
              </Text>
              {benefits.map((b, idx) => (
                <View key={idx} style={styles.benefitRow}>
                  <CheckCircle2
                    size={16}
                    color={tokens.colors.primary}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.benefitTitleRow}>
                      <Text variant="title" style={{ fontSize: 13 }}>
                        {b.title}
                      </Text>
                      {b.comingSoon ? (
                        <Badge label="COMING SOON" tone="warning" size="sm" />
                      ) : null}
                    </View>
                    <Text variant="bodySm" tone="secondary" style={{ marginTop: 1 }}>
                      {b.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Pricing Plans */}
            <View style={styles.plansWrap}>
              {/* Annual Plan */}
              <TouchableOpacity
                style={[
                  styles.planOption,
                  {
                    backgroundColor:
                      selectedPlanId === 'annual'
                        ? tokens.colors.primarySoft
                        : tokens.colors.surface,
                    borderColor:
                      selectedPlanId === 'annual'
                        ? tokens.colors.primary
                        : tokens.colors.border,
                  },
                ]}
                onPress={() => setSelectedPlanId('annual')}
                activeOpacity={0.85}
              >
                <Badge
                  label="SAVE ~42%"
                  tone="positive"
                  filled
                  style={styles.planBadge}
                />
                <View style={styles.planHeaderRow}>
                  <Text variant="title">Annual Pass</Text>
                  <Text variant="dataLg" tone="brand">
                    ₦{ANNUAL_NGN.toLocaleString()}
                    <Text variant="dataSm" tone="secondary">
                      /yr
                    </Text>
                  </Text>
                </View>
                <Text variant="bodySm" tone="secondary">
                  About ₦865/week · Save ~42%
                </Text>
              </TouchableOpacity>

              {/* Weekly Plan */}
              <TouchableOpacity
                style={[
                  styles.planOption,
                  {
                    backgroundColor:
                      selectedPlanId === 'weekly'
                        ? tokens.colors.primarySoft
                        : tokens.colors.surface,
                    borderColor:
                      selectedPlanId === 'weekly'
                        ? tokens.colors.primary
                        : tokens.colors.border,
                  },
                ]}
                onPress={() => setSelectedPlanId('weekly')}
                activeOpacity={0.85}
              >
                <View style={styles.planHeaderRow}>
                  <Text variant="title">Weekly Access</Text>
                  <Text variant="dataLg" tone="brand">
                    ₦{WEEKLY_NGN.toLocaleString()}
                    <Text variant="dataSm" tone="secondary">
                      /wk
                    </Text>
                  </Text>
                </View>
                <Text variant="bodySm" tone="secondary">
                  Billed weekly · Pause or cancel anytime
                </Text>
              </TouchableOpacity>
            </View>

            {/* Founding Price Note */}
            <View
              style={[
                styles.foundingNoteBox,
                {
                  backgroundColor: tokens.colors.surfaceInset,
                  borderColor: tokens.colors.border,
                },
              ]}
            >
              <Sparkles size={14} color={tokens.colors.tertiary} />
              <Text variant="bodySm" tone="secondary" style={{ flex: 1 }}>
                First 200 subscribers get Founding Member rate of{' '}
                <Text variant="dataSm" tone="brand" style={{ fontWeight: '700' }}>
                  ₦{FOUNDING_WEEKLY_NGN.toLocaleString()}/week
                </Text>{' '}
                for life ({TRIAL_DAYS}-day free trial, no card needed).
              </Text>
            </View>

            {/* Waitlist Mode Form (PAYMENTS_ENABLED = false) */}
            {!PAYMENTS_ENABLED ? (
              <View style={styles.waitlistContainer}>
                {waitlistStatus === 'success' ? (
                  <Card
                    elevation="inset"
                    style={[
                      styles.successCard,
                      { borderColor: tokens.colors.primary },
                    ]}
                  >
                    <CheckCircle2 size={24} color={tokens.colors.primary} />
                    <Text variant="title" tone="brand" style={{ marginTop: 6 }}>
                      You're on the early access list!
                    </Text>
                    <Text
                      variant="bodySm"
                      tone="secondary"
                      style={{ textAlign: 'center', marginTop: 4 }}
                    >
                      We'll email you the moment the founding member spots open.
                    </Text>
                  </Card>
                ) : (
                  <View style={styles.waitlistForm}>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: tokens.colors.surfaceInset,
                          borderColor:
                            waitlistStatus === 'error'
                              ? tokens.colors.negative
                              : tokens.colors.border,
                        },
                      ]}
                    >
                      <Mail size={16} color={tokens.colors.textTertiary} />
                      <TextInput
                        style={[
                          styles.emailInput,
                          { color: tokens.colors.textPrimary },
                        ]}
                        placeholder="Enter your email"
                        placeholderTextColor={tokens.colors.textTertiary}
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          if (waitlistStatus === 'error') setWaitlistStatus('idle');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    {waitlistStatus === 'error' && errorMessage ? (
                      <Text
                        variant="bodySm"
                        tone="negative"
                        style={{ marginLeft: 4, marginTop: 4 }}
                      >
                        {errorMessage}
                      </Text>
                    ) : null}

                    <Button
                      label="Join the waitlist"
                      variant="primary"
                      fullWidth
                      loading={waitlistStatus === 'loading'}
                      onPress={handleJoinWaitlist}
                      icon={<Zap size={16} color={tokens.colors.onPrimary} />}
                      style={{ marginTop: 10 }}
                    />
                  </View>
                )}
              </View>
            ) : null}

            {/* Secondary Button */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={closePaywall}
              activeOpacity={0.7}
            >
              <Text variant="body" tone="secondary" style={styles.secondaryBtnText}>
                Keep free: 3 picks a day + full record
              </Text>
            </TouchableOpacity>

            {/* Footer Disclaimer */}
            <View style={styles.footerWrap}>
              <Text variant="bodySm" tone="tertiary" style={styles.footerText}>
                Analysis, not betting advice. Edges can lose.
              </Text>
            </View>
          </ScrollView>
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
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headline: {
    fontSize: 21,
    textAlign: 'center',
    letterSpacing: -0.4,
    paddingHorizontal: 8,
  },
  recordStatWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  benefitsCard: {
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  plansWrap: {
    gap: 10,
    marginBottom: 12,
  },
  planOption: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -9,
    right: 14,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  foundingNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  waitlistContainer: {
    marginBottom: 12,
  },
  waitlistForm: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  emailInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  successCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryBtnText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  footerWrap: {
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});
