// src/screens/SendOfferScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Btn, Card } from '../components/UI';

function Label({ t }) {
  return <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</Text>;
}

const PRESETS = [
  { label:'1 საათი',  d:0, h:1 },
  { label:'3 საათი',  d:0, h:3 },
  { label:'1 დღე',    d:1, h:0 },
  { label:'2 დღე',    d:2, h:0 },
  { label:'3 დღე',    d:3, h:0 },
  { label:'1 კვირა',  d:7, h:0 },
];

export default function SendOfferScreen({ route, navigation }) {
  const { requestId, requestTitle } = route.params;
  const [price,   setPrice]   = useState('');
  const [days,    setDays]    = useState('');
  const [hours,   setHours]   = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: compute durationMinutes
  const dMins = (parseInt(days||0)*24*60) + (parseInt(hours||0)*60);
  const dLabel = [parseInt(days||0)>0 ? `${days} დღე` : '', parseInt(hours||0)>0 ? `${hours} საათი` : ''].filter(Boolean).join(' ');

  function applyPreset(p) { setDays(p.d>0?String(p.d):''); setHours(p.h>0?String(p.h):''); }

  async function handleSend() {
    if (!price)    return Alert.alert('შეცდომა','ფასი სავალდებულოა');
    if (dMins <= 0) return Alert.alert('შეცდომა','სამუშაოს ვადა სავალდებულოა');
    setLoading(true);
    try {
      await api('/offers', { method:'POST', body:{
        requestId,
        price: parseInt(price),
        durationMinutes: dMins,   // ✅ required by backend
        duration: dLabel,          // human-readable display
        comment,
      }});
      Alert.alert('✅ გაიგზავნა','შეთავაზება წარმატებით გაიგზავნა!',[{ text:'კარგი', onPress:()=>navigation.goBack() }]);
    } catch(e) {
      if (e.upgradeRequired) {
        Alert.alert('⬆️ ტარიფის განახლება', e.error,[
          { text:'გაუქმება', style:'cancel' },
          { text:'ტარიფები', onPress:()=>navigation.navigate('Vip') },
        ]);
      } else { Alert.alert('შეცდომა', e.error||'გაგზავნა ვერ მოხდა'); }
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:30 }}>
        <Text style={{ color:C.text, fontSize:22, fontWeight:'900', marginBottom:6 }}>📤 შეთავაზება</Text>
        <Text style={{ color:C.text2, fontSize:13, marginBottom:20 }} numberOfLines={2}>"{requestTitle}"</Text>

        <Card>
          <Label t="ფასი (₾) *" />
          <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:22, fontWeight:'900' }}
            placeholder="0" placeholderTextColor={C.text2} value={price} onChangeText={setPrice} keyboardType="numeric" />
        </Card>

        <Card>
          <Label t="სამუშაოს ვადა *" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {PRESETS.map(p => {
                const sel = dMins === p.d*24*60+p.h*60;
                return (
                  <TouchableOpacity key={p.label} onPress={()=>applyPreset(p)}
                    style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor:sel?C.accent:C.border, backgroundColor:sel?C.accent+'22':C.surface2 }}>
                    <Text style={{ color:sel?C.accent:C.text2, fontWeight:'600', fontSize:13 }}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <View style={{ flexDirection:'row', gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.text2, fontSize:11, marginBottom:6 }}>დღეები</Text>
              <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, color:C.text, fontSize:16, fontWeight:'700', textAlign:'center' }}
                placeholder="0" placeholderTextColor={C.text2} value={days} onChangeText={setDays} keyboardType="numeric" />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:C.text2, fontSize:11, marginBottom:6 }}>საათები</Text>
              <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, color:C.text, fontSize:16, fontWeight:'700', textAlign:'center' }}
                placeholder="0" placeholderTextColor={C.text2} value={hours} onChangeText={setHours} keyboardType="numeric" />
            </View>
          </View>
          {dLabel ? <Text style={{ color:C.accent, fontSize:13, fontWeight:'700', marginTop:10 }}>⏱ {dLabel}</Text> : null}
        </Card>

        <Card>
          <Label t="კომენტარი" />
          <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:14, height:110, textAlignVertical:'top' }}
            placeholder="გამოცდილება, სპეციფიკა, გარანტია..." placeholderTextColor={C.text2} value={comment} onChangeText={setComment} multiline />
        </Card>

        {price && dMins > 0 && (
          <View style={{ backgroundColor:C.accent+'15', borderRadius:14, borderWidth:1, borderColor:C.accent+'40', padding:16, marginBottom:16 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={{ color:C.text2, fontSize:13 }}>ფასი:</Text>
              <Text style={{ color:C.accent, fontSize:20, fontWeight:'900' }}>₾{price}</Text>
            </View>
            <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={{ color:C.text2, fontSize:13 }}>ვადა:</Text>
              <Text style={{ color:C.text, fontSize:13, fontWeight:'700' }}>⏱ {dLabel}</Text>
            </View>
          </View>
        )}

        <Btn title="📤 გაგზავნა" onPress={handleSend} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
