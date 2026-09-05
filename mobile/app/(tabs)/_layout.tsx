import React from 'react';
import { Tabs } from 'expo-router';
import { Layers, TrendingUp, User, Zap } from 'lucide-react-native';
import { useTheme } from '../../stores/useThemeStore';

export default function TabLayout() {
  const { tokens } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.colors.background,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'SpaceGrotesk_700Bold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '+EV Feed',
          tabBarIcon: ({ color, size }) => <TrendingUp size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="parlay"
        options={{
          title: 'PointBlank',
          tabBarIcon: ({ color, size }) => <Layers size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          title: 'EdgeRadar',
          tabBarIcon: ({ color, size }) => <Zap size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
