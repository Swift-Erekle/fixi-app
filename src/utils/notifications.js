// src/utils/notifications.js
// ══════════════════════════════════════════════════════════════
// Expo Push Notifications — token registration + listener helpers
// Mobile app file — lives in fixi-app/src/utils/
// Requires: expo-notifications, expo-device (already in Expo SDK)
// ══════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// ── How to display notifications when app is in FOREGROUND ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

/**
 * Request permission + get Expo push token + save to server.
 * Call this after successful login or on app startup if already logged in.
 * @returns {string|null} Expo push token or null if not granted
 */
export async function registerForPushNotifications() {
  // Push only works on real devices
  if (!Device.isDevice) {
    console.warn('[PUSH] Push notifications require a physical device');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Fixi.ge',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff6b2b',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('chat', {
      name: 'ჩათის შეტყობინებები',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
      lightColor: '#ff6b2b',
      sound: 'default',
    });
  }

  // Check / request permissions
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PUSH] Permission denied');
    return null;
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    // Save token to backend — noAutoLogout prevents a 401 here from kicking the user out
    await api('/push/expo-token', {
      method: 'POST',
      body: { token: pushToken, platform: Platform.OS },
      noAutoLogout: true,
    });

    return pushToken;
  } catch (err) {
    console.warn('[PUSH] getExpoPushTokenAsync error:', err.message);
    return null;
  }
}

/**
 * Remove push token from backend on logout.
 */
export async function unregisterPushToken() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    if (tokenData?.data) {
      await api('/push/expo-token', {
        method: 'DELETE',
        body: { token: tokenData.data },
        noAutoLogout: true,
      }).catch(() => {});
    }
  } catch (_) {}
}

/**
 * Add listeners for notification events.
 * Call inside a useEffect in App.js or AppNavigator.js.
 *
 * @param {function} onNotification  - called when notification received in foreground
 * @param {function} onResponse      - called when user taps a notification
 * @returns cleanup function (remove listeners)
 */
export function addNotificationListeners(onNotification, onResponse) {
  const sub1 = Notifications.addNotificationReceivedListener(onNotification);
  const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    sub1.remove();
    sub2.remove();
  };
}

/**
 * Get the notification that launched the app (if any).
 * Use on startup to handle cold-start deep links.
 */
export async function getInitialNotification() {
  return Notifications.getLastNotificationResponseAsync();
}
