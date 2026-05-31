import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { C } from '../utils/theme';
import { getLatestApkUpdate } from '../utils/appUpdate';

const CHECK_INTERVAL_MS = 60 * 1000;

export default function AppUpdateGate() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);
  const [opening, setOpening] = useState(false);
  const [dismissedTag, setDismissedTag] = useState(null);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android' || checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    try {
      const result = await getLatestApkUpdate();
      if (result.available && result.tagName !== dismissedTag) {
        setUpdate(result);
      }
    } catch (err) {
      console.log('[UPDATE] check failed:', err?.message || err);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [dismissedTag]);

  useEffect(() => {
    const firstCheck = setTimeout(check, 1800);
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });

    return () => {
      clearTimeout(firstCheck);
      clearInterval(timer);
      sub?.remove?.();
    };
  }, [check]);

  async function openUpdate() {
    if (!update?.apkUrl) return;
    setOpening(true);
    try {
      await Linking.openURL(update.apkUrl);
      setDismissedTag(update.tagName);
      setUpdate(null);
    } catch (err) {
      console.log('[UPDATE] open failed:', err?.message || err);
    } finally {
      setOpening(false);
    }
  }

  function dismiss() {
    setDismissedTag(update?.tagName || null);
    setUpdate(null);
  }

  if (!update) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(7,7,10,0.78)',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingTop: insets.top + 18,
        paddingBottom: insets.bottom + 18,
      }}>
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: C.border,
          overflow: 'hidden',
        }}>
          <LinearGradient
            colors={['#ff6b2b', '#9b59b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 18 }}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 }}>
              {t('update_available_title')}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 19 }}>
              {t('update_available_sub')}
            </Text>
          </LinearGradient>

          <View style={{ padding: 18 }}>
            <View style={{
              backgroundColor: C.surface2,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              padding: 14,
              marginBottom: 14,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <Text style={{ color: C.text2, fontSize: 12 }}>{t('update_current_version')}</Text>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }}>v{update.currentVersion}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ color: C.text2, fontSize: 12 }}>{t('update_latest_version')}</Text>
                <Text style={{ color: C.accent, fontSize: 13, fontWeight: '900' }}>v{update.latestVersion}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={openUpdate}
              activeOpacity={0.82}
              disabled={opening}
              style={{
                backgroundColor: C.accent,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: opening ? 0.72 : 1,
              }}
            >
              {opening ? <ActivityIndicator color="#fff" size="small" /> : null}
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                {t('update_download_button')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={dismiss} style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: C.text2, fontSize: 13, fontWeight: '700' }}>
                {t('update_later_button')}
              </Text>
            </TouchableOpacity>

            {checking ? (
              <Text style={{ color: C.text2, fontSize: 11, textAlign: 'center' }}>
                {t('update_checking')}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
