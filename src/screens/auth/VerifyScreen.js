// src/screens/auth/VerifyScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Btn } from '../../components/UI';

export default function VerifyScreen({ route, navigation }) {
  const { email, devCode } = route.params || {};
  const { login } = useAuth();
  const [code,     setCode]     = useState(['','','','','','']);
  const [loading,  setLoading]  = useState(false);
  const [resending,setResending]= useState(false);
  const inputs = useRef([]);

  function handleDigit(val, idx) {
    const digits = val.replace(/\D/g,'').split('').slice(0, 6-idx);
    const next = [...code];
    digits.forEach((d,i) => { next[idx+i] = d; });
    setCode(next);
    const nextIdx = Math.min(idx+digits.length, 5);
    if (digits.length && nextIdx < 6) inputs.current[nextIdx]?.focus();
  }

  function handleBackspace(e, idx) {
    if (e.nativeEvent.key==='Backspace' && !code[idx] && idx > 0) {
      const next = [...code]; next[idx-1]=''; setCode(next);
      inputs.current[idx-1]?.focus();
    }
  }

  async function handleVerify() {
    const full = code.join('');
    if (full.length < 6) return Alert.alert('შეცდომა','შეიყვანე 6-ნიშნა კოდი');
    setLoading(true);
    try {
      const data = await api('/auth/verify', { method:'POST', body:{ email, code:full } });
      await login(data.token, data.user);
    } catch (e) { Alert.alert('შეცდომა', e.error||'კოდი არასწორია'); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    setResending(true);
    try {
      const data = await api('/auth/resend', { method:'POST', body:{ email } });
      Alert.alert('✅','ახალი კოდი გაიგზავნა'+(data.devCode ? ` (dev: ${data.devCode})` : ''));
    } catch (e) { Alert.alert('შეცდომა', e.error||'კოდი ვერ გაიგზავნა'); }
    finally { setResending(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <View style={{ flex:1, justifyContent:'center', padding:24 }}>
        {/* Icon */}
        <View style={{ alignItems:'center', marginBottom:32 }}>
          <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.accent+'20', borderWidth:2, borderColor:C.accent+'40', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
            <Text style={{ fontSize:36 }}>📧</Text>
          </View>
          <Text style={{ color:C.text, fontSize:24, fontWeight:'900', marginBottom:8 }}>ვერიფიკაცია</Text>
          <Text style={{ color:C.text2, fontSize:14, textAlign:'center' }}>6-ნიშნა კოდი გაიგზავნა:</Text>
          <Text style={{ color:C.accent, fontWeight:'800', fontSize:15, marginTop:4 }}>{email}</Text>
        </View>

        {/* Dev code hint */}
        {devCode ? (
          <View style={{ backgroundColor:C.warn+'18', borderRadius:12, borderWidth:1, borderColor:C.warn+'40', padding:12, marginBottom:20 }}>
            <Text style={{ color:C.warn, textAlign:'center', fontSize:13, fontWeight:'700' }}>🛠 DEV კოდი: {devCode}</Text>
          </View>
        ) : null}

        {/* OTP inputs */}
        <View style={{ flexDirection:'row', justifyContent:'center', gap:10, marginBottom:32 }}>
          {code.map((digit, i) => (
            <TextInput key={i}
              ref={el => inputs.current[i] = el}
              style={{
                width:50, height:60, backgroundColor:C.surface,
                borderRadius:14, borderWidth:digit ? 2 : 1,
                borderColor:digit ? C.accent : C.border,
                textAlign:'center', fontSize:24, fontWeight:'900', color:C.text,
              }}
              value={digit}
              onChangeText={v => handleDigit(v,i)}
              onKeyPress={e => handleBackspace(e,i)}
              keyboardType="number-pad" maxLength={6} selectTextOnFocus
            />
          ))}
        </View>

        <Btn title="დადასტურება" onPress={handleVerify} loading={loading} />

        <View style={{ flexDirection:'row', justifyContent:'center', gap:4, marginTop:20 }}>
          <Text style={{ color:C.text2, fontSize:14 }}>კოდი არ მოგივიდა?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={{ color:C.accent, fontWeight:'800', fontSize:14 }}>
              {resending ? 'იგზავნება...' : 'ხელახლა გაგზავნა'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems:'center', marginTop:14 }}>
          <Text style={{ color:C.text2, fontSize:13 }}>← შესვლაზე დაბრუნება</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
