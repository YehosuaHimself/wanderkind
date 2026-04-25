import { Tabs } from 'expo-router';
import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/lib/theme';
import { OfflineBanner } from '../../src/components/OfflineBanner';

/** Floating MORE button — appears in upper-right on all tab screens */
function MoreMenuButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={moreBtn.button}
      onPress={() => router.push('/(tabs)/more' as any)}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="grid-outline" size={18} color={colors.ink2} />
    </TouchableOpacity>
  );
}

const moreBtn = StyleSheet.create({
  button: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : Platform.OS === 'web' ? 14 : 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250,246,239,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(200,118,42,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <MoreMenuButton />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(250,246,239,0.95)',
            borderTopWidth: 0.5,
            borderTopColor: colors.amberLine,
            height: Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 62 : 60,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 10 : 8,
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
          name="myway"
          options={{
            title: 'My Way',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="map-marker-path" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="moments"
          options={{
            title: 'Moments',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="image-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'DM',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paper-plane-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: 'Me',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        {/* MORE — hidden from tab bar, accessible via floating button */}
        <Tabs.Screen
          name="more"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
