// src/utils/api.js
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const BASE = 'https://myworker-production.up.railway.app/api';

// Debug logging — set to false in production after fixing
const DEBUG = __DEV__;

// Module-level callback so AuthContext can hook in for 401 auto-logout
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export async function api(path, opts = {}) {
  const token = await SecureStore.getItemAsync('token').catch(() => null);
  const isFormData = opts.body instanceof FormData;

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (opts.headers) Object.assign(headers, opts.headers);

  const fullUrl = BASE + path;
  if (DEBUG) console.log('[API]', opts.method || 'GET', fullUrl);

  // ── 30s timeout protection ───────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout || 30000);

  let res;
  try {
    res = await fetch(fullUrl, {
      method: opts.method || 'GET',
      headers,
      body: isFormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (DEBUG) console.error('[API] Network error:', err.message, 'URL:', fullUrl);
    // Network error / timeout / DNS failure
    if (err.name === 'AbortError') {
      throw { status: 0, error: '⏱ კავშირი ძალიან ნელია — სცადე თავიდან' };
    }
    throw {
      status: 0,
      error: `📡 სერვერთან კავშირი ვერ მოხდა\n${DEBUG ? '(' + err.message + ')' : 'შეამოწმე ინტერნეტი'}`,
    };
  }
  clearTimeout(timeout);

  // Try to parse JSON response
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    if (DEBUG) console.error('[API] JSON parse error, status:', res.status);
    data = { error: `სერვერმა არასწორი მონაცემი დააბრუნა (${res.status})` };
  }

  if (DEBUG && !res.ok) console.warn('[API] Error', res.status, data);

  // ── Auto-logout on token expiry (401) ─────────────────────────
  if (res.status === 401 && token && onUnauthorized) {
    onUnauthorized();
  }

  if (!res.ok) {
    throw {
      status: res.status,
      error: data.error || `შეცდომა (HTTP ${res.status})`,
      ...data,
    };
  }
  return data;
}
