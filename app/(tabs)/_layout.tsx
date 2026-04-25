import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(250,246,239,0.95)',
          borderTopWidth: 0.5,
          borderTopColor: colors.amberLine,
          height: Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 56 : 60,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 6 : 8,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: {
          fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : Platform.OS === 'ios' ? 'Courier New' : 'monospace',
          fontSize: 8,
          letterSpacing: 1.5,
          fontWeight: '600',
          textTransform: 'uppercase',
        },
      }}
      initialRouteName="map"
    >
      <Tabs.Screen
        name="moments"
        options={{
          title: 'Moments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Msg',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
