import { useLanguage } from "../context/LanguageContext"; // src/screens/EditProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Switch, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
      placeholderTextColor={C.text2} multiline={multiline} keyboardType={keyboardType} />);


}

export default function EditProfileScreen({ navigation }) {const { t: tr, tCat } = useLanguage();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [desc, setDesc] = useState(user?.desc || '');
  const [specs, setSpecs] = useState(
    Array.isArray(user?.specialties) && user.specialties.length > 0 ?
    user.specialties :
    user?.specialty ? [user.specialty] : []
  );
  const [services, setServices] = useState(Array.isArray(user?.services) ? user.services : []);
  const [whatsappEnabled, setWhatsappEnabled] = useState(!!user?.whatsappEnabled);
  const [loading, setLoading] = useState(false);

  const isWorker = user?.type === 'handyman' || user?.type === 'company';
  const selectedServiceCategories = CATEGORIES.filter((c) => specs.includes(c.name));

  function toggleSpec(category) {
    const selected = specs.includes(category.name);
    if (selected) {
      const subSet = new Set(category.subs || []);
      setSpecs((prev) => prev.filter((s) => s !== category.name));
      setServices((prev) => prev.filter((s) => !subSet.has(s)));
      return;
    }
    setSpecs((prev) => [...prev, category.name]);
  }

  function toggleService(service) {
    setServices((prev) => prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]);
  }

  async function handleSave() {
    if (!name.trim()) return Alert.alert(tr("error"), tr("screens_adminscreen_text_vlrihw"));
    if (isWorker && whatsappEnabled && !phone.trim()) {
      return Alert.alert(tr("error"), tr("reg_err_whatsapp"));
    }
    setLoading(true);
    try {
      const data = await api('/users/me', { method: 'PATCH', body: {
          name: name.trim(), surname: surname.trim(),
          phone: phone.trim() || null, city: city || null,
          desc: desc.trim() || null,
          specialty: specs[0] || null,
          specialties: specs,
          services,
          ...(isWorker ? { whatsappEnabled } : {})
        } });
      updateUser(data);
      Alert.alert('✅', tr("screens_editprofilescreen_text_1n9hh5"), [{ text: tr("screens_changepasswordscreen_text_i1qxce"), onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert(tr("error"), e.error || tr("screens_editprofilescreen_text_62570a"));
    } finally {setLoading(false);}
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 20 }}>{tr("screens_editprofilescreen_text_1ede08")}</Text>

        <Card>
          <Label>{tr("reg_name")}</Label>
          <StyledInput value={name} onChangeText={setName} placeholder={tr("reg_name_ph")} />
          <Label>{tr("reg_surname")}</Label>
          <StyledInput value={surname} onChangeText={setSurname} placeholder={tr("reg_surname")} />
          <Label>{tr("reg_phone")}</Label>
          <StyledInput value={phone} onChangeText={setPhone} placeholder="+995 5XX XXX XXX" keyboardType="phone-pad" />

          {isWorker &&
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            padding: 13, borderRadius: 12,
            backgroundColor: whatsappEnabled ? '#25D36615' : C.surface2,
            borderWidth: 1.5, borderColor: whatsappEnabled ? '#25D366' : C.border
          }}>
              <Switch
              value={whatsappEnabled}
              onValueChange={setWhatsappEnabled}
              trackColor={{ false: C.border, true: '#25D366' }}
              thumbColor={whatsappEnabled ? '#fff' : '#f4f3f4'} />
            
              <View style={{ flex: 1 }}>
                <Text style={{ color: whatsappEnabled ? '#25D366' : C.text, fontWeight: '700', fontSize: 14 }}>
                  💬 WhatsApp
                </Text>
                <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>{tr("reg_whatsapp_desc")}

              </Text>
              </View>
            </View>
          }
        </Card>

        {isWorker &&
        <>
            <Card>
              <Label>{tr("screens_editprofilescreen_text_gaspxd")}</Label>
              {specs.length > 0 &&
            <Text style={{ color: C.accent, fontSize: 12, marginBottom: 10 }}>{tr("reg_selected")}{specs.map(tCat).join(', ')}</Text>
            }
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {CATEGORIES.map((c) => {
                const sel = specs.includes(c.name);
                return (
                  <TouchableOpacity key={c.name}
                  onPress={() => toggleSpec(c)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14,
                    borderWidth: 1.5, borderColor: sel ? C.accent : C.border,
                    backgroundColor: sel ? C.accent + '18' : C.surface2,
                    minWidth: '45%', flex: 1
                  }}>
                      <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                      <Text style={{ color: sel ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{tCat(c.name)}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                    </TouchableOpacity>);

              })}
              </View>
              {selectedServiceCategories.length > 0 &&
              <View style={{ marginTop: 14 }}>
                  <Label>{tr("filter_subcategory")}</Label>
                  {services.length > 0 &&
                <Text style={{ color: C.accent, fontSize: 12, marginBottom: 10 }}>{tr("reg_selected")}{services.map(tCat).join(', ')}</Text>
                }
                  {selectedServiceCategories.map((category) =>
                <View key={category.name} style={{ marginBottom: 12 }}>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 8 }}>{category.icon} {tCat(category.name)}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {category.subs.map((service) => {
                      const selected = services.includes(service);
                      return (
                        <TouchableOpacity key={service} onPress={() => toggleService(service)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18,
                          borderWidth: 1.5, borderColor: selected ? C.accent : C.border,
                          backgroundColor: selected ? C.accent + '18' : C.surface2
                        }}>
                            <Text style={{ color: selected ? C.accent : C.text2, fontWeight: '700', fontSize: 12, maxWidth: 210 }}>{tCat(service)}</Text>
                            {selected && <Ionicons name="checkmark-circle" size={14} color={C.accent} />}
                          </TouchableOpacity>);

                    })}
                      </View>
                    </View>
                )}
                </View>
              }
            </Card>

            <Card>
              <Label>{tr("filter_city")}</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CITIES.map((c) =>
                <TouchableOpacity key={c} onPress={() => setCity(c)}
                style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: city === c ? '#3b82f6' : C.border, backgroundColor: city === c ? '#3b82f622' : C.surface2 }}>
                      <Text style={{ color: city === c ? '#3b82f6' : C.text2, fontSize: 12, fontWeight: '600' }}>📍 {c}</Text>
                    </TouchableOpacity>
                )}
                </View>
              </ScrollView>
              <Label>{tr("edit_desc_label")}</Label>
              <StyledInput value={desc} onChangeText={setDesc} placeholder={tr("send_offer_comment_ph")} multiline />
            </Card>

            <PortfolioCard />
          </>
        }

        <Btn title={tr("save")} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>);

}

