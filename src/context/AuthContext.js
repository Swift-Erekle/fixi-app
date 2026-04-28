// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setUnauthorizedHandler } from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';
import { registerForPushNotifications, unregisterPushToken } from '../utils/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const me = await api('/auth/me');
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
    await SecureStore.setItemAsync('token', token);
    setUser(userData);
    connectSocket();
    registerForPushNotifications().catch(() => {});
  }

  async function logout() {
    await unregisterPushToken().catch(() => {});
    await SecureStore.deleteItemAsync('token').catch(() => {});
    disconnectSocket();
    setUser(null);
  }

  // Auto-logout on 401 (expired/invalid token)
  useEffect(() => {
    setUnauthorizedHandler(() => { logout().catch(() => {}); });
    return () => setUnauthorizedHandler(null);
  }, []);

  function updateUser(partial) {
    setUser(prev => ({ ...prev, ...partial }));
  }

  // Reload user from server — used after VIP purchase etc.
  async function refreshUser() {
    try {
      const fresh = await api('/auth/me');
      if (fresh && fresh.id) setUser(fresh);
    } catch (_) {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
