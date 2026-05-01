// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setUnauthorizedHandler } from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';
import { registerForPushNotifications, unregisterPushToken } from '../utils/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const lastLoginAt = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const me = await api('/auth/me', { noAutoLogout: true });
          setUser(me);
          connectSocket();
          registerForPushNotifications().catch(() => {});
        }
      } catch (_) {
        await SecureStore.deleteItemAsync('token').catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(token, userData) {
    lastLoginAt.current = Date.now();
    await SecureStore.setItemAsync('token', token);
    // ✅ FIX: setUser immediately after token write — no await after this point
    // so React re-render (AuthStack → MainStack) fires without any delay.
    setUser(userData);
    connectSocket();
    registerForPushNotifications().catch(() => {});
    // Show plan picker — run in background, must NOT block or await here
    // (any await after setUser delays the re-render and causes the "stuck on login" bug)
    SecureStore.getItemAsync('pendingPlanPicker').then(async (pending) => {
      if (pending === 'true' && (userData.type === 'handyman' || userData.type === 'company')) {
        await SecureStore.deleteItemAsync('pendingPlanPicker').catch(() => {});
        setShowPlanPicker(true);
      }
    }).catch(() => {});
  }

  function dismissPlanPicker() {
    setShowPlanPicker(false);
  }

  async function logout() {
    // ✅ FIX: disconnect socket & clear user FIRST
    disconnectSocket();
    setUser(null);
    // Force navigate to Login immediately, don't wait for state re-render
    global.navigationRef?.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
    await unregisterPushToken().catch(() => {});
    await SecureStore.deleteItemAsync('token').catch(() => {});
  }

  // Auto-logout on 401 (expired/invalid token)
  // The handler receives the token that caused the 401 and checks it's still the
  // current token — this prevents a stale in-flight request from a previous session
  // from logging out a user who just successfully logged in with a new token.
  useEffect(() => {
    setUnauthorizedHandler(async (failedToken) => {
      // Ignore any 401 that arrives within 4s of a successful login — these are always
      // stale in-flight requests from the previous session firing after the new token was saved.
      if (Date.now() - lastLoginAt.current < 4000) return;
      const currentToken = await SecureStore.getItemAsync('token').catch(() => null);
      if (!currentToken) return; // already logged out
      if (failedToken && failedToken !== currentToken) return; // stale 401 from old token
      logout().catch(() => {});
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  function updateUser(partial) {
    setUser(prev => ({ ...prev, ...partial }));
  }

  // Reload user from server — used after VIP purchase etc.
  async function refreshUser() {
    try {
      const fresh = await api('/auth/me', { noAutoLogout: true });
      if (fresh && fresh.id) setUser(fresh);
    } catch (_) {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser, showPlanPicker, dismissPlanPicker }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
