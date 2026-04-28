// src/screens/ChangePasswordScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Btn, Card } from '../components/UI';

function Label({ t }) {
  return <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</Text>;
}

function PassInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ position:'relative', marginBottom:16 }}>
      <TextInput
        style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, paddingRight:48, color:C.text, fontSize:15 }}
        placeholder={placeholder} placeholderTextColor={C.text2}
        value={value} onChangeText={onChange} secureTextEntry={!show}
      />
      <TouchableOpacity onPress={()=>setShow(!show)} style={{ position:'absolute', right:14, top:14 }}>
        <Ionicons name={show?'eye-off-outline':'eye-outline'} size={20} color={C.text2} />
      </TouchableOpacity>
    </View>
  );
}

export function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (!current||!newPass) return Alert.alert('შეცდომა','შეავსე ყველა ველი');
    if (newPass.length < 8)  return Alert.alert('შეცდომა','პაროლი მინიმუმ 8 სიმბოლო');
    if (newPass !== confirm)  return Alert.alert('შეცდომა','პაროლები არ ემთხვევა');
    setLoading(true);
    try {
      await api('/auth/change-password',{ method:'POST', body:{ currentPassword:current, newPassword:newPass } });
      Alert.alert('✅','პაროლი შეიცვალა!',[{ text:'კარგი', onPress:()=>navigation.goBack() }]);
    } catch(e) { Alert.alert('შეცდომა',e.error||'შეცდომა'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:30 }}>
        {/* Icon */}
        <View style={{ alignItems:'center', marginBottom:28, marginTop:8 }}>
          <View style={{ width:72,height:72,borderRadius:36,backgroundColor:C.accent+'20',borderWidth:2,borderColor:C.accent+'40',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
            <Text style={{ fontSize:32 }}>🔑</Text>
          </View>
          <Text style={{ color:C.text, fontSize:20, fontWeight:'900' }}>პაროლის შეცვლა</Text>
          <Text style={{ color:C.text2, fontSize:13, marginTop:4 }}>უსაფრთხოებისთვის შეცვალე რეგულარულად</Text>
        </View>

        <Card>
          <Label t="მიმდინარე პაროლი" />
          <PassInput value={current} onChange={setCurrent} placeholder="შეიყვანე მიმდინარე პაროლი" />
          <Label t="ახალი პაროლი" />
          <PassInput value={newPass}  onChange={setNewPass}  placeholder="მინ. 8 სიმბოლო" />
          <Label t="გამეორება" />
          <PassInput value={confirm}  onChange={setConfirm}  placeholder="ახალი პაროლი კიდევ ერთხელ" />

          {/* Strength indicator */}
          {newPass.length > 0 && (
            <View style={{ marginBottom:4 }}>
              <View style={{ flexDirection:'row', gap:4, marginBottom:4 }}>
                {[1,2,3,4].map(i => (
                  <View key={i} style={{ flex:1, height:4, borderRadius:2, backgroundColor: newPass.length>=i*2 ? (newPass.length>=8?C.ok:C.warn) : C.border }} />
                ))}
              </View>
              <Text style={{ color:newPass.length>=8?C.ok:C.warn, fontSize:12 }}>
                {newPass.length<6?'სუსტი':newPass.length<8?'საშუალო':'ძლიერი'}
              </Text>
            </View>
          )}
        </Card>

        <Btn title="შენახვა" onPress={handleChange} loading={loading} style={{ marginTop:8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
