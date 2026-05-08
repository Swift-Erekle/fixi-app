import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Btn } from '../../components/UI';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert(t('error'), t('login_err_fill'));
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
      await login(data.token, data.user);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (e) {
      if (e.emailNotVerified) {
        navigation.navigate('Verify', { email: e.email || email.trim().toLowerCase(), devCode: e.devCode });
        Alert.alert(t('login_verify_title'), t('login_verify_msg'));
      } else {
        const msg = (typeof e === 'object' && e !== null)
          ? (e.error || e.message || t('login_err_failed'))
          : t('login_err_failed');
        Alert.alert(t('error'), msg);
      }
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 44 }}>
          <Text style={{ fontSize: 40, fontWeight: '900', color: C.text }}>
            MyFix<Text style={{ color: C.accent }}>.ge</Text>
          </Text>
          <Text style={{ color: C.text2, marginTop: 8, fontSize: 14 }}>{t('login_subtitle')}</Text>
        </View>
        <View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('login_email')}</Text>
          <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
            placeholder="you@email.com" placeholderTextColor={C.text2} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('login_password')}</Text>
          <View style={{ position: 'relative', marginBottom: 8 }}>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, paddingRight: 50, color: C.text, fontSize: 15 }}
              placeholder="••••••••" placeholderTextColor={C.text2} value={password} onChangeText={setPassword} secureTextEntry={!showPass} onSubmitEditing={handleLogin} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: 14 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.text2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Forgot')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>{t('login_forgot')}</Text>
          </TouchableOpacity>
          <Btn title={t('login_btn')} onPress={handleLogin} loading={loading} />
        </View>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: C.text2, fontSize: 14 }}>
            {t('login_no_account')}{' '}
            <Text style={{ color: C.accent, fontWeight: '800' }} onPress={() => navigation.navigate('Register')}>{t('login_register')}</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
