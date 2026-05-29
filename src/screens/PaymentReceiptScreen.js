import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

const SITE_ROOT = 'https://www.myfix.ge';

function buildReceiptUrl(rawUrl, lang) {
  const raw = String(rawUrl || '').trim();
  let value = raw || '/payment-success.html';
  if (value.startsWith('?')) value = `/payment-success.html${value}`;
  if (!/^https?:\/\//i.test(value)) {
    value = value.startsWith('/') ? `${SITE_ROOT}${value}` : `${SITE_ROOT}/payment-success.html?${value}`;
  }

  const [withoutHash, hash = ''] = value.split('#');
  let [path, query = ''] = withoutHash.split('?');
  if (!/payment-success(?:\.html)?/i.test(path)) path = `${SITE_ROOT}/payment-success.html`;

  const params = new URLSearchParams(query);
  params.set('lang', lang || 'ka');
  return `${path}?${params.toString()}${hash ? `#${hash}` : ''}`;
}

export default function PaymentReceiptScreen({ route }) {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const url = useMemo(
    () => buildReceiptUrl(route?.params?.url, lang),
    [route?.params?.url, lang]
  );

  function retry() {
    setLoadError(false);
    setReloadKey((v) => v + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom }}>
      {loadError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
            {t('payment_receipt_load_error')}
          </Text>
          <TouchableOpacity
            onPress={retry}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              paddingHorizontal: 22,
              paddingVertical: 13,
              borderRadius: 12,
              backgroundColor: C.accent,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>{t('legal_retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          key={`${url}-${reloadKey}`}
          source={{ uri: url }}
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
  );
}
