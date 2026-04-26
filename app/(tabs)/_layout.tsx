import { Tabs } from 'expo-router';
import { useRef, useCallback } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/lib/theme';
import { OfflineBanner } from '../../src/components/OfflineBanner';

const { width: WINDOW_W, height: WINDOW_H } = Dimensions.get('window');
const MORE_SIZE = 48;
const DEFAULT_TOP = Platform.OS === 'ios' ? 56 : Platform.OS === 'web' ? 14 : 14;
const DEFAULT_RIGHT = 16;

/** Floating draggable MORE button — appears on all tab screens */
function MoreMenuButton() {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: (pan.x as any)._value || 0, y: (pan.y as any)._value || 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5) isDragging.current = true;
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, g);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (!isDragging.current) {
          router.push('/(tabs)/more' as any);
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        moreBtn.button,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Ionicons name="grid-outline" size={22} color={colors.ink2} />
    </Animated.View>
  );
}

const moreBtn = StyleSheet.create({
  button: {
    position: 'absolute',
    top: DEFAULT_TOP,
    right: DEFAULT_RIGHT,
    width: MORE_SIZE,
    height: MORE_SIZE,
    borderRadius: MORE_SIZE / 2,
    backgroundColor: 'rgba(250,246,239,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(200,118,42,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
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
            title: 'M',
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
