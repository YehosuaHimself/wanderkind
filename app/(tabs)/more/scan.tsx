import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';

// expo-camera doesn't work on web — conditionally import
let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch {}
}

// Web fallback: show a message that scanning requires the native app
function WebScanFallback() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Scan QR Code" showBack />
      <View style={styles.permissionContent}>
        <Ionicons name="qr-code-outline" size={64} color={colors.amber} />
        <Text style={[typography.h2, { color: colors.ink, marginTop: spacing.lg, textAlign: 'center' }]}>
          QR Scanning
        </Text>
        <Text style={[typography.body, { color: colors.ink2, marginTop: spacing.md, textAlign: 'center' }]}>
          QR code scanning requires camera access which is available on the mobile app. You can still enter trail names manually to find walkers.
        </Text>
        <WKButton
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

export default function ScanScreen() {
  // On web, show fallback immediately
  if (Platform.OS === 'web') {
    return <WebScanFallback />;
  }

  return <NativeScanScreen />;
}

function NativeScanScreen() {
  const router = useRouter();
  const [permission, setPermission] = useState<any>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (useCameraPermissions) {
      // Request permissions on mount
      const requestPerm = async () => {
        try {
          const cam = require('expo-camera');
          const result = await cam.Camera?.requestCameraPermissionsAsync?.();
          setPermission(result);
        } catch {}
      };
      requestPerm();
    }
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={48} color={colors.amber} />
          <Text style={[typography.h2, { color: colors.ink, marginTop: spacing.lg }]}>
            Camera Access Needed
          </Text>
          <Text style={[typography.body, { color: colors.ink2, marginTop: spacing.md, textAlign: 'center' }]}>
            Allow Wanderkind to access your camera to scan QR codes and check in at places.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              try {
                const cam = require('expo-camera');
                const result = await cam.Camera?.requestCameraPermissionsAsync?.();
                setPermission(result);
              } catch {}
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: any) => {
    if (scanned) return;
    setScanned(true);

    // Parse QR code data
    try {
      const scannedData = JSON.parse(data);
      Alert.alert('QR Code Scanned', `Type: ${scannedData.type}`, [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            if (scannedData.type === 'check-in') {
              router.back();
            } else if (scannedData.type === 'profile') {
              router.push(`/(tabs)/profile/${scannedData.id}` as any);
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Invalid QR Code', 'Could not read this QR code.', [
        {
          text: 'Try Again',
          onPress: () => setScanned(false),
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.surface} />
        </TouchableOpacity>
        <Text style={[typography.h3, styles.headerTitle]}>Scan QR Code</Text>
        <View style={styles.headerSpacer} />
      </View>

      {CameraView && (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.instructionText}>
              Point camera at QR code
            </Text>
          </View>
        </CameraView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.flashButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Ionicons name="flashlight-outline" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  camera: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: colors.surface, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 36 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.amber,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionText: {
    marginTop: spacing.xl,
    color: colors.surface,
    ...typography.body,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  flashButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(200,118,42,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  permissionButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.amber,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: colors.surface,
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cancelButtonText: {
    color: colors.amber,
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
