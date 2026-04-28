// src/utils/api.js
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const BASE = Constants.expoConfig?.extra?.apiBase || 'https://myworker-production.up.railway.app/api';

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

  // ── 30s timeout protection ───────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout || 30000);

  let res;
  try {
    res = await fetch(BASE + path, {
      method: opts.method || 'GET',
      headers,
      body: isFormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    // Network error / timeout / DNS failure
    if (err.name === 'AbortError') throw { status: 0, error: '⏱ კავშირი ძალიან ნელია' };
    throw { status: 0, error: '📡 ინტერნეტი არ არის ან სერვერი ვერ პასუხობს' };
  }
  clearTimeout(timeout);

  const data = await res.json().catch(() => ({}));

  // ── Auto-logout on token expiry (401) ─────────────────────────
  if (res.status === 401 && token && onUnauthorized) {
    onUnauthorized();
  }

  if (!res.ok) throw { status: res.status, ...data };
  return data;
}
