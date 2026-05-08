// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { translations } from './translations';

const PUSH_TOKEN_KEY = 'pushToken';

// Foreground banner behavior.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================================
// registerForPushNotifications
// ============================================================
export async function registerForPushNotifications() {
  try {
    // Expo push tokens are only available on physical devices.
    if (!Device.isDevice) {
      console.warn('[Push] ExpoPushToken works only on a physical device.');
      return null;
    }

    // Android channel with heads-up priority.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MyFix Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff6b2b',
        showBadge: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // Permissions.
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Push] Permission denied. finalStatus:', finalStatus);
      return null;
    }

    // ── projectId ──────────────────────────────────────────
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error('[Push] projectId not found in app.json extra.eas.projectId.');
      return null;
    }

    // Log token retrieval errors explicitly.
    let token;
    try {
      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      token = result.data;
    } catch (tokenErr) {
      console.error('[Push] getExpoPushTokenAsync error:', tokenErr?.message ?? tokenErr);
      console.error('[Push] Check expo.dev project credentials: FCM V1 Service Account Key.');
      return null;
    }

    console.log('[Push] Token received:', token);

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token).catch(() => {});

    await api('/push/expo-token', {
      method: 'POST',
      body: { token, platform: Platform.OS },
    });
    console.log('[Push] Token saved in DB.');

    return token;
  } catch (err) {
    console.error('[Push] registerForPushNotifications error:', err?.message ?? err);
    return null;
  }
}

// ============================================================
// unregisterPushToken — logout
// ============================================================
export async function unregisterPushToken() {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (token) {
      await api('/push/expo-token', { method: 'DELETE', body: { token } });
    }
  } catch (_) {
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
  }
}

// ============================================================
// App.js imports
// ============================================================
export function addNotificationListeners(onForeground, onTap) {
  const receivedSub = Notifications.addNotificationReceivedListener(n => {
    onForeground?.(n);
  });
  const responseSub = Notifications.addNotificationResponseReceivedListener(r => {
    onTap?.(r);
  });
  return () => {
    Notifications.removeNotificationSubscription(receivedSub);
    Notifications.removeNotificationSubscription(responseSub);
  };
}

export async function getInitialNotification() {
  return await Notifications.getLastNotificationResponseAsync();
}

// ============================================================
// In-app notification helpers
// ============================================================
let notifCache = [];

export async function loadNotifications(onSuccess) {
  try {
    const data = await api('/notifications');
    notifCache = data.notifications || [];
    onSuccess?.({ notifications: notifCache, unreadCount: data.unreadCount || 0 });
  } catch (_) {}
}

export async function onNotifClick(id, link, navigation, onStateChange) {
  api('/notifications/read', { method: 'POST', body: { id } }).catch(() => {});
  const n = notifCache.find(x => x.id === id);
  if (n) n.read = true;
  onStateChange?.({
    notifications: [...notifCache],
    unreadCount: notifCache.filter(x => !x.read).length,
  });
  if (link && navigation) {
    const params = new URLSearchParams(link.startsWith('?') ? link.slice(1) : link);
    const chatId     = params.get('chat');
    const reqId      = params.get('req');
    const reviewId   = params.get('review');
    const proposalId = params.get('proposal');
    if (chatId)          navigation.navigate('Chat',     { chatId });
    else if (reqId)      navigation.navigate('Request',  { reqId });
    else if (proposalId) navigation.navigate('Proposal', { proposalId });
    else if (reviewId)   navigation.navigate('Profile',  { userId: reviewId, autoFocusReview: true });
  }
}

export async function markAllNotifRead(onStateChange) {
  try {
    await api('/notifications/read', { method: 'POST', body: {} });
    notifCache.forEach(n => (n.read = true));
    onStateChange?.({ notifications: [...notifCache], unreadCount: 0 });
  } catch (_) {}
}

// ============================================================
// Pure utilities
// ============================================================
export function notifIcon(type) {
  switch (type) {
    case 'new_offer':      return '💬';
    case 'offer_accepted': return '🎉';
    case 'offer_rejected': return '❌';
    case 'new_message':    return '✉️';
    case 'offer_updated':  return '✏️';
    default:               return '🔔';
  }
}

function notificationText(lang, key, params = null) {
  let value = translations[lang]?.[key] || translations.ka?.[key] || key;
  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([name, paramValue]) => {
      value = value.replace(new RegExp(`{${name}}`, 'g'), String(paramValue));
    });
  }
  return value;
}

export function notifRelativeTime(iso, lang = 'ka') {
  const diff = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return notificationText(lang, 'time_just_now_app');
  const min = Math.floor(sec / 60);
  if (min < 60)  return notificationText(lang, 'time_minutes_short', { count: min });
  const hrs = Math.floor(min / 60);
  if (hrs < 24)  return notificationText(lang, 'time_hours_short', { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7)  return notificationText(lang, 'time_days_short', { count: days });
  const locale = lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
