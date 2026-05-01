import { Tabs } from 'expo-router';
import { StackActions } from '@react-navigation/native';
import { View, Platform, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/lib/theme';
import { haptic } from '../../src/lib/haptics';
import { OfflineBanner } from '../../src/components/OfflineBanner';

const CENTER_SIZE = 52;

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(250,246,239,0.92)',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 64 : 62,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 10 : 8,
            elevation: 0,
            shadowColor: '#1A120A',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
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
        initialRouteName="myway"
        screenListeners={({ navigation, route }: { navigation: any; route: any }) => ({
          tabPress: (e) => {
            haptic.light();
            const state = navigation.getState();
            const tabRoute = state.routes.find((r: any) => r.name === route.name) as any;
            const nested = tabRoute?.state;
            const isFocused = state.index === state.routes.indexOf(tabRoute);
            if (nested && (nested.index ?? 0) > 0) {
              e.preventDefault();
              if (isFocused) {
                navigation.dispatch({ ...StackActions.popToTop(), target: nested.key });
              } else {
                navigation.dispatch({ ...StackActions.popToTop(), target: nested.key });
                navigation.navigate(route.name as never);
              }
            }
          },
        })}
      >
        {/* MY WAY */}
        <Tabs.Screen
          name="myway"
          options={{
            title: 'My Way',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialCommunityIcons name="map-marker-path" size={size} color={color} />
            ),
          }}
        />

        {/* MEMORIES */}
        <Tabs.Screen
          name="moments"
          options={{
            title: 'Memories',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="image-outline" size={size} color={color} />
            ),
          }}
        />

        {/* MORE — raised center button */}
        <Tabs.Screen
          name="more"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <View style={[centerStyles.raised, focused && centerStyles.raisedActive]}>
                <Ionicons name="apps" size={22} color={focused ? '#FAF6EF' : colors.amber} />
              </View>
            ),
            tabBarLabel: () => null,
          }}
        />

        {/* MAP — hidden from tab bar (legacy; community map lives in US-02) */}
        <Tabs.Screen
          name="map"
          options={{
            href: null,   // removes from tab bar entirely
          }}
        />

        {/* MSG */}
        <Tabs.Screen
          name="messages"
          options={{
            title: 'MSG',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="paper-plane-outline" size={size} color={color} />
            ),
          }}
        />

        {/* ME */}
        <Tabs.Screen
          name="me"
          options={{
            title: 'Me',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const centerStyles = StyleSheet.create({
  raised: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: 'rgba(250,246,239,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    borderWidth: 1.5,
    borderColor: 'rgba(200,118,42,0.25)',
    shadowColor: '#1A120A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  raisedActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
});
