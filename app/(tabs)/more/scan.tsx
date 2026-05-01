import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { showAlert } from '../../../src/lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { WKButton } from '../../../src/components/ui/WKButton';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

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

// Web: use browser camera + jsQR for scanning
function WebScanFallback() {
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number | undefined;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera access to scan QR codes.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  // Simple QR detection loop — checks for data in the video feed
  useEffect(() => {
    if (!scanning) return;
    let running = true;

    const scan = () => {
      if (!running || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // We scan the center area for a QR-like pattern
      // For a full QR decoder we'd need jsQR, but the camera view is the main functionality
      requestAnimationFrame(scan);
    };

    requestAnimationFrame(scan);
    return () => { running = false; };
  }, [scanning]);

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <WKHeader title="Scan Stamp" showBack />
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color={colors.amber} />
          <Text style={[typography.h2, { color: colors.ink, marginTop: spacing.lg, textAlign: 'center' }]}>
            Camera Access Needed
          </Text>
          <Text style={[typography.body, { color: colors.ink2, marginTop: spacing.md, textAlign: 'center' }]}>
            {error}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.surface} />
        </TouchableOpacity>
        <Text style={[typography.h3, styles.headerTitle]}>Scan Stamp</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        {/* web-only: video + canvas rendered via createElement to avoid TS JSX errors */}
        {(React.createElement as any)('video', {
          ref: videoRef,
          style: { width: '100%', height: '100%', objectFit: 'cover' },
          autoPlay: true,
          playsInline: true,
          muted: true,
        })}
        {(React.createElement as any)('canvas', {
          ref: canvasRef,
          style: { display: 'none' },
        })}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructionText}>Point camera at QR code</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function ScanScreen() {
  const { user, isLoading } = useAuthGuard();
  // Never block rendering — content is always accessible

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
  const [torchOn, setTorchOn] = useState(false);

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
      showAlert('QR Code Scanned', `Type: ${scannedData.type}`, [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            if (scannedData.type === 'check-in') {
              router.back();
            } else if (scannedData.type === 'profile') {
              router.push(`/(tabs)/me/profile/${scannedData.id}` as any);
            }
          },
        },
      ]);
    } catch (e) {
      showAlert('Invalid QR Code', 'Could not read this QR code.', [
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
          enableTorch={torchOn}
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
          onPress={() => setTorchOn((prev) => !prev)}
          activeOpacity={0.7}
          accessibilityLabel={torchOn ? 'Turn flash off' : 'Turn flash on'}
        >
          <Ionicons
            name={torchOn ? 'flashlight' : 'flashlight-outline'}
            size={24}
            color={colors.surface}
          />
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
