import { Tabs } from 'expo-router';
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
            backgroundColor: 'rgba(250,246,239,0.88)',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 84 : Platform.OS === 'web' ? 64 : 62,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 10 : 8,
            elevation: 0,
            shadowColor: '#000',
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
        initialRouteName="map"
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            haptic.light();
            // If already on this tab but nested inside a stack, reset to root
            const state = navigation.getState();
            const tabRoute = state.routes.find((r: any) => r.name === route.name);
            if (tabRoute?.state && tabRoute.state.index > 0) {
              e.preventDefault();
              navigation.navigate(route.name as never);
            }
          },
        })}
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
            title: 'Memories',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="image-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                centerStyles.raised,
                focused && centerStyles.raisedActive,
              ]}>
                <Ionicons name="apps" size={22} color={focused ? '#fff' : colors.amber} />
              </View>
            ),
            tabBarLabel: () => null,
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
            title: 'MSG',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  raisedActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
