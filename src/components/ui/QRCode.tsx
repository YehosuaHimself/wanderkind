import React, { useEffect, useState } from 'react';
import { Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// qrcode is dynamically imported below to reduce initial bundle size

interface QRCodeProps {
  /** The data to encode */
  value: string;
  /** Width/height in pixels */
  size?: number;
  /** Foreground color */
  color?: string;
  /** Background color (transparent by default) */
  backgroundColor?: string;
}

/**
 * Generates a real QR code as a data URL and renders it via <Image>.
 * Works on both web and native.
 */
export function QRCode({
  value,
  size = 100,
  color = '#000000',
  backgroundColor = 'transparent',
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const generateQRCode = async () => {
      try {
        const QRCodeLib = (await import('qrcode')).default;
        const url = await QRCodeLib.toDataURL(value, {
          width: size * 2, // 2x for retina
          margin: 0,
          color: {
            dark: color,
            light: backgroundColor === 'transparent' ? '#00000000' : backgroundColor,
          },
          errorCorrectionLevel: 'M',
        });
        if (!cancelled) setDataUrl(url);
      } catch (err: any) {
        console.warn('QR generation failed:', err?.message);
        if (!cancelled) setFailed(true);
      }
    };

    generateQRCode();

    return () => {
      cancelled = true;
    };
  }, [value, size, color, backgroundColor]);

  if (!dataUrl) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        {failed ? (
          <Text style={{ fontSize: 8, color, textAlign: 'center' }}>QR</Text>
        ) : (
          <ActivityIndicator size="small" color={color} />
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: dataUrl }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="QR code"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
