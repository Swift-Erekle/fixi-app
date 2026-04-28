// src/utils/socket.js
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ✅ FIXED: URL derived from app.json extra.apiBase, not hardcoded
const API_BASE = Constants.expoConfig?.extra?.apiBase || 'https://myworker-production.up.railway.app/api';
const SOCKET_URL = API_BASE.replace('/api', '');

let socket = null;

export async function connectSocket() {
  if (socket?.connected) return socket;
  const token = await SecureStore.getItemAsync('token').catch(() => null);
  if (!token) return null;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
  });
  socket.on('connect', () => console.log('[SOCKET] connected:', SOCKET_URL));
  socket.on('disconnect', () => console.log('[SOCKET] disconnected'));
  socket.on('connect_error', (e) => console.warn('[SOCKET] error:', e.message));
  return socket;
}

export function getSocket() { return socket; }
export function disconnectSocket() { socket?.disconnect(); socket = null; }
