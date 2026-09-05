import React, { useState } from 'react';
import { Alert, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { Apple, CircleDollarSign, Crown, Palette, ShieldCheck, User, Zap } from 'lucide-react-native';
import { useBetStore } from '../../stores/useBetStore';
import { ThemeMode, useTheme } from '../../stores/useThemeStore';
import { Badge, Button, Card, Text } from '../../components/ui';

export default function ProfileScreen() {
  const { isPro, toggleProMock, openPaywall, bankroll, setBankroll, unitSize, setUnitSize } =
    useBetStore();
  const { tokens, mode, setMode } = useTheme();

  const [bankrollInput, setBankrollInput] = useState(bankroll.toString());
  const [unitInput, setUnitInput] = useState(unitSize.toString());

  const handleUpdateBankroll = () => {
    const b = parseFloat(bankrollInput) || 100000;
    const u = parseFloat(unitInput) || 1000;
    setBankroll(b);
    setUnitSize(u);
    Alert.alert('Settings Updated', 'Your bankroll parameters have been updated.');
  };

  const modeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Account Summary Card */}
      <Card padded={false} style={{ padding: 16, borderRadius: tokens.radius.xxl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: tokens.colors.primarySoft,
              borderWidth: 1.5,
              borderColor: tokens.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <User size={26} color={tokens.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="headlineSm">Quantitative Bettor</Text>
            <Text variant="dataSm" tone="secondary" style={{ marginTop: 2 }}>
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: tokens.colors.primarySoft,
              borderWidth: 1,
              borderColor: tokens.colors.primary,
              borderRadius: tokens.radius.lg,
              padding: 10,
              gap: 8,
            }}
          >
            <ShieldCheck size={16} color={tokens.colors.primary} />
            <Text variant="title" tone="brand" style={{ fontSize: 12 }}>
              All +EV Models & Parlays Unlocked
            </Text>
          </View>
        )}
      </Card>

      {/* 2. Appearance */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Palette size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Appearance</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: tokens.colors.surfaceInset,
            borderWidth: 1,
            borderColor: tokens.colors.border,
            borderRadius: tokens.radius.xl,
            padding: 2,
            gap: 2,
          }}
        >
          {modeOptions.map((opt) => {
            const active = mode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: tokens.radius.lg,
                  backgroundColor: active ? tokens.colors.primary : 'transparent',
                }}
                onPress={() => setMode(opt.value)}
                activeOpacity={0.8}
              >
                <Text variant="title" tone={active ? 'onPrimary' : 'secondary'} style={{ fontSize: 12 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 3. Bankroll Management */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <CircleDollarSign size={18} color={tokens.colors.primary} />
          <Text variant="headlineSm">Bankroll & Unit Sizing</Text>
        </View>
        <Text variant="bodySm" tone="secondary" style={{ marginBottom: 12 }}>
          Configure your total bankroll and standard 1.0 unit size to calculate fractional Kelly stakes.
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="label" tone="tertiary" style={{ marginBottom: 4 }}>Total Bankroll (₦)</Text>
            <TextInput
              style={{
                backgroundColor: tokens.colors.surfaceInset,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius.lg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 15,
                fontFamily: 'JetBrainsMono_700Bold',
                color: tokens.colors.textPrimary,
              }}
              value={bankrollInput}
              onChangeText={setBankrollInput}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" tone="tertiary" style={{ marginBottom: 4 }}>1.0 Unit Size (₦)</Text>
            <TextInput
              style={{
                backgroundColor: tokens.colors.surfaceInset,
                borderWidth: 1,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius.lg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 15,
                fontFamily: 'JetBrainsMono_700Bold',
                color: tokens.colors.textPrimary,
              }}
              value={unitInput}
              onChangeText={setUnitInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Button label="Save Bankroll Settings" variant="secondary" fullWidth onPress={handleUpdateBankroll} />
      </Card>

      {/* 4. Dev Sandbox Subscription Toggle (dev builds only -- this bypasses the paywall) */}
      {__DEV__ && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Crown size={18} color={tokens.colors.secondary} />
            <Text variant="headlineSm">Developer Testing Sandbox</Text>
          </View>
          <Text variant="bodySm" tone="secondary" style={{ marginBottom: 12 }}>
            Toggle between Free Teaser and EdgePoint+ Pro to test paywall gating without making real store purchases.
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: tokens.colors.surfaceInset,
              borderRadius: tokens.radius.xl,
              padding: 12,
            }}
          >
            <Text variant="title" style={{ fontSize: 13 }}>Simulate Pro Active Entitlement</Text>
            <Switch
              value={isPro}
              onValueChange={toggleProMock}
              trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
      )}

      {/* 5. Authentication Options */}
      <Card>
        <Text variant="headlineSm" style={{ marginBottom: 10 }}>Account & Authentication</Text>
        <View style={{ gap: 10 }}>
          <Button
            label="Continue with Google"
            variant="ghost"
            fullWidth
            onPress={() => Alert.alert('Google Sign-In', 'Native Google Sign-In initiated.')}
          />
          <Button
            label="Sign in with Apple"
            variant="ghost"
            fullWidth
            onPress={() => Alert.alert('Apple Sign-In', 'Native Apple Sign-In initiated.')}
            icon={<Apple size={16} color="#FFFFFF" />}
            style={{ backgroundColor: '#000000', borderColor: '#000000' }}
          />
        </View>
      </Card>

      {/* Responsible Gambling Footer */}
      <Text variant="bodySm" tone="tertiary" style={{ textAlign: 'center', paddingHorizontal: 8 }}>
        EdgePoint+ provides mathematical and statistical modeling tools for informational purposes.
        Sports betting involves financial risk. Bet responsibly and within your means. 18+.
      </Text>
    </ScrollView>
  );
}
