// src/screens/SendOfferScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Btn, Card } from '../components/UI';
import { CATEGORIES } from '../utils/categories';

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
  const [category,   setCategory]   = useState('');
  const [subcat,     setSubcat]     = useState('');
  const [price,      setPrice]      = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [days,       setDays]       = useState('');
  const [hours,      setHours]      = useState('');
  const [comment,    setComment]    = useState('');
  const [loading,    setLoading]    = useState(false);

  const selCat = CATEGORIES.find(c => c.name === category);

  const dMins = (parseInt(days||0)*24*60) + (parseInt(hours||0)*60);
  const dLabel = [parseInt(days||0)>0 ? `${days} დღე` : '', parseInt(hours||0)>0 ? `${hours} საათი` : ''].filter(Boolean).join(' ');

  function applyPreset(p) { setDays(p.d>0?String(p.d):''); setHours(p.h>0?String(p.h):''); }

  async function handleSend() {
    if (!category) return Alert.alert('შეცდომა','კატეგორია სავალდებულოა');
    if (!negotiable && !price) return Alert.alert('შეცდომა','ფასი სავალდებულოა');
    if (dMins <= 0) return Alert.alert('შეცდომა','სამუშაოს ვადა სავალდებულოა');
    setLoading(true);
    try {
      await api('/offers', { method:'POST', body:{
        requestId,
        category,
        subcat,
        price: negotiable ? 0 : parseInt(price),
        durationMinutes: dMins,
        duration: dLabel,
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
          <Label t="კატეგორია *" />
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom: selCat && selCat.subs.length > 0 ? 16 : 0 }}>
            {CATEGORIES.map(c => {
              const act = category === c.name;
              return (
                <TouchableOpacity key={c.name} onPress={() => { setCategory(c.name); setSubcat(''); }}
                  style={{
                    flexDirection:'row', alignItems:'center', gap:8,
                    paddingHorizontal:14, paddingVertical:11, borderRadius:14,
                    borderWidth:1.5, borderColor: act ? C.accent : C.border,
                    backgroundColor: act ? C.accent+'18' : C.surface2,
                    minWidth:'45%', flex:1,
                  }}>
                  <Text style={{ fontSize:18 }}>{c.icon}</Text>
                  <Text style={{ color: act ? C.accent : C.text, fontWeight:'700', fontSize:13, flex:1 }}>{c.name}</Text>
                  {act && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {selCat && selCat.subs.length > 0 && (
            <>
              <Label t="ქვეკატეგორია" />
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {selCat.subs.map(s => (
                  <TouchableOpacity key={s} onPress={() => setSubcat(subcat === s ? '' : s)}
                    style={{ paddingHorizontal:14, paddingVertical:9, borderRadius:20, borderWidth:1.5, borderColor: subcat===s ? C.accent : C.border, backgroundColor: subcat===s ? C.accent+'22' : C.surface2 }}>
                    <Text style={{ color: subcat===s ? C.accent : C.text2, fontWeight:'600', fontSize:13 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </Card>

        <Card>
          <Label t="ფასი (₾) *" />
          <TextInput
            style={{ backgroundColor: negotiable ? C.surface2 + '80' : C.surface2, borderRadius:12, borderWidth:1, borderColor: negotiable ? C.border + '80' : C.border, padding:13, color: negotiable ? C.text2 : C.text, fontSize:22, fontWeight:'900', opacity: negotiable ? 0.4 : 1 }}
            placeholder="0" placeholderTextColor={C.text2}
            value={negotiable ? '' : price}
            onChangeText={setPrice}
            keyboardType="numeric"
            editable={!negotiable}
          />
          <TouchableOpacity
            onPress={() => { setNegotiable(v => !v); if (!negotiable) setPrice(''); }}
            style={{ flexDirection:'row', alignItems:'center', gap:10, marginTop:12, padding:13, borderRadius:12, borderWidth:1.5, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent + '18' : C.surface2 }}
          >
            <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent : 'transparent', alignItems:'center', justifyContent:'center' }}>
              {negotiable && <Text style={{ color:'#fff', fontSize:12, fontWeight:'900' }}>✓</Text>}
            </View>
            <Text style={{ color: negotiable ? C.accent : C.text2, fontWeight:'700', fontSize:14 }}>💬 ფასი შეთანხმებით</Text>
          </TouchableOpacity>
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

        {(negotiable || price) && dMins > 0 && (
          <View style={{ backgroundColor:C.accent+'15', borderRadius:14, borderWidth:1, borderColor:C.accent+'40', padding:16, marginBottom:16 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={{ color:C.text2, fontSize:13 }}>ფასი:</Text>
              {negotiable
                ? <Text style={{ color:C.accent, fontSize:16, fontWeight:'900' }}>💬 შეთანხმებით</Text>
                : <Text style={{ color:C.accent, fontSize:20, fontWeight:'900' }}>₾{price}</Text>
              }
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
