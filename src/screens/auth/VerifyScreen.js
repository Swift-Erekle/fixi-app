import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Btn } from '../../components/UI';
import { useLanguage } from '../../context/LanguageContext';
import { confirmPhoneCode, sendPhoneCode } from '../../utils/firebasePhone';

export default function VerifyScreen({ route, navigation }) {
  const { t: tr } = useLanguage();
  const { login } = useAuth();
  const {
    userId,
    email,
    phone,
    verificationChannel = phone ? 'phone' : 'email',
    mode = 'register',
  } = route.params || {};

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const inputs = useRef([]);
  const channel = verificationChannel === 'email' ? 'email' : 'phone';

  async function startPhoneSms() {
    if (!phone) throw new Error('Phone number is missing');
    const result = await sendPhoneCode(phone);
    setConfirmation(result);
  }

  useEffect(() => {
    if (channel !== 'phone') return;
    startPhoneSms().catch((e) => Alert.alert(tr('error'), e.message || tr('verify_err_resend')));
  }, [channel, phone]);

  function handleDigit(val, idx) {
    const digits = val.replace(/\D/g, '').split('').slice(0, 6 - idx);
    const next = [...code];
    digits.forEach((d, i) => { next[idx + i] = d; });
    setCode(next);
    const nextIdx = Math.min(idx + digits.length, 5);
    if (digits.length && nextIdx < 6) inputs.current[nextIdx]?.focus();
  }

  function handleBackspace(e, idx) {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      const next = [...code];
      next[idx - 1] = '';
      setCode(next);
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (loading) return;
    const full = code.join('');
    if (full.length < 6) return Alert.alert(tr('error'), tr('screens_auth_verifyscreen_6_hr7fyz'));
    setLoading(true);
    try {
      let body;
      if (channel === 'phone') {
        const firebaseIdToken = await confirmPhoneCode(confirmation, full);
        body = { userId, channel: 'phone', firebaseIdToken };
      } else {
        body = { userId, email, channel: 'email', code: full };
      }
      const data = await api('/auth/verify', { method: 'POST', body });
      if (mode === 'register' && (data.user?.type === 'handyman' || data.user?.type === 'company')) {
        await SecureStore.setItemAsync('pendingPlanPicker', 'true').catch(() => {});
      }
      await login(data.token, data.user);
    } catch (e) {
      Alert.alert(tr('error'), e.error || e.message || tr('auth_invalid_code'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      setCode(['', '', '', '', '', '']);
      if (channel === 'phone') {
        await startPhoneSms();
      } else {
        await api('/auth/resend', { method: 'POST', body: { userId, email, channel: 'email' } });
      }
      Alert.alert('OK', tr('screens_auth_verifyscreen_text_1b7uf5'));
    } catch (e) {
      Alert.alert(tr('error'), e.error || e.message || tr('verify_err_resend'));
    } finally {
      setResending(false);
    }
  }

  const target = channel === 'phone' ? phone : email;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent + '20', borderWidth: 2, borderColor: C.accent + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>{channel === 'phone' ? '📱' : '📧'}</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>
            {channel === 'phone' ? tr('verify_phone_title') : tr('title_verify')}
          </Text>
          <Text style={{ color: C.text2, fontSize: 14, textAlign: 'center' }}>
            {channel === 'phone' ? tr('verify_phone_subtitle') : tr('screens_auth_verifyscreen_6_fk1c1y')}
          </Text>
          <Text style={{ color: C.accent, fontWeight: '800', fontSize: 15, marginTop: 4 }}>{target}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => inputs.current[i] = el}
              style={{
                width: 50, height: 60, backgroundColor: C.surface,
                borderRadius: 14, borderWidth: digit ? 2 : 1,
                borderColor: digit ? C.accent : C.border,
                textAlign: 'center', fontSize: 24, fontWeight: '900', color: C.text,
              }}
              value={digit}
              onChangeText={(v) => handleDigit(v, i)}
              onKeyPress={(e) => handleBackspace(e, i)}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading && !resending}
              selectTextOnFocus
            />
          ))}
        </View>

        {loading ? (
          <Text style={{ color: C.accent, textAlign: 'center', fontWeight: '800', marginBottom: 12 }}>{tr('verify_checking')}</Text>
        ) : null}

        <Btn title={tr('verify_btn')} onPress={handleVerify} loading={loading} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 20 }}>
          <Text style={{ color: C.text2, fontSize: 14 }}>{tr('screens_auth_verifyscreen_text_1f6atd')}</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={{ color: C.accent, fontWeight: '800', fontSize: 14 }}>
              {resending ? tr('screens_auth_verifyscreen_text_g7uljd') : tr('verify_resend')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 14 }}>
          <Text style={{ color: C.text2, fontSize: 13 }}>{tr('forgot_back_login')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
