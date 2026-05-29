// src/utils/api.js
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { translations } from './translations';

const API_ROOT = (
  Constants.expoConfig?.extra?.apiBase || 'https://www.myfix.ge/'
).replace(/\/+$/, '').replace(/\/api$/, '');
const BASE = API_ROOT + '/api';

// Debug logging — set to false in production after fixing
const DEBUG = __DEV__;

// Module-level callback so AuthContext can hook in for 401 auto-logout
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

let apiLang = 'ka';
export function setApiLanguage(lang) {
  apiLang = translations[lang] ? lang : 'ka';
}

function apiText(key, params = null) {
  let value = translations[apiLang]?.[key] || translations.ka?.[key] || key;
  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([name, paramValue]) => {
      value = value.replace(new RegExp(`{${name}}`, 'g'), String(paramValue));
    });
  }
  return value;
}

export async function api(path, opts = {}) {
  const token = await SecureStore.getItemAsync('token').catch(() => null);
  const isFormData = opts.body instanceof FormData;

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  headers['Accept-Language'] = apiLang;
  headers['X-App-Lang'] = apiLang;
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
      throw { status: 0, error: apiText('api_timeout_error') };
    }
    throw {
      status: 0,
      error: DEBUG
        ? `${apiText('api_network_error')}\n(${err.message})`
        : `${apiText('api_network_error')}\n${apiText('api_check_internet')}`,
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
    data = { error: apiText('api_bad_json', { status: res.status }) };
  }

  if (DEBUG && !res.ok) console.warn('[API] Error', res.status, data);

  // ── Auto-logout on token expiry (401) ─────────────────────────
  // Pass the token that caused the 401 so the handler can verify it's still current
  // (prevents a stale 401 from a previous session from logging out a newly-logged-in user)
  if (res.status === 401 && token && onUnauthorized && !opts.noAutoLogout) {
    onUnauthorized(token);
  }

  if (!res.ok) {
    throw {
      status: res.status,
      error: data.error || apiText('api_http_error', { status: res.status }),
      ...data,
    };
  }
  return data;
}
