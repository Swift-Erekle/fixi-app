import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { Btn, Card } from '../../components/UI';
import { useLanguage } from '../../context/LanguageContext';
import { confirmPhoneCode, sendPhoneCode } from '../../utils/firebasePhone';

function Label({ text }) {
  return <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</Text>;
}

export default function ForgotScreen({ navigation }) {
  const { t: tr } = useLanguage();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [resetInfo, setResetInfo] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPas, setShowPas] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!identifier.trim()) return Alert.alert(tr('error'), tr('screens_auth_forgotscreen_text_324g3g'));
    setLoading(true);
    try {
      const data = await api('/auth/forgot', { method: 'POST', body: { identifier: identifier.trim() } });
      if (!data.resetChannel) {
        Alert.alert('OK', tr('auth_code_sent_if_exists'));
        return;
      }
      const info = {
        channel: data.resetChannel,
        email: data.email,
        phone: data.phone,
      };
      if (info.channel === 'phone') {
        const result = await sendPhoneCode(info.phone);
        setConfirmation(result);
      }
      setResetInfo(info);
      setStep(2);
    } catch (e) {
      Alert.alert(tr('error'), e.error || e.message || tr('verify_err_resend'));
    } finally {
      setLoading(false);
    }
  }

  async function resetPass() {
    if (!code || !newPass) return Alert.alert(tr('error'), tr('login_err_fill'));
    if (newPass.length < 8) return Alert.alert(tr('error'), tr('reg_err_short_pass'));
    if (!resetInfo) return Alert.alert(tr('error'), tr('verify_err_resend'));
    setLoading(true);
    try {
      let body;
      if (resetInfo.channel === 'phone') {
        const firebaseIdToken = await confirmPhoneCode(confirmation, code);
        body = { firebaseIdToken, newPassword: newPass };
      } else {
        body = { email: resetInfo.email || identifier.trim().toLowerCase(), code, newPassword: newPass };
      }
      await api('/auth/reset', { method: 'POST', body });
      Alert.alert(tr('screens_auth_forgotscreen_text_rhok5c'), tr('screens_auth_forgotscreen_text_1fnny7'), [{ text: tr('nav_login'), onPress: () => navigation.navigate('Login') }]);
    } catch (e) {
      Alert.alert(tr('error'), e.error || e.message || tr('screens_auth_forgotscreen_text_fway7m'));
    } finally {
      setLoading(false);
    }
  }

  const target = resetInfo?.channel === 'phone' ? resetInfo.phone : resetInfo?.email;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent + '20', borderWidth: 2, borderColor: C.accent + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>🔑</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{tr('title_forgot')}</Text>
          <Text style={{ color: C.text2, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            {step === 1 ? tr('forgot_subtitle') : `${tr('verify_sent_to')} ${target || ''}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2].map((s) => (
            <View key={s} style={{ width: s === step ? 28 : 8, height: 8, borderRadius: 4, backgroundColor: s === step ? C.accent : C.border }} />
          ))}
        </View>

        <Card>
          {step === 1 ? (
            <>
              <Label text={tr('login_identifier')} />
              <TextInput
                style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 15, marginBottom: 16 }}
                placeholder={tr('login_identifier_ph')}
                placeholderTextColor={C.text2}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="default"
                autoCapitalize="none"
              />
              <Btn title={tr('forgot_send_code')} onPress={sendCode} loading={loading} />
            </>
          ) : (
            <>
              <Label text={tr('forgot_code_ph')} />
              <TextInput
                style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 8, textAlign: 'center', marginBottom: 16 }}
                placeholder="------"
                placeholderTextColor={C.text2}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />

              <Label text={tr('forgot_new_pass')} />
              <View style={{ position: 'relative', marginBottom: 16 }}>
                <TextInput
                  style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, paddingRight: 48, color: C.text, fontSize: 15 }}
                  placeholder={tr('reg_pass_ph')}
                  placeholderTextColor={C.text2}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry={!showPas}
                />
                <TouchableOpacity onPress={() => setShowPas(!showPas)} style={{ position: 'absolute', right: 14, top: 14 }}>
                  <Ionicons name={showPas ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.text2} />
                </TouchableOpacity>
              </View>
              <Btn title={tr('forgot_change_btn')} onPress={resetPass} loading={loading} />
            </>
          )}
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: C.text2, fontSize: 13 }}>{tr('forgot_back_login')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
