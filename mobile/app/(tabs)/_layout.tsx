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
          backgroundColor: '#080A0E',
          borderTopColor: '#1E222B',
          borderTopWidth: 1,
          height: Platform.select({ ios: 84, default: 66 }),
          paddingBottom: Platform.select({ ios: 24, default: 8 }),
          paddingTop: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: tokens.colors.primary, // #00E599 Electric Emerald
        tabBarInactiveTintColor: tokens.colors.textTertiary,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 10,
          letterSpacing: 0.4,
          marginTop: 2,
        },
      }}
    >
      {/* 1. Fixtures */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'FIXTURES',
          tabBarBadge: 2,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
            height: 16,
            minWidth: 16,
            lineHeight: 16,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Calendar size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      {/* 2. Edges */}
      <Tabs.Screen
        name="edges"
        options={{
          title: '+EV EDGES',
          tabBarBadge: 6,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
            height: 16,
            minWidth: 16,
            lineHeight: 16,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <TrendingUp size={19} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      {/* 3. Tracker */}
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'TRACKER',
          tabBarBadge: slipLegs.length > 0 ? slipLegs.length : activeBetsCount > 0 ? activeBetsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
            height: 16,
            minWidth: 16,
            lineHeight: 16,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Layers size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      {/* 4. Community & Feed */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'SYNDICATE',
          tabBarIcon: ({ color, size, focused }) => (
            <Users size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'TERMINAL',
          tabBarIcon: ({ color, size, focused }) => (
            <User size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
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
