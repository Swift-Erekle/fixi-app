// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';           // ✅ FIX 1: დაამატე
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

const PUSH_TOKEN_KEY = 'pushToken';

// ── Foreground-ში banner ─────────────────────────────────────
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
    // ✅ FIX 1: ფიზიკური მოწყობილობის შემოწმება
    // getExpoPushTokenAsync ემულატორზე ვერ მუშაობს — ჩუმად null-ს აბრუნებს
    if (!Device.isDevice) {
      console.warn('[Push] ExpoPushToken მხოლოდ ფიზიკურ მოწყობილობაზე მუშაობს!');
      return null;
    }

    // ✅ FIX 2: Android channel — MAX priority (HIGH-ს heads-up არ აქვს!)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Fixi Notifications',
        importance: Notifications.AndroidImportance.MAX,   // HIGH → MAX
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff6b2b',
        showBadge: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // ── ნებართვა ───────────────────────────────────────────
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Push] ნებართვა უარყოფილია — finalStatus:', finalStatus);
      return null;
    }

    // ── projectId ──────────────────────────────────────────
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error('[Push] projectId ვერ მოიძებნა app.json extra.eas.projectId-ში');
      return null;
    }

    // ✅ FIX 3: token-ის მიღებისას ცალსახა error logging
    let token;
    try {
      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      token = result.data;
    } catch (tokenErr) {
      // ❗ ეს შეცდომა ყველაზე ხშირია: FCM credential-ები არ არის Expo-ში
      console.error('[Push] getExpoPushTokenAsync შეცდომა:', tokenErr?.message ?? tokenErr);
      console.error('[Push] → შეამოწმე: expo.dev → პროექტი → Credentials → FCM V1 Service Account Key');
      return null;
    }

    console.log('[Push] ✅ token მიღებულია:', token);

    // SecureStore-ში შენახვა
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token).catch(() => {});

    // Backend-ზე გაგზავნა
    await api('/push/expo-token', {
      method: 'POST',
      body: { token, platform: Platform.OS },
    });
    console.log('[Push] ✅ token DB-ში შენახულია');

    return token;
  } catch (err) {
    console.error('[Push] registerForPushNotifications შეცდომა:', err?.message ?? err);
    return null;
  }
}

// ============================================================
// unregisterPushToken — logout-ზე
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
// App.js-ის import-ები
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

export function notifRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return 'ახლახან';
  const min = Math.floor(sec / 60);
  if (min < 60)  return min + ' წუთის წინ';
  const hrs = Math.floor(min / 60);
  if (hrs < 24)  return hrs + ' სთ წინ';
  const days = Math.floor(hrs / 24);
  if (days < 7)  return days + ' დღის წინ';
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
}
