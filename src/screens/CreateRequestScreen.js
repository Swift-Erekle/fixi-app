import { useLanguage } from "../context/LanguageContext"; // src/screens/CreateRequestScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Btn, Card } from '../components/UI';
import { getCategoryTheme } from '../utils/categoryTheme';

import { CATEGORIES, GEORGIA_CITIES, filterCategoriesBySearch, filterSubcategoriesBySearch } from '../utils/categories';
const CITIES = GEORGIA_CITIES;
function Label({ t }) {return <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</Text>;}

export default function CreateRequestScreen({ navigation }) {const { t: tr, tCat, tCity } = useLanguage();
  const [title, setTitle] = useState('');const [category, setCategory] = useState('');
  const [subcat, setSubcat] = useState('');
  const [desc, setDesc] = useState('');const [city, setCity] = useState('თბილისი');
  const [budget, setBudget] = useState('');const [urgent, setUrgent] = useState(false);
  const [negotiable, setNegotiable] = useState(false);
  const [media, setMedia] = useState([]);const [loading, setLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcatSearch, setSubcatSearch] = useState('');

  const selCat = CATEGORIES.find((c) => c.name === category);
  const visibleCategories = filterCategoriesBySearch(categorySearch, tCat);

  async function pickImage() {
    if (media.length >= 5) return Alert.alert('', tr("screens_createrequestscreen_5_104g6g"));
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, quality: 0.8 });
    if (!r.canceled) {
      const tooLong = r.assets.filter((a) => (a.type === 'video' || a.uri?.match(/\.(mp4|mov|avi|mkv)$/i)) && a.duration && a.duration > 30000);
      if (tooLong.length) Alert.alert(tr("screens_createrequestscreen_text_1on3sg"), tr("screens_createrequestscreen_30_bercv6"));
      const valid = r.assets.filter((a) => !((a.type === 'video' || a.uri?.match(/\.(mp4|mov|avi|mkv)$/i)) && a.duration && a.duration > 30000));
      setMedia((prev) => [...prev, ...valid.slice(0, 5 - prev.length)]);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert(tr("error"), tr("screens_createrequestscreen_text_j3arl4"));
    if (!category) return Alert.alert(tr("error"), tr("screens_createrequestscreen_text_qy5s7"));
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());form.append('category', subcat || category);
      form.append('desc', desc);form.append('city', city);
      if (negotiable) form.append('budget', '0');else
      if (budget) form.append('budget', budget);
      form.append('urgency', urgent ? 'urgent' : 'normal');
      media.forEach((m, i) => {
        const isVideo = m.type === 'video' || m.uri?.match(/\.(mp4|mov|avi|mkv)$/i);
        form.append('media', { uri: m.uri, name: isVideo ? `vid_${i}.mp4` : `img_${i}.jpg`, type: isVideo ? 'video/mp4' : 'image/jpeg' });
      });
      await api('/requests', { method: 'POST', body: form });
      Alert.alert(tr("screens_auth_forgotscreen_text_rhok5c"), tr("screens_createrequestscreen_text_1jqawt"), [{ text: tr("screens_changepasswordscreen_text_i1qxce"), onPress: () => navigation.goBack() }]);
    } catch (e) {Alert.alert(tr("error"), e.error || tr("error"));} finally
    {setLoading(false);}
  }

  const accentColor = getCategoryTheme(category).fg;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 20 }}>{tr("screens_createrequestscreen_text_l395h5")}</Text>
        <Card>
          <Label t={tr("proposal_title_label")} />
          <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: title ? accentColor + '60' : C.border, padding: 13, color: C.text, fontSize: 15 }}
          placeholder={tr("post_req_title_ph")} placeholderTextColor={C.text2} value={title} onChangeText={setTitle} />
        </Card>
        <Card>
          <Label t={tr("proposal_cat_label_text")} />
          <TextInput
            value={categorySearch}
            onChangeText={setCategorySearch}
            placeholder={tr("cat_search_ph")}
            placeholderTextColor={C.text2}
            style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.text, marginBottom: 12 }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: selCat && selCat.subs.length > 0 ? 16 : 0 }}>
            {visibleCategories.length === 0 ? (
              <Text style={{ color: C.text2, paddingVertical: 8 }}>{tr("cat_search_empty")}</Text>
            ) : visibleCategories.map((c) => {const act = category === c.name;return (
                <TouchableOpacity key={c.name} onPress={() => {setCategory(c.name);setSubcat('');}}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14,
                  borderWidth: 1.5, borderColor: act ? C.accent : C.border,
                  backgroundColor: act ? C.accent + '18' : C.surface2,
                  minWidth: '45%', flex: 1
                }}>
                <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                <Text style={{ color: act ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{tCat(c.name)}</Text>
                {act && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
              </TouchableOpacity>);})}
          </View>
          {selCat && selCat.subs.length > 0 &&
          <>
              <Label t={tr("filter_subcategory")} />
              <TextInput
                value={subcatSearch}
                onChangeText={setSubcatSearch}
                placeholder={tr("cat_search_ph")}
                placeholderTextColor={C.text2}
                style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.text, marginBottom: 12 }}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {filterSubcategoriesBySearch(selCat.subs, subcatSearch, tCat).map((s) =>
              <TouchableOpacity key={s} onPress={() => setSubcat(subcat === s ? '' : s)}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: subcat === s ? C.accent : C.border, backgroundColor: subcat === s ? C.accent + '22' : C.surface2 }}>
                    <Text style={{ color: subcat === s ? C.accent : C.text2, fontWeight: '600', fontSize: 13 }}>{tCat(s)}</Text>
                  </TouchableOpacity>
              )}
              </View>
            </>
          }
        </Card>
        <Card>
          <Label t={tr("rd_desc_label")} />
          <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14, height: 100, textAlignVertical: 'top' }}
          placeholder={tr("screens_createrequestscreen_text_pg16qq")} placeholderTextColor={C.text2} value={desc} onChangeText={setDesc} multiline />
        </Card>
        <Card>
          <Label t={tr("proposal_city_label")} />
          <TouchableOpacity onPress={() => setShowCities(!showCities)}
          style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f660', padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCities ? 12 : 0 }}>
            <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 14 }}>📍 {tCity(city)}</Text>
            <Ionicons name={showCities ? 'chevron-up' : 'chevron-down'} size={18} color={C.text2} />
          </TouchableOpacity>
          {showCities &&
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CITIES.map((c) =>
              <TouchableOpacity key={c} onPress={() => {setCity(c);setShowCities(false);}}
              style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: city === c ? '#3b82f6' : C.border, backgroundColor: city === c ? '#3b82f622' : C.surface2 }}>
                    <Text style={{ color: city === c ? '#3b82f6' : C.text2, fontSize: 12, fontWeight: '600' }}>{tCity(c)}</Text>
                  </TouchableOpacity>
              )}
              </View>
            </ScrollView>
          }
        </Card>
        <Card>
          <Label t={tr("proposal_budget_label")} />
          <TextInput
            style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: negotiable ? C.border + '60' : C.border, padding: 13, color: negotiable ? C.text2 : C.text, fontSize: 15, marginBottom: 10, opacity: negotiable ? 0.5 : 1 }}
            placeholder={tr("screens_createrequestscreen_text_yhue1h")} placeholderTextColor={C.text2}
            value={negotiable ? '' : budget} onChangeText={setBudget}
            keyboardType="numeric" editable={!negotiable} />
          
          <TouchableOpacity onPress={() => {setNegotiable(!negotiable);if (!negotiable) setBudget('');}}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent + '12' : C.surface2, marginBottom: 14 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {negotiable && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ color: negotiable ? C.accent : C.text, fontWeight: '700', fontSize: 14 }}>{tr("screens_createrequestscreen_text_1vgvue")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setUrgent(!urgent)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: urgent ? C.err : C.border, backgroundColor: urgent ? C.err + '12' : C.surface2 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: urgent ? C.err : C.border, backgroundColor: urgent ? C.err : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {urgent && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ color: urgent ? C.err : C.text, fontWeight: '700', fontSize: 14 }}>{tr("screens_createrequestscreen_text_1vb18c")}</Text>
          </TouchableOpacity>
        </Card>
        <Card>
          <Label t={tr("screens_createrequestscreen_5_11ery3")} />
          {media.length > 0 &&
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {media.map((m, i) => {
                const isVideo = m.type === 'video' || m.uri?.match(/\.(mp4|mov|avi|mkv)$/i);
                return (
                  <View key={i} style={{ position: 'relative' }}>
                      <Image source={{ uri: m.uri }} style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: C.surface2 }} />
                      {isVideo &&
                    <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12 }}>
                          <Text style={{ fontSize: 22 }}>▶️</Text>
                        </View>
                    }
                      <TouchableOpacity onPress={() => setMedia((prev) => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: C.err, borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                      </TouchableOpacity>
                    </View>);

              })}
              </View>
            </ScrollView>
          }
          <TouchableOpacity onPress={pickImage}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', backgroundColor: C.surface2 }}>
            <Ionicons name="camera-outline" size={20} color={C.text2} />
            <Text style={{ color: C.text2, fontWeight: '600' }}>{tr("screens_createrequestscreen_text_mthwzj")}{media.length}/5)</Text>
          </TouchableOpacity>
        </Card>
        <Btn title={tr("screens_createrequestscreen_text_d20mns")} onPress={handleSubmit} loading={loading} style={{ marginTop: 4 }} />
      </ScrollView>
    </KeyboardAvoidingView>);

}
