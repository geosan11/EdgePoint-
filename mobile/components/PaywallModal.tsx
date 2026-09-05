import React, { useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Crown, X, Zap } from 'lucide-react-native';
import { purchaseProPackage, restorePurchases } from '../lib/revenuecat';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Button, Card, Text } from './ui';

export function PaywallModal() {
  const { isPaywallVisible, closePaywall, setPro } = useBetStore();
  const { tokens } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const success = await purchaseProPackage(selectedPlan);
      if (success) {
        setPro(true);
        closePaywall();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        setPro(true);
        closePaywall();
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Complete +EV Model Feed across Global Basketball (NBA, CBA, EuroLeague) & Football (EPL, UCL)',
    'Daily PointBlank Slip: Curated high-correlation multi-leg parlays',
    'EdgeRadar Steam Tracker: Sharp line shifts & retail bookmaker divergence',
    'Proprietary EdgeScores (0-100), EdgeDeltas (Δ), and Kelly Criterion bankroll sizing',
    'Real-time odds updates & instant line value alerts',
  ];

  return (
    <Modal visible={isPaywallVisible} animationType="slide" transparent onRequestClose={closePaywall}>
      <View style={{ flex: 1, backgroundColor: tokens.colors.overlay, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: tokens.colors.surfaceElevated,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            maxHeight: '88%',
            paddingBottom: 24,
          }}
        >
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: tokens.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            onPress={closePaywall}
          >
            <X size={20} color={tokens.colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 24 }}>
            {/* Header Badge & Title */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: tokens.colors.primarySoft,
                  borderWidth: 1.5,
                  borderColor: tokens.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Crown size={28} color={tokens.colors.primary} />
              </View>
              <Text variant="display">
                EdgePoint<Text variant="display" tone="brand">+</Text> PRO
              </Text>
              <Text variant="bodySm" tone="secondary" style={{ textAlign: 'center', marginTop: 6, maxWidth: 280 }}>
                Stop guessing. Start calculating. Unlock quantitative market edges.
              </Text>
            </View>

            {/* Feature Highlights */}
            <Card elevation="raised" style={{ marginBottom: 20, gap: 10 }}>
              {features.map((feat, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={16} color={tokens.colors.primary} style={{ marginTop: 2 }} />
                  <Text variant="body" style={{ flex: 1 }}>
                    {feat}
                  </Text>
                </View>
              ))}
            </Card>

            {/* Pricing Selectors */}
            <View style={{ gap: 10, marginBottom: 20 }}>
              {/* Annual Plan (Best Value) */}
              <TouchableOpacity
                style={{
                  backgroundColor: selectedPlan === 'annual' ? tokens.colors.primarySoft : tokens.colors.surface,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selectedPlan === 'annual' ? tokens.colors.primary : tokens.colors.border,
                  padding: 14,
                  position: 'relative',
                }}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.85}
              >
                <Badge label="SAVE 40%" tone="positive" filled style={{ position: 'absolute', top: -9, right: 14 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <Text variant="title">Annual Access</Text>
                  <Text variant="dataLg" tone="brand">
                    ₦105,000<Text variant="dataSm" tone="secondary">/yr</Text>
                  </Text>
                </View>
                <Text variant="bodySm" tone="secondary">~₦8,750 / month billed annually</Text>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={{
                  backgroundColor: selectedPlan === 'monthly' ? tokens.colors.primarySoft : tokens.colors.surface,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selectedPlan === 'monthly' ? tokens.colors.primary : tokens.colors.border,
                  padding: 14,
                }}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <Text variant="title">Monthly Flexibility</Text>
                  <Text variant="dataLg" tone="brand">
                    ₦14,900<Text variant="dataSm" tone="secondary">/mo</Text>
                  </Text>
                </View>
                <Text variant="bodySm" tone="secondary">Cancel anytime in App Store or Play Store</Text>
              </TouchableOpacity>
            </View>

            {/* CTA Button */}
            <Button
              label={selectedPlan === 'annual' ? 'Start 7-Day Free Trial' : 'Unlock EdgePoint+ Pro'}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleSubscribe}
              icon={<Zap size={18} color={tokens.colors.onPrimary} />}
              style={{ marginBottom: 16 }}
            />

            {/* Restore & Policy Links */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={handleRestore}>
                <Text variant="bodySm" tone="tertiary">Restore Purchases</Text>
              </TouchableOpacity>
              <Text variant="bodySm" tone="tertiary">•</Text>
              <Text variant="bodySm" tone="tertiary">Terms of Service</Text>
              <Text variant="bodySm" tone="tertiary">•</Text>
              <Text variant="bodySm" tone="tertiary">Privacy</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
