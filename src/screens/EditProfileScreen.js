// src/screens/EditProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Switch, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, GEORGIA_CITIES } from '../utils/categories';
import { Btn, Card } from '../components/UI';

const CITIES = GEORGIA_CITIES;

function Label({ children }) {
  return <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</Text>;
}

function StyledInput({ value, onChangeText, placeholder, multiline, style, keyboardType }) {
  return (
    <TextInput
      style={[{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14, marginBottom: 14, ...(multiline ? { height: 90, textAlignVertical: 'top' } : {}) }, style]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={C.text2} multiline={multiline} keyboardType={keyboardType}
    />
  );
}

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [name,     setName]     = useState(user?.name || '');
  const [surname,  setSurname]  = useState(user?.surname || '');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [city,     setCity]     = useState(user?.city || '');
  const [desc,     setDesc]     = useState(user?.desc || '');
  const [specs,    setSpecs]    = useState(
    Array.isArray(user?.specialties) && user.specialties.length > 0
      ? user.specialties
      : user?.specialty ? [user.specialty] : []
  );
  const [services, setServices] = useState(user?.services?.join(', ') || '');
  const [whatsappEnabled, setWhatsappEnabled] = useState(!!user?.whatsappEnabled); // ✅ NEW
  const [loading,  setLoading]  = useState(false);

  const isWorker = user?.type === 'handyman' || user?.type === 'company';

  async function handleSave() {
    if (!name.trim()) return Alert.alert('შეცდომა', 'სახელი სავალდებულოა');
    if (isWorker && whatsappEnabled && !phone.trim()) {
      return Alert.alert('შეცდომა', 'WhatsApp-ის ჩასართველად ტელეფონი სავალდებულოა');
    }
    setLoading(true);
    try {
      const data = await api('/users/me', { method: 'PATCH', body: {
        name: name.trim(), surname: surname.trim(),
        phone: phone.trim() || null, city: city || null,
        desc: desc.trim() || null,
        specialty: specs[0] || null,
        specialties: specs,
        services: services ? services.split(',').map(s => s.trim()).filter(Boolean) : [],
        ...(isWorker ? { whatsappEnabled } : {}),
      }});
      updateUser(data);
      Alert.alert('✅', 'პროფილი განახლდა!', [{ text: 'კარგი', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('შეცდომა', e.error || 'შენახვა ვერ მოხდა');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 20 }}>✏️ პროფილის რედ.</Text>

        <Card>
          <Label>სახელი *</Label>
          <StyledInput value={name} onChangeText={setName} placeholder="სახელი" />
          <Label>გვარი</Label>
          <StyledInput value={surname} onChangeText={setSurname} placeholder="გვარი" />
          <Label>ტელეფონი</Label>
          <StyledInput value={phone} onChangeText={setPhone} placeholder="+995 5XX XXX XXX" keyboardType="phone-pad" />

          {/* ✅ NEW: WhatsApp toggle */}
          {isWorker && (
            <View style={{
              flexDirection:'row', alignItems:'center', gap:12,
              padding:13, borderRadius:12,
              backgroundColor: whatsappEnabled ? '#25D36615' : C.surface2,
              borderWidth:1.5, borderColor: whatsappEnabled ? '#25D366' : C.border,
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
          <>
            <Card>
              <Label>სპეციალობა (შეგიძლია რამდენიმე)</Label>
              {specs.length > 0 && (
                <Text style={{ color: C.accent, fontSize: 12, marginBottom: 10 }}>✓ არჩეული: {specs.join(', ')}</Text>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CATEGORIES.map(c => {
                  const sel = specs.includes(c.name);
                  return (
                    <TouchableOpacity key={c.name}
                      onPress={() => setSpecs(prev => sel ? prev.filter(s => s !== c.name) : [...prev, c.name])}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                        paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14,
                        borderWidth: 1.5, borderColor: sel ? C.accent : C.border,
                        backgroundColor: sel ? C.accent + '18' : C.surface2,
                        minWidth: '45%', flex: 1,
                      }}>
                      <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                      <Text style={{ color: sel ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{c.name}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            <Card>
              <Label>ქალაქი</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CITIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => setCity(c)}
                      style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: city === c ? '#3b82f6' : C.border, backgroundColor: city === c ? '#3b82f622' : C.surface2 }}>
                      <Text style={{ color: city === c ? '#3b82f6' : C.text2, fontSize: 12, fontWeight: '600' }}>📍 {c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Label>სერვისები (მძიმით)</Label>
              <StyledInput value={services} onChangeText={setServices} placeholder="გაყვანილობა, განათება..." />
              <Label>აღწერა</Label>
              <StyledInput value={desc} onChangeText={setDesc} placeholder="გამოცდილება, გარანტია..." multiline />
            </Card>

            {/* Portfolio */}
            <PortfolioCard />
          </>
        )}

        <Btn title="შენახვა" onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ────────── Portfolio sub-component ──────────
function PortfolioCard() {
  const { user, updateUser } = useAuth();
  const [items, setItems] = useState(Array.isArray(user?.portfolio) ? user.portfolio : []);
  const [uploading, setUploading] = useState(false);

  async function pickAndUpload() {
    if (items.length >= 20) return Alert.alert('', 'მაქს. 20 ფაილი');
    const ImagePicker = require('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const form = new FormData();
      const slots = Math.min(result.assets.length, 20 - items.length);
      for (let i = 0; i < slots; i++) {
        const a = result.assets[i];
        const isVideo = a.type === 'video' || a.uri?.match(/\.(mp4|mov|avi|mkv)$/i);
        form.append('files', { uri: a.uri, name: `port_${Date.now()}_${i}.${isVideo ? 'mp4' : 'jpg'}`, type: isVideo ? 'video/mp4' : 'image/jpeg' });
      }
      const data = await api('/users/portfolio', { method:'POST', body:form });
      setItems(data.portfolio || []);
      updateUser({ portfolio: data.portfolio || [] });
    } catch (e) { Alert.alert('შეცდომა', e.error || 'ატვირთვა ვერ მოხდა'); }
    finally { setUploading(false); }
  }

  async function removeAt(idx) {
    Alert.alert('წაშლა?', 'ნამდვილად გინდა?', [
      { text:'გაუქმება', style:'cancel' },
      { text:'წაშლა', style:'destructive', onPress: async () => {
        try {
          const data = await api(`/users/portfolio/${idx}`, { method:'DELETE' });
          setItems(data.portfolio || []);
          updateUser({ portfolio: data.portfolio || [] });
        } catch (e) { Alert.alert('შეცდომა', e.error || 'ვერ წაიშალა'); }
      }},
    ]);
  }

  return (
    <Card>
      <Label>🖼️ პორტფოლიო ({items.length}/20)</Label>
      {items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
          <View style={{ flexDirection:'row', gap:8 }}>
            {items.map((p, i) => {
              const isVideo = p.type === 'video' || p.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i);
              return (
                <View key={i} style={{ position:'relative' }}>
                  <Image
                    source={{ uri: isVideo ? (p.thumbnail || p.url) : p.url }}
                    style={{ width:100, height:100, borderRadius:12, backgroundColor:C.surface2 }}
                    resizeMode="cover"
                  />
                  {isVideo && (
                    <View style={{ position:'absolute', inset:0, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.3)', borderRadius:12 }}>
                      <Text style={{ fontSize:28 }}>▶️</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => removeAt(i)}
                    style={{ position:'absolute', top:-6, right:-6, backgroundColor:C.err, borderRadius:12, width:22, height:22, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:C.bg }}>
                    <Text style={{ color:'#fff', fontSize:11, fontWeight:'800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
      <TouchableOpacity onPress={pickAndUpload} disabled={uploading || items.length >= 20}
        style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:13, borderRadius:12, borderWidth:1.5, borderStyle:'dashed', borderColor:C.border, backgroundColor:C.surface2, opacity: items.length >= 20 ? 0.5 : 1 }}>
        {uploading
          ? <ActivityIndicator color={C.accent}/>
          : <>
              <Text style={{ fontSize:18 }}>📷</Text>
              <Text style={{ color:C.text2, fontWeight:'600' }}>ფოტო / ვიდეო დამატება</Text>
            </>
        }
      </TouchableOpacity>
    </Card>
  );
}
