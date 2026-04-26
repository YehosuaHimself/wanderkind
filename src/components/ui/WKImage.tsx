import React, { useState, useCallback } from 'react';
import { Image, View, StyleSheet, ViewStyle, ImageStyle, Platform, Animated } from 'react-native';

type Props = {
  uri: string;
  style?: ImageStyle | ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  placeholderColor?: string;
};

export function WKImage({ uri, style, resizeMode = 'cover', placeholderColor = '#E8DFD0' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    setLoaded(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacity]);

  // Generate low-quality placeholder URL for Unsplash images
  const placeholderUri = uri?.includes('unsplash.com')
    ? uri.replace(/w=\d+/, 'w=20').replace(/q=\d+/, 'q=10')
    : undefined;

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: placeholderColor }]} />

      {/* Low-res placeholder for Unsplash */}
      {placeholderUri && !loaded && (
        <Image
          source={{ uri: placeholderUri }}
          style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
          resizeMode={resizeMode}
          blurRadius={Platform.OS === 'web' ? 0 : 10}
        />
      )}

      {/* Full resolution image with fade-in */}
      <Animated.Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { opacity }]}
        resizeMode={resizeMode}
        onLoad={onLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E8DFD0',
  },
});
