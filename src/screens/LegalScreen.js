import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';
import { Btn } from '../components/UI';

const LEGAL_URLS = {
  terms: 'https://www.myfix.ge/terms.html',
  privacy: 'https://www.myfix.ge/privacy.html',
};

export default function LegalScreen({ route }) {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const initialTab = route?.params?.initialTab === 'privacy' ? 'privacy' : 'terms';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const tabs = useMemo(() => ([
    { key: 'terms', label: t('legal_terms_tab') },
    { key: 'privacy', label: t('legal_privacy_tab') },
  ]), [t]);

  function switchTab(key) {
    setLoadError(false);
    setActiveTab(key);
  }

  function retry() {
    setLoadError(false);
    setReloadKey((v) => v + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => switchTab(tab.key)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: active ? C.accent : C.surface2,
                borderWidth: 1,
                borderColor: active ? C.accent : C.border,
              }}
            >
              <Text style={{ color: active ? '#fff' : C.text2, fontWeight: '800', fontSize: 13 }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {loadError ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
              {t('legal_load_error')}
            </Text>
            <Btn title={t('legal_retry')} onPress={retry} />
          </View>
        ) : (
          <WebView
            key={`${activeTab}-${lang}-${reloadKey}`}
            source={{ uri: `${LEGAL_URLS[activeTab]}?lang=${encodeURIComponent(lang)}` }}
            onLoadStart={() => setLoadError(false)}
            onError={() => setLoadError(true)}
            onHttpError={(e) => {
              if (e.nativeEvent.statusCode >= 400) setLoadError(true);
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={{ color: C.text2, marginTop: 12, fontSize: 13 }}>{t('loading')}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
