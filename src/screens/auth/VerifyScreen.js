import { useLanguage } from "../../context/LanguageContext"; // src/screens/auth/VerifyScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Btn } from '../../components/UI';

export default function VerifyScreen({ route, navigation }) {const { t: tr } = useLanguage();
  const { email, devCode } = route.params || {};
  const { login } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  function handleDigit(val, idx) {
    const digits = val.replace(/\D/g, '').split('').slice(0, 6 - idx);
    const next = [...code];
    digits.forEach((d, i) => {next[idx + i] = d;});
    setCode(next);
    const nextIdx = Math.min(idx + digits.length, 5);
    if (digits.length && nextIdx < 6) inputs.current[nextIdx]?.focus();
  }

  function handleBackspace(e, idx) {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      const next = [...code];next[idx - 1] = '';setCode(next);
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const full = code.join('');
    if (full.length < 6) return Alert.alert(tr("error"), tr("screens_auth_verifyscreen_6_hr7fyz"));
    setLoading(true);
    try {
      const data = await api('/auth/verify', { method: 'POST', body: { email, code: full } });
      if (data.user?.type === 'handyman' || data.user?.type === 'company') {
        await SecureStore.setItemAsync('pendingPlanPicker', 'true').catch(() => {});
      }
      await login(data.token, data.user);
    } catch (e) {Alert.alert(tr("error"), e.error || tr("auth_invalid_code"));} finally
    {setLoading(false);}
  }

  async function handleResend() {
    setResending(true);
    try {
      const data = await api('/auth/resend', { method: 'POST', body: { email } });
      Alert.alert('✅', tr("screens_auth_verifyscreen_text_1b7uf5") + (data.devCode ? ` (dev: ${data.devCode})` : ''));
    } catch (e) {Alert.alert(tr("error"), e.error || tr("verify_err_resend"));} finally
    {setResending(false);}
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        {/* Icon */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent + '20', borderWidth: 2, borderColor: C.accent + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>📧</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>{tr("title_verify")}</Text>
          <Text style={{ color: C.text2, fontSize: 14, textAlign: 'center' }}>{tr("screens_auth_verifyscreen_6_fk1c1y")}</Text>
          <Text style={{ color: C.accent, fontWeight: '800', fontSize: 15, marginTop: 4 }}>{email}</Text>
        </View>

        {/* Dev code hint */}
        {devCode ?
        <View style={{ backgroundColor: C.warn + '18', borderRadius: 12, borderWidth: 1, borderColor: C.warn + '40', padding: 12, marginBottom: 20 }}>
            <Text style={{ color: C.warn, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>{tr("screens_auth_verifyscreen_dev_o7d5p")}{devCode}</Text>
          </View> :
        null}

        {/* OTP inputs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          {code.map((digit, i) =>
          <TextInput key={i}
          ref={(el) => inputs.current[i] = el}
          style={{
            width: 50, height: 60, backgroundColor: C.surface,
            borderRadius: 14, borderWidth: digit ? 2 : 1,
            borderColor: digit ? C.accent : C.border,
            textAlign: 'center', fontSize: 24, fontWeight: '900', color: C.text
          }}
          value={digit}
          onChangeText={(v) => handleDigit(v, i)}
          onKeyPress={(e) => handleBackspace(e, i)}
          keyboardType="number-pad" maxLength={6} selectTextOnFocus />

          )}
        </View>

        <Btn title={tr("verify_btn")} onPress={handleVerify} loading={loading} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 20 }}>
          <Text style={{ color: C.text2, fontSize: 14 }}>{tr("screens_auth_verifyscreen_text_1f6atd")}</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={{ color: C.accent, fontWeight: '800', fontSize: 14 }}>
              {resending ? tr("screens_auth_verifyscreen_text_g7uljd") : tr("verify_resend")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 14 }}>
          <Text style={{ color: C.text2, fontSize: 13 }}>{tr("forgot_back_login")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>);

}
