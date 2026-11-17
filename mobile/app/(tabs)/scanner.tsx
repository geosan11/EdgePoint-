import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { ScanSearch, Sparkles, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/reusables/card';
import { Badge } from '../../components/reusables/badge';
import { Button } from '../../components/reusables/button';
import { Text } from '../../components/reusables/text';
import { lightTokens } from '../../theme/tokens';

export default function ScannerScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC]"
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 100,
      }}
    >
      <View className="w-full max-w-[560px]">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Odds Scanner
            </Text>
            <Text className="text-xs text-[#64748B] mt-0.5">
              Cross-book discrepancy and arbitrage finder
            </Text>
          </View>
          <Badge variant="secondary" className="bg-[#0284C7]/10 border-0 px-2.5 py-1">
            <Text className="text-xs font-semibold text-[#0284C7]">PR B Preview</Text>
          </Badge>
        </View>

        {/* Placeholder Card */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm mt-3 p-6 items-center text-center">
          <View className="h-16 w-16 rounded-2xl bg-[#059669]/10 items-center justify-center mb-4">
            <ScanSearch size={32} color="#059669" strokeWidth={2} />
          </View>

          <CardTitle className="text-xl font-bold text-[#0F172A] text-center mb-1">
            Odds Scanner Arriving in Next Update
          </CardTitle>
          <CardDescription className="text-center text-sm text-[#475569] leading-relaxed max-w-[420px] mb-6">
            Real-time odds scanning across SportyBet and benchmark sportsbooks with live fair odds, EV% rankings, and instant market discrepancies.
          </CardDescription>

          <View className="w-full bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] mb-6">
            <View className="flex-row items-center mb-2.5">
              <Sparkles size={16} color="#059669" />
              <Text className="text-xs font-bold text-[#0F172A] ml-2">What to expect in PR B:</Text>
            </View>
            <Text className="text-xs text-[#64748B] mb-1.5">• Multi-book line comparison (SportyBet vs Sharp Benchmarks)</Text>
            <Text className="text-xs text-[#64748B] mb-1.5">• Instant edge % calculations with fair market devigging</Text>
            <Text className="text-xs text-[#64748B]">• Filter chips for Football, Basketball, Player Props & Live markets</Text>
          </View>

          <Button
            variant="default"
            className="w-full bg-[#059669] h-11 rounded-xl"
            onPress={() => router.push('/(tabs)/edges')}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white font-semibold text-sm mr-2">Browse Today's Analysis</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}
