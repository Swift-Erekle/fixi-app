import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_REPO = 'Swift-Erekle/fixi-app';

function appConfig() {
  return Constants.expoConfig || Constants.manifest2?.extra?.expoClient || Constants.manifest || {};
}

export function currentAppVersion() {
  return Constants.nativeAppVersion || appConfig().version || '0.0.0';
}

function repoName() {
  return appConfig().extra?.updateRepo || DEFAULT_REPO;
}

function normalizeVersion(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .replace(/[^\d.]/g, '');
}

export function compareVersions(a, b) {
  const left = normalizeVersion(a).split('.').map(n => Number(n || 0));
  const right = normalizeVersion(b).split('.').map(n => Number(n || 0));
  const len = Math.max(left.length, right.length, 3);

  for (let i = 0; i < len; i += 1) {
    const x = left[i] || 0;
    const y = right[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

function findApkAsset(assets = []) {
  return assets.find(asset => /\.apk$/i.test(asset?.name || ''))
    || assets.find(asset => /\.apk(\?|$)/i.test(asset?.browser_download_url || ''));
}

export async function getLatestApkUpdate() {
  if (Platform.OS !== 'android') {
    return { available: false, reason: 'unsupported-platform' };
  }

  const currentVersion = currentAppVersion();
  const repo = repoName();
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'MyFix-Android-App',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub release check failed: ${response.status}`);
  }

  const release = await response.json();
  const latestVersion = normalizeVersion(release.tag_name || release.name);
  const apk = findApkAsset(release.assets);

  if (!latestVersion || !apk?.browser_download_url) {
    return { available: false, reason: 'missing-apk', currentVersion, latestVersion };
  }

  const available = compareVersions(latestVersion, currentVersion) > 0;

  return {
    available,
    currentVersion,
    latestVersion,
    tagName: release.tag_name,
    title: release.name || release.tag_name,
    notes: release.body || '',
    apkName: apk.name,
    apkUrl: apk.browser_download_url,
    publishedAt: release.published_at,
  };
}