// ────────── Portfolio sub-component ──────────
function PortfolioCard() {const { t: tr } = useLanguage();
  const { user, updateUser } = useAuth();
  const [items, setItems] = useState(Array.isArray(user?.portfolio) ? user.portfolio : []);
  const [uploading, setUploading] = useState(false);

  async function pickAndUpload() {
    if (items.length >= 20) return Alert.alert('', tr("screens_editprofilescreen_20_pzk22y"));
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85
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
      const data = await api('/users/portfolio', { method: 'POST', body: form });
      setItems(data.portfolio || []);
      updateUser({ portfolio: data.portfolio || [] });
    } catch (e) {Alert.alert(tr("error"), e.error || tr("prof_upload_err"));} finally
    {setUploading(false);}
  }

  async function removeAt(idx) {
    Alert.alert(tr("screens_adminscreen_text_oijfz6"), tr("screens_editprofilescreen_text_mtx4ix"), [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("rd_delete_btn"), style: 'destructive', onPress: async () => {
        try {
          const data = await api(`/users/portfolio/${idx}`, { method: 'DELETE' });
          setItems(data.portfolio || []);
          updateUser({ portfolio: data.portfolio || [] });
        } catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_166fhi"));}
      } }]
    );
  }

  return (
    <Card>
      <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("screens_editprofilescreen_text_3q1frx")}{items.length}/20)</Text>
      {items.length > 0 &&
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {items.map((p, i) => {
            const isVideo = p.type === 'video' || p.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i);
            return (
              <View key={i} style={{ position: 'relative' }}>
                  <Image
                  source={{ uri: isVideo ? p.thumbnail || p.url : p.url }}
                  style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: C.surface2 }}
                  resizeMode="cover" />
                
                  {isVideo &&
                <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
                      <Text style={{ fontSize: 28 }}>▶️</Text>
                    </View>
                }
                  <TouchableOpacity onPress={() => removeAt(i)}
                style={{ position: 'absolute', top: -6, right: -6, backgroundColor: C.err, borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>);

          })}
          </View>
        </ScrollView>
      }
      <TouchableOpacity onPress={pickAndUpload} disabled={uploading || items.length >= 20}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.surface2, opacity: items.length >= 20 ? 0.5 : 1 }}>
        {uploading ?
        <ActivityIndicator color={C.accent} /> :
        <>
              <Text style={{ fontSize: 18 }}>📷</Text>
              <Text style={{ color: C.text2, fontWeight: '600' }}>{tr("screens_editprofilescreen_text_hp2xmy")}</Text>
            </>
        }
      </TouchableOpacity>
    </Card>);

}
