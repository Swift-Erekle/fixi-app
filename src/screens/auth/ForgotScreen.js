// src/screens/auth/ForgotScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { Btn, Card } from '../../components/UI';

function Label({ t }) {
  return <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</Text>;
}

export default function ForgotScreen({ navigation }) {
  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState('');
  const [code,    setCode]    = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPas, setShowPas] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!email.trim()) return Alert.alert('შეცდომა','შეიყვანე ელ-ფოსტა');
    setLoading(true);
    try {
      await api('/auth/forgot', { method:'POST', body:{ email:email.trim().toLowerCase() } });
      setStep(2);
    } catch (e) { Alert.alert('შეცდომა', e.error||'კოდი ვერ გაიგზავნა'); }
    finally { setLoading(false); }
  }

  async function resetPass() {
    if (!code || !newPass) return Alert.alert('შეცდომა','შეავსე ყველა ველი');
    if (newPass.length < 8) return Alert.alert('შეცდომა','პაროლი მინიმუმ 8 სიმბოლო');
    setLoading(true);
    try {
      await api('/auth/reset', { method:'POST', body:{ email:email.trim().toLowerCase(), code, newPassword:newPass } });
      Alert.alert('✅ წარმატება','პაროლი შეიცვალა!',[{ text:'შესვლა', onPress:()=>navigation.navigate('Login') }]);
    } catch (e) { Alert.alert('შეცდომა', e.error||'პაროლი ვერ შეიცვალა'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <View style={{ flex:1, justifyContent:'center', padding:24 }}>
        {/* Icon */}
        <View style={{ alignItems:'center', marginBottom:36 }}>
          <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.accent+'20', borderWidth:2, borderColor:C.accent+'40', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
            <Text style={{ fontSize:36 }}>🔑</Text>
          </View>
          <Text style={{ color:C.text, fontSize:22, fontWeight:'900' }}>პაროლის აღდგენა</Text>
          <Text style={{ color:C.text2, fontSize:13, marginTop:6, textAlign:'center' }}>
            {step===1 ? 'შეიყვანე ელ-ფოსტა — გამოგიგზავნით კოდს' : `კოდი გაიგზავნა ${email}-ზე`}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection:'row', justifyContent:'center', gap:8, marginBottom:28 }}>
          {[1,2].map(s => (
            <View key={s} style={{ width:s===step ? 28:8, height:8, borderRadius:4, backgroundColor:s===step ? C.accent : C.border, transition:'width 0.3s' }} />
          ))}
        </View>

        <Card>
          {step===1 ? (
            <>
              <Label t="ელ-ფოსტა" />
              <TextInput
                style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:15, marginBottom:16 }}
                placeholder="you@email.com" placeholderTextColor={C.text2}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
              />
              <Btn title="კოდის გაგზავნა" onPress={sendCode} loading={loading} />
            </>
          ) : (
            <>
              <Label t="6-ნიშნა კოდი" />
              <TextInput
                style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:22, fontWeight:'800', letterSpacing:8, textAlign:'center', marginBottom:16 }}
                placeholder="——————" placeholderTextColor={C.text2}
                value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6}
              />
              <Label t="ახალი პაროლი" />
              <View style={{ position:'relative', marginBottom:16 }}>
                <TextInput
                  style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, paddingRight:48, color:C.text, fontSize:15 }}
                  placeholder="მინ. 8 სიმბოლო" placeholderTextColor={C.text2}
                  value={newPass} onChangeText={setNewPass} secureTextEntry={!showPas}
                />
                <TouchableOpacity onPress={() => setShowPas(!showPas)} style={{ position:'absolute', right:14, top:14 }}>
                  <Ionicons name={showPas ? 'eye-off-outline':'eye-outline'} size={20} color={C.text2} />
                </TouchableOpacity>
              </View>
              <Btn title="პაროლის შეცვლა" onPress={resetPass} loading={loading} />
            </>
          )}
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems:'center', marginTop:20 }}>
          <Text style={{ color:C.text2, fontSize:13 }}>← შესვლაზე დაბრუნება</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
