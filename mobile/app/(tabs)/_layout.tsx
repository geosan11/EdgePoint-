import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BarChart3, Calendar, Compass, Layers, ShieldCheck, TrendingUp, User, Users, Zap } from 'lucide-react-native';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

export default function TabLayout() {
  const { tokens } = useTheme();
  const { slipLegs, trackerBets } = useBetStore();

  const activeBetsCount = trackerBets.filter((b) => b.result === 'pending').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.colors.background,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          height: Platform.select({ ios: 84, default: 64 }),
          paddingBottom: Platform.select({ ios: 24, default: 8 }),
          paddingTop: 8,
        },
        tabBarActiveTintColor: tokens.colors.primary, // Electric Emerald
        tabBarInactiveTintColor: tokens.colors.textTertiary,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      {/* 1. Fixtures */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fixtures',
          tabBarBadge: 2,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => <Calendar size={19} color={color} />,
        }}
      />

      {/* 2. Edges */}
      <Tabs.Screen
        name="edges"
        options={{
          title: 'Edges',
          tabBarBadge: 6,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => <TrendingUp size={19} color={color} />,
        }}
      />

      {/* 3. Tracker */}
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
          tabBarBadge: slipLegs.length > 0 ? slipLegs.length : activeBetsCount > 0 ? activeBetsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => <Layers size={19} color={color} />,
        }}
      />

      {/* 4. Community & Feed */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Users size={19} color={color} />,
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={19} color={color} />,
        }}
      />

      {/* Legacy hidden screens */}
      <Tabs.Screen
        name="parlay"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
