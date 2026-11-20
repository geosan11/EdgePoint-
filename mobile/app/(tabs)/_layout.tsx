import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import {
  CalendarDays,
  Home,
  LineChart,
  MoreHorizontal,
  ScanSearch,
} from 'lucide-react-native';

export default function TabLayout() {
  const activeColor = '#059669'; // EdgePoint light emerald
  const inactiveColor = '#64748B'; // slate-500
  const activePillBg = 'rgba(5, 150, 105, 0.12)';

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.select({ ios: 24, default: 12 }),
          left: 10,
          right: 10,
          height: 60,
          borderRadius: 20,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 6,
          paddingTop: 6,
          paddingHorizontal: 4,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
          letterSpacing: -0.2,
          marginTop: 1,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 0,
          paddingHorizontal: 0,
        },
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && { backgroundColor: activePillBg }]}>
              <Home size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 2. Matches (PR #5 Today board) */}
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && { backgroundColor: activePillBg }]}>
              <CalendarDays size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 3. Analysis (edges / picks) */}
      <Tabs.Screen
        name="edges"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && { backgroundColor: activePillBg }]}>
              <LineChart size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 4. Scanner (placeholder) */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && { backgroundColor: activePillBg }]}>
              <ScanSearch size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 5. More (profile + links) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && { backgroundColor: activePillBg }]}>
              <MoreHorizontal size={19} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* Hidden routable tabs */}
      <Tabs.Screen
        name="tracker"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          href: null,
        }}
      />
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

const styles = StyleSheet.create({
  iconPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
