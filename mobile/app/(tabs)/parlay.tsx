import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Bookmark, Calculator, Flame, Layers, Trash2, X } from 'lucide-react-native';
import { DailySlipCard } from '../../components/DailySlipCard';
import { Button, Card, Text } from '../../components/ui';
import { getDailySlip, supabase } from '../../lib/supabase';
import { CuratedParlay } from '../../lib/types';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

export default function ParlayScreen() {
  const { slipLegs, removeLegFromSlip, clearSlip, getSlipMetrics, unitSize } = useBetStore();
  const { tokens } = useTheme();
  const [dailySlip, setDailySlip] = useState<CuratedParlay | null>(null);
  const [stakeUnits, setStakeUnits] = useState('1.0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDailySlip().then(setDailySlip);
  }, []);

  const metrics = getSlipMetrics();
  const numericStake = parseFloat(stakeUnits) || 1.0;
  const stakeCash = numericStake * unitSize;
  const potentialPayout = Math.round(stakeCash * metrics.totalOdds);

  const handleSaveSlip = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Sign in required', 'Sign in to save your parlay slip and track it in your bankroll history.');
        return;
      }

      const { error } = await supabase.from('user_saved_slips').insert({
        user_id: user.id,
        legs: slipLegs,
        total_odds: metrics.totalOdds,
        stake_units: numericStake,
        potential_payout: potentialPayout,
      });

      if (error) {
        Alert.alert('Save Failed', "Couldn't save your slip right now. Please try again.");
        return;
      }

      Alert.alert('Slip Saved', 'Your custom parlay has been logged to your bankroll tracker!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.colors.background }}
      contentContainerStyle={{ paddingVertical: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. PointBlank Daily Slip Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, gap: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Flame size={16} color={tokens.colors.primary} />
        </View>
        <Text variant="headlineSm">Algorithm's Daily Anchor</Text>
      </View>

      {dailySlip && <DailySlipCard parlay={dailySlip} />}

      {/* 2. Custom Parlay Builder */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, gap: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Calculator size={16} color={tokens.colors.secondary} />
        </View>
        <Text variant="headlineSm">Custom Parlay Builder ({slipLegs.length} Legs)</Text>
      </View>

      {slipLegs.length === 0 ? (
        <Card style={{ marginHorizontal: 16, padding: 30, alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={36} color={tokens.colors.borderStrong} />
          <Text variant="title" tone="secondary" style={{ marginTop: 12, marginBottom: 6 }}>
            Your Betslip is Empty
          </Text>
          <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', maxWidth: 260 }}>
            Tap "+ Add to Slip" on any +EV pick in the feed to build a synergistic multi-leg ticket.
          </Text>
        </Card>
      ) : (
        <Card style={{ marginHorizontal: 16 }}>
          {/* Slip Legs List */}
          <View style={{ gap: 10, marginBottom: 14 }}>
            {slipLegs.map((leg, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: tokens.colors.surfaceInset,
                  borderRadius: tokens.radius.xl,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: tokens.colors.border,
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text variant="bodySm" tone="secondary">{leg.fixture}</Text>
                  <Text variant="title" style={{ marginTop: 1 }}>{leg.prop}</Text>
                  <Text variant="dataSm" tone="tertiary" style={{ marginTop: 2 }}>
                    {leg.bookmaker} · <Text variant="dataSm" tone="brand">{leg.ev}</Text>
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text variant="dataMd" tone="info">{leg.odds.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={{ padding: 2 }}
                    onPress={() => leg.prediction_id && removeLegFromSlip(leg.prediction_id)}
                  >
                    <X size={16} color={tokens.colors.negative} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Dynamic Mathematical Summary */}
          <Card elevation="inset" style={{ gap: 8, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodySm" tone="secondary">Combined Decimal Odds</Text>
              <Text variant="dataMd" tone="brand">{metrics.totalOdds.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodySm" tone="secondary">Model Win Probability</Text>
              <Text variant="dataSm">{(metrics.jointProb * 100).toFixed(1)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodySm" tone="secondary">Combined +EV Yield</Text>
              <Text variant="dataSm" tone="info">+{metrics.jointEv.toFixed(1)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodySm" tone="secondary">Kelly Recommended Staking</Text>
              <Text variant="dataSm" tone="warning">{metrics.recommendedUnits} Units</Text>
            </View>
          </Card>

          {/* Staking & Payout Calculator */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: tokens.colors.surfaceInset, borderRadius: tokens.radius.xl, borderWidth: 1, borderColor: tokens.colors.border, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text variant="label" tone="tertiary" style={{ marginBottom: 2 }}>Stake (Units)</Text>
              <TextInput
                style={[{ fontSize: 16, color: tokens.colors.textPrimary, padding: 0 }, { fontFamily: 'JetBrainsMono_700Bold' }]}
                value={stakeUnits}
                onChangeText={setStakeUnits}
                keyboardType="numeric"
                placeholder="1.0"
                placeholderTextColor={tokens.colors.textTertiary}
              />
            </View>

            <View style={{ flex: 1, backgroundColor: tokens.colors.primarySoft, borderRadius: tokens.radius.xl, borderWidth: 1, borderColor: tokens.colors.primary, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text variant="label" tone="brand" style={{ marginBottom: 2 }}>Est. Return (₦)</Text>
              <Text variant="dataLg" tone="brand">₦{potentialPayout.toLocaleString()}</Text>
            </View>
          </View>

          {/* Buttons: Clear & Save */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Clear" variant="danger" onPress={clearSlip} icon={<Trash2 size={16} color={tokens.colors.negative} />} />
            <Button
              label={saving ? 'Saving...' : 'Save Parlay Slip'}
              variant="primary"
              loading={saving}
              onPress={handleSaveSlip}
              icon={<Bookmark size={16} color={tokens.colors.onPrimary} />}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
