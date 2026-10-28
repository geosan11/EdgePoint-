import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BarChart3, Layers, TrendingUp, User } from 'lucide-react-native';
import { useBetStore } from '../../stores/useBetStore';
import { useTheme } from '../../stores/useThemeStore';

export default function TabLayout() {
  const { tokens } = useTheme();
  const { slipLegs } = useBetStore();

  return (
    <Tabs
      initialRouteName="edges"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.select({ ios: 24, default: 16 }),
          left: 20,
          right: 20,
          height: 62,
          borderRadius: 31,
          backgroundColor: tokens.colors.surface, // #0F1116
          borderWidth: 1,
          borderColor: tokens.colors.border, // #1E222B
          borderTopWidth: 1,
          borderTopColor: tokens.colors.border,
          paddingBottom: 7,
          paddingTop: 7,
          paddingHorizontal: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarActiveTintColor: tokens.colors.primary, // #00E599
        tabBarInactiveTintColor: tokens.colors.textTertiary,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 24,
          marginHorizontal: 2,
        },
      }}
    >
      {/* 1. Picks (current edges screen) */}
      <Tabs.Screen
        name="edges"
        options={{
          title: 'Picks',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: tokens.colors.primarySoft },
              ]}
            >
              <TrendingUp size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 2. Watchlist (current tracker screen) */}
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Watchlist',
          tabBarBadge: slipLegs.length > 0 ? slipLegs.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: tokens.colors.primary,
            color: tokens.colors.onPrimary,
            fontSize: 9,
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
            height: 16,
            minWidth: 16,
            lineHeight: 16,
            top: 2,
          },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: tokens.colors.primarySoft },
              ]}
            >
              <Layers size={20} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 3. Record (new track record screen) */}
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: tokens.colors.primarySoft },
              ]}
            >
              <BarChart3 size={20} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 4. Account (current profile screen) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: tokens.colors.primarySoft },
              ]}
            >
              <User size={20} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />

      {/* Hidden routes (files preserved) */}
      <Tabs.Screen
        name="index"
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
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
