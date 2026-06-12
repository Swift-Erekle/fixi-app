// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setUnauthorizedHandler } from '../utils/api';
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket';
import { registerForPushNotifications, unregisterPushToken } from '../utils/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastLoginAt = useRef(0);

  // ── Startup: restore session ───────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const me = await api('/auth/me', { noAutoLogout: true });
          setUser(me);
          connectSocket();
          registerForPushNotifications().catch(() => {});
          fetchUnreadCount();
          maybeShowPlanPickerForLimits(me).catch(() => {});
        }
      } catch (_) {
        await SecureStore.deleteItemAsync('token').catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Fetch unread count from server ─────────────────────────
  async function fetchUnreadCount() {
    try {
      const res = await api('/notifications', { noAutoLogout: true });
      setUnreadCount(res.unreadCount || 0);
    } catch (_) {}
  }

  // ── Clear badge when Notifications screen opens ────────────
  function clearUnread() {
    setUnreadCount(0);
  }

  // ── Poll every 60s for unread count ───────────────────────
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // ── Socket: increment badge on new notification ────────────
  // ✅ getSocket imported at top (no dynamic require)
  // ✅ cleanup properly removes the listener
  useEffect(() => {
    if (!user) return;

    const handler = () => setUnreadCount(prev => prev + 1);

    // Attach after a short delay — socket needs time to connect on login
    const timer = setTimeout(() => {
      const sock = getSocket();
      if (sock) sock.on('notification', handler);
    }, 1000);

    // ✅ Cleanup: remove listener AND clear timer
    return () => {
      clearTimeout(timer);
      const sock = getSocket();
      if (sock) sock.off('notification', handler);
    };
  }, [user?.id]);

  // ── Login ──────────────────────────────────────────────────
  async function login(token, userData) {
    lastLoginAt.current = Date.now();
    await SecureStore.setItemAsync('token', token);
    setUser(userData);
    connectSocket();
    registerForPushNotifications().catch(() => {});
    fetchUnreadCount().catch(() => {});
    SecureStore.getItemAsync('pendingPlanPicker').then(async (pending) => {
      if (pending === 'true' && (userData.type === 'handyman' || userData.type === 'company')) {
        await SecureStore.deleteItemAsync('pendingPlanPicker').catch(() => {});
        setShowPlanPicker(true);
      } else {
        await maybeShowPlanPickerForLimits(userData).catch(() => {});
      }
    }).catch(() => {});
  }

  async function maybeShowPlanPickerForLimits(userData) {
    if (!userData || (userData.type !== 'handyman' && userData.type !== 'company')) return;
    const plan = userData.plan || 'start';
    if (plan !== 'start') {
      if ((plan === 'pro' || plan === 'top') &&
        (userData.subscriptionStatus === 'expired' || !userData.planExpiresAt || new Date(userData.planExpiresAt) < new Date())) {
        setShowPlanPicker(true);
      }
      return;
    }

    if (!userData.trialExpiresAt || new Date(userData.trialExpiresAt) < new Date()) {
      setShowPlanPicker(true);
      return;
    }

    if (userData.startUnlimited) return;

    const myOffers = await api('/offers/mine', { noAutoLogout: true });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCount = (myOffers || []).filter((o) =>
      new Date(o.createdAt) >= thirtyDaysAgo
    ).length;
    if (recentCount >= 5) setShowPlanPicker(true);
  }

  function dismissPlanPicker() {
    setShowPlanPicker(false);
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    disconnectSocket();
    setUser(null);
    setUnreadCount(0);
    global.navigationRef?.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
    await unregisterPushToken().catch(() => {});
    await SecureStore.deleteItemAsync('token').catch(() => {});
  }

  // ── Auto-logout on 401 ─────────────────────────────────────
  useEffect(() => {
    setUnauthorizedHandler(async (failedToken) => {
      if (Date.now() - lastLoginAt.current < 4000) return;
      const currentToken = await SecureStore.getItemAsync('token').catch(() => null);
      if (!currentToken) return;
      if (failedToken && failedToken !== currentToken) return;
      logout().catch(() => {});
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  function updateUser(partial) {
    setUser(prev => ({ ...prev, ...partial }));
  }

  async function refreshUser() {
    try {
      const fresh = await api('/auth/me', { noAutoLogout: true });
      if (fresh && fresh.id) setUser(fresh);
    } catch (_) {}
  }

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateUser, refreshUser,
      showPlanPicker, dismissPlanPicker,
      unreadCount, clearUnread,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
