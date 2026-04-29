// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { CATEGORIES } from '../../utils/categories';
import { Btn, Card } from '../../components/UI';

const TYPES = [
  { key:'user',     emoji:'👤', label:'მომხმარებელი', desc:'ეძებ ხელოსანს' },
  { key:'handyman', emoji:'🔧', label:'ხელოსანი',     desc:'გთავაზობ სერვისს' },
  { key:'company',  emoji:'🏢', label:'კომპანია',     desc:'გუნდი / ბრიგადა' },
];

function Label({ t }) {
  return <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</Text>;
}
function SInput({ value, onChange, placeholder, secure, keyboardType, multiline }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ position:'relative', marginBottom:14 }}>
      <TextInput
        style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, paddingRight: secure ? 48 : 13, color:C.text, fontSize:14, ...(multiline ? { height:80, textAlignVertical:'top' } : {}) }}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={C.text2} secureTextEntry={secure && !show}
        keyboardType={keyboardType} autoCapitalize="none"
      />
      {secure && (
        <TouchableOpacity onPress={() => setShow(!show)} style={{ position:'absolute', right:14, top:14 }}>
          <Ionicons name={show ? 'eye-off-outline':'eye-outline'} size={20} color={C.text2} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const [type,     setType]    = useState('user');
  const [name,     setName]    = useState('');
  const [surname,  setSurname] = useState('');
  const [email,    setEmail]   = useState('');
  const [phone,    setPhone]   = useState('');
  const [password, setPass]    = useState('');
  const [pass2,    setPass2]   = useState('');
  const [spec,     setSpec]    = useState('');
  const [desc,     setDesc]    = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false); // ✅ NEW
  const [loading,  setLoading] = useState(false);
  const isWorker = type === 'handyman' || type === 'company';

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) return Alert.alert('შეცდომა','სახელი, ელ-ფოსტა და პაროლი სავალდებულოა');
    if (password.length < 8) return Alert.alert('შეცდომა','პაროლი მინიმუმ 8 სიმბოლო');
    if (password !== pass2)  return Alert.alert('შეცდომა','პაროლები არ ემთხვევა');
    if (isWorker && !spec)   return Alert.alert('შეცდომა','სპეციალობა სავალდებულოა');
    // ✅ Validation
    if (isWorker && whatsappEnabled && !phone.trim()) {
      return Alert.alert('შეცდომა','WhatsApp-ის ჩასართველად ტელეფონი სავალდებულოა');
    }
    setLoading(true);
    try {
      const data = await api('/auth/register', { method:'POST', body: {
        name:name.trim(), surname:surname.trim(),
        email:email.trim().toLowerCase(), phone:phone.trim(),
        password, type,
        specialty:   isWorker ? spec : undefined,
        specialties: isWorker ? [spec] : undefined,
        desc:        isWorker ? desc  : undefined,
        whatsappEnabled: isWorker ? whatsappEnabled : undefined, // ✅ NEW
      }});
      navigation.navigate('Verify', { email:email.trim().toLowerCase(), devCode:data.devCode });
    } catch (e) { Alert.alert('შეცდომა', e.error||'რეგისტრაცია ვერ მოხდა'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding:20, paddingBottom:40 }}>
        <View style={{ alignItems:'center', marginBottom:28, marginTop:8 }}>
          <Text style={{ fontSize:30, fontWeight:'900', color:C.text }}>
            Fixi<Text style={{ color:C.accent }}>.ge</Text>
          </Text>
          <Text style={{ color:C.text2, fontSize:13, marginTop:6 }}>ახალი ანგარიშის შექმნა</Text>
        </View>

        <Card>
          <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>ანგარიშის ტიპი</Text>
          <View style={{ gap:8 }}>
            {TYPES.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setType(t.key)}
                style={{
                  flexDirection:'row', alignItems:'center', gap:12, padding:13, borderRadius:12,
                  borderWidth:1.5, borderColor:type===t.key ? C.accent : C.border,
                  backgroundColor:type===t.key ? C.accent+'15' : C.surface2,
                }}>
                <View style={{
                  width:20, height:20, borderRadius:10, borderWidth:2,
                  borderColor:type===t.key ? C.accent : C.border,
                  backgroundColor:type===t.key ? C.accent : 'transparent',
                  alignItems:'center', justifyContent:'center',
                }}>
                  {type===t.key && <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#fff' }} />}
                </View>
                <Text style={{ fontSize:18 }}>{t.emoji}</Text>
                <View>
                  <Text style={{ color:type===t.key ? C.accent : C.text, fontWeight:'700', fontSize:14 }}>{t.label}</Text>
                  <Text style={{ color:C.text2, fontSize:12 }}>{t.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <Label t={type==='company' ? 'კომპანიის სახელი *' : 'სახელი *'} />
          <SInput value={name} onChange={setName} placeholder={type==='company' ? 'მაგ: BuildPro საქართველო' : 'სახელი'} />
          {type !== 'company' && (
            <><Label t="გვარი" /><SInput value={surname} onChange={setSurname} placeholder="გვარი" /></>
          )}
          <Label t="ელ-ფოსტა *" /><SInput value={email} onChange={setEmail} placeholder="you@email.com" keyboardType="email-address" />
          <Label t="ტელეფონი"   /><SInput value={phone} onChange={setPhone} placeholder="+995 5XX XXX XXX" keyboardType="phone-pad" />
          <Label t="პაროლი *"   /><SInput value={password} onChange={setPass}  placeholder="მინ. 8 სიმბოლო" secure />
          <Label t="გამეორება *"/><SInput value={pass2}    onChange={setPass2} placeholder="••••••••" secure />

          {/* ✅ NEW: WhatsApp toggle */}
          {isWorker && (
            <View style={{
              flexDirection:'row', alignItems:'center', gap:12,
              padding:13, borderRadius:12,
              backgroundColor: whatsappEnabled ? '#25D36615' : C.surface2,
              borderWidth:1.5, borderColor: whatsappEnabled ? '#25D366' : C.border,
              marginTop:4,
            }}>
              <Switch
                value={whatsappEnabled}
                onValueChange={setWhatsappEnabled}
                trackColor={{ false:C.border, true:'#25D366' }}
                thumbColor={whatsappEnabled ? '#fff' : '#f4f3f4'}
              />
              <View style={{ flex:1 }}>
                <Text style={{ color: whatsappEnabled ? '#25D366' : C.text, fontWeight:'700', fontSize:14 }}>
                  💬 WhatsApp
                </Text>
                <Text style={{ color:C.text2, fontSize:12, marginTop:2 }}>
                  მსურს მიკავშირდნენ WhatsApp-ით
                </Text>
              </View>
            </View>
          )}
        </Card>

        {isWorker && (
          <Card>
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>სპეციალობა *</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:14 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.name} onPress={() => setSpec(c.name)}
                  style={{
                    flexDirection:'row', alignItems:'center', gap:8,
                    paddingHorizontal:14, paddingVertical:11, borderRadius:14,
                    borderWidth:1.5, borderColor:spec===c.name ? C.accent : C.border,
                    backgroundColor:spec===c.name ? C.accent+'18' : C.surface2,
                    minWidth:'45%', flex:1,
                  }}>
                  <Text style={{ fontSize:18 }}>{c.icon}</Text>
                  <Text style={{ color:spec===c.name ? C.accent : C.text, fontWeight:'700', fontSize:13, flex:1 }}>{c.name}</Text>
                  {spec===c.name && <Ionicons name="checkmark-circle" size={16} color={C.accent}/>}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>აღწერა</Text>
            <TextInput
              style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:14, height:80, textAlignVertical:'top' }}
              placeholder="გამოცდილება, სერვისები..." placeholderTextColor={C.text2}
              value={desc} onChangeText={setDesc} multiline
            />
          </Card>
        )}

        {isWorker && (
          <View style={{ backgroundColor:'#10b98115', borderRadius:14, borderWidth:1, borderColor:'#10b98130', padding:14, marginBottom:16 }}>
            <Text style={{ color:'#10b981', fontSize:13, fontWeight:'600', textAlign:'center' }}>
              🎉 პირველი 3 თვე სრულიად უფასო! Start · 5 შეთ./თვე
            </Text>
          </View>
        )}

        <Btn title="✅ რეგისტრაცია" onPress={handleRegister} loading={loading} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems:'center', marginTop:20 }}>
          <Text style={{ color:C.text2, fontSize:14 }}>
            უკვე გაქვს ანგარიში?{' '}
            <Text style={{ color:C.accent, fontWeight:'800' }}>შესვლა</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
