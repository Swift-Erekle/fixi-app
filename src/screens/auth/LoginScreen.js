// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Btn } from '../../components/UI';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert('შეცდომა', 'შეავსე ყველა ველი');
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
      await login(data.token, data.user);
    } catch (e) {
      console.error('LOGIN ERROR', JSON.stringify(e, null, 2));  // ← Metro-ს კონსოლში ნახავ
      if (e.emailNotVerified) {
        navigation.navigate('Verify', { email: e.email || email.trim().toLowerCase(), devCode: e.devCode });
        Alert.alert('📧 ვერიფიკაცია', 'კოდი გაიგზავნა ელ-ფოსტაზე');
      } else {
        // ყველა შესაძლო error-ის გადმოცემა
        const msg = (typeof e === 'object' && e !== null)
          ? (e.error || e.message || 'შესვლა ვერ მოხდა')
          : 'შესვლა ვერ მოხდა';
        Alert.alert('შეცდომა', msg);
      }
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 44 }}>
          <Text style={{ fontSize: 40, fontWeight: '900', color: C.text }}>
            Fixi<Text style={{ color: C.accent }}>.ge</Text>
          </Text>
          <Text style={{ color: C.text2, marginTop: 8, fontSize: 14 }}>შედი შენს ანგარიშზე</Text>
        </View>
        <View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>ელ-ფოსტა</Text>
          <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
            placeholder="you@email.com" placeholderTextColor={C.text2} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>პაროლი</Text>
          <View style={{ position: 'relative', marginBottom: 8 }}>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, paddingRight: 50, color: C.text, fontSize: 15 }}
              placeholder="••••••••" placeholderTextColor={C.text2} value={password} onChangeText={setPassword} secureTextEntry={!showPass} onSubmitEditing={handleLogin} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: 14 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.text2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Forgot')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>პაროლი დამავიწყდა</Text>
          </TouchableOpacity>
          <Btn title="შესვლა" onPress={handleLogin} loading={loading} />
        </View>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: C.text2, fontSize: 14 }}>
            ანგარიში არ გაქვს?{' '}
            <Text style={{ color: C.accent, fontWeight: '800' }} onPress={() => navigation.navigate('Register')}>რეგისტრაცია</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
