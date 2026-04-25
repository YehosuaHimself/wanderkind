import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform alert that works on both native and web.
 * On native: uses React Native Alert.alert
 * On web: uses window.confirm/window.alert
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  if (!buttons || buttons.length === 0) {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  // If there's a cancel + action button pattern, use confirm
  const cancelBtn = buttons.find(b => b.style === 'cancel');
  const actionBtn = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];

  if (buttons.length === 1) {
    window.alert(message ? `${title}\n\n${message}` : title);
    buttons[0].onPress?.();
    return;
  }

  const result = window.confirm(message ? `${title}\n\n${message}` : title);
  if (result) {
    actionBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
