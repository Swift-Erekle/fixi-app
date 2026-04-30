// src/screens/CreateRequestScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Btn, Card } from '../components/UI';

import { CATEGORIES, GEORGIA_CITIES } from '../utils/categories';
const CITIES = GEORGIA_CITIES;
const CAT_COLORS = { 'ელექტრიკოსი':'#8b5cf6','სანტექნიკი':'#3b82f6','კონდიციონერი':'#10b981','მხატვარი':'#f59e0b','დურგალი':'#ef4444','ტექნიკოსი':'#06b6d4','მშენებელი':'#d97706','უნივერსალური':'#6b7280','მებაღე':'#22c55e','სპეციალიზებული':'#a855f7','სახლის':'#ec4899','ფილების':'#f97316','შემდუღებელი':'#dc2626','მეკარე':'#14b8a6' };
function getColor(s) { for (const [k,v] of Object.entries(CAT_COLORS)) if (s?.toLowerCase().includes(k.toLowerCase())) return v; return C.accent; }
function Label({ t }) { return <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</Text>; }

export default function CreateRequestScreen({ navigation }) {
  const [title,setTitle]=useState(''); const [category,setCategory]=useState('');
  const [subcat,setSubcat]=useState('');
  const [desc,setDesc]=useState('');   const [city,setCity]=useState('თბილისი');
  const [budget,setBudget]=useState(''); const [urgent,setUrgent]=useState(false);
  const [negotiable,setNegotiable]=useState(false);
  const [media,setMedia]=useState([]); const [loading,setLoading]=useState(false);
  const [showCities,setShowCities]=useState(false);

  const selCat = CATEGORIES.find(c => c.name === category);

  async function pickImage() {
    if (media.length>=5) return Alert.alert('','მაქს. 5 ფაილი');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes:ImagePicker.MediaTypeOptions.All, allowsMultipleSelection:true, quality:0.8 });
    if (!r.canceled) {
      const tooLong = r.assets.filter(a => (a.type==='video'||a.uri?.match(/\.(mp4|mov|avi|mkv)$/i)) && a.duration && a.duration > 30000);
      if (tooLong.length) Alert.alert('ვიდეო ძალიან გრძელია', 'მაქს. 30 წამი დასაშვებია');
      const valid = r.assets.filter(a => !((a.type==='video'||a.uri?.match(/\.(mp4|mov|avi|mkv)$/i)) && a.duration && a.duration > 30000));
      setMedia(prev=>[...prev,...valid.slice(0,5-prev.length)]);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('შეცდომა','სათაური სავალდებულოა');
    if (!category)     return Alert.alert('შეცდომა','კატეგორია სავალდებულოა');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title',title.trim()); form.append('category', subcat || category);
      form.append('desc',desc); form.append('city',city);
      if (negotiable) form.append('budget','0');
      else if (budget) form.append('budget',budget);
      form.append('urgency',urgent?'urgent':'normal');
      media.forEach((m,i)=>{
        const isVideo = m.type==='video'||m.uri?.match(/\.(mp4|mov|avi|mkv)$/i);
        form.append('media',{uri:m.uri,name:isVideo?`vid_${i}.mp4`:`img_${i}.jpg`,type:isVideo?'video/mp4':'image/jpeg'});
      });
      await api('/requests',{method:'POST',body:form});
      Alert.alert('✅ წარმატება','მოთხოვნა გამოქვეყნდა!',[{text:'კარგი',onPress:()=>navigation.goBack()}]);
    } catch(e) { Alert.alert('შეცდომა',e.error||'შეცდომა'); }
    finally { setLoading(false); }
  }

  const accentColor = getColor(category);
  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:C.bg}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:30}}>
        <Text style={{color:C.text,fontSize:22,fontWeight:'900',marginBottom:20}}>📋 ახალი მოთხოვნა</Text>
        <Card>
          <Label t="სათაური *" />
          <TextInput style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:title?accentColor+'60':C.border,padding:13,color:C.text,fontSize:15}}
            placeholder="მაგ: სამზარეულოში გაჟონვა" placeholderTextColor={C.text2} value={title} onChangeText={setTitle} />
        </Card>
        <Card>
          <Label t="კატეგორია *" />
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:selCat&&selCat.subs.length>0?16:0}}>
            {CATEGORIES.map(c=>{const act=category===c.name;return(
              <TouchableOpacity key={c.name} onPress={()=>{setCategory(c.name);setSubcat('');}}
                style={{
                  flexDirection:'row',alignItems:'center',gap:8,
                  paddingHorizontal:14,paddingVertical:11,borderRadius:14,
                  borderWidth:1.5,borderColor:act?C.accent:C.border,
                  backgroundColor:act?C.accent+'18':C.surface2,
                  minWidth:'45%',flex:1,
                }}>
                <Text style={{fontSize:18}}>{c.icon}</Text>
                <Text style={{color:act?C.accent:C.text,fontWeight:'700',fontSize:13,flex:1}}>{c.name}</Text>
                {act&&<Ionicons name="checkmark-circle" size={16} color={C.accent}/>}
              </TouchableOpacity>);})}
          </View>
          {selCat&&selCat.subs.length>0&&(
            <>
              <Label t="ქვეკატეგორია" />
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
                {selCat.subs.map(s=>(
                  <TouchableOpacity key={s} onPress={()=>setSubcat(subcat===s?'':s)}
                    style={{paddingHorizontal:14,paddingVertical:9,borderRadius:20,borderWidth:1.5,borderColor:subcat===s?C.accent:C.border,backgroundColor:subcat===s?C.accent+'22':C.surface2}}>
                    <Text style={{color:subcat===s?C.accent:C.text2,fontWeight:'600',fontSize:13}}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </Card>
        <Card>
          <Label t="აღწერა" />
          <TextInput style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:C.border,padding:13,color:C.text,fontSize:14,height:100,textAlignVertical:'top'}}
            placeholder="დეტალები, ზომები, ინსტრუქციები..." placeholderTextColor={C.text2} value={desc} onChangeText={setDesc} multiline />
        </Card>
        <Card>
          <Label t="ქალაქი" />
          <TouchableOpacity onPress={()=>setShowCities(!showCities)}
            style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:'#3b82f660',padding:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:showCities?12:0}}>
            <Text style={{color:'#3b82f6',fontWeight:'700',fontSize:14}}>📍 {city}</Text>
            <Ionicons name={showCities?'chevron-up':'chevron-down'} size={18} color={C.text2} />
          </TouchableOpacity>
          {showCities&&(
            <ScrollView style={{maxHeight:200}} nestedScrollEnabled>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
                {CITIES.map(c=>(
                  <TouchableOpacity key={c} onPress={()=>{setCity(c);setShowCities(false);}}
                    style={{paddingHorizontal:13,paddingVertical:7,borderRadius:20,borderWidth:1.5,borderColor:city===c?'#3b82f6':C.border,backgroundColor:city===c?'#3b82f622':C.surface2}}>
                    <Text style={{color:city===c?'#3b82f6':C.text2,fontSize:12,fontWeight:'600'}}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </Card>
        <Card>
          <Label t="ბიუჯეტი (₾)" />
          <TextInput
            style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:negotiable?C.border+'60':C.border,padding:13,color:negotiable?C.text2:C.text,fontSize:15,marginBottom:10,opacity:negotiable?0.5:1}}
            placeholder="სავარაუდო თანხა" placeholderTextColor={C.text2}
            value={negotiable?'':budget} onChangeText={setBudget}
            keyboardType="numeric" editable={!negotiable}
          />
          <TouchableOpacity onPress={()=>{setNegotiable(!negotiable);if(!negotiable)setBudget('');}}
            style={{flexDirection:'row',alignItems:'center',gap:12,padding:13,borderRadius:12,borderWidth:1.5,borderColor:negotiable?C.accent:C.border,backgroundColor:negotiable?C.accent+'12':C.surface2,marginBottom:14}}>
            <View style={{width:22,height:22,borderRadius:6,borderWidth:2,borderColor:negotiable?C.accent:C.border,backgroundColor:negotiable?C.accent:'transparent',alignItems:'center',justifyContent:'center'}}>
              {negotiable&&<Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{color:negotiable?C.accent:C.text,fontWeight:'700',fontSize:14}}>💬 ფასი შეთანხმებით</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setUrgent(!urgent)}
            style={{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:12,borderWidth:1.5,borderColor:urgent?C.err:C.border,backgroundColor:urgent?C.err+'12':C.surface2}}>
            <View style={{width:22,height:22,borderRadius:6,borderWidth:2,borderColor:urgent?C.err:C.border,backgroundColor:urgent?C.err:'transparent',alignItems:'center',justifyContent:'center'}}>
              {urgent&&<Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{color:urgent?C.err:C.text,fontWeight:'700',fontSize:14}}>🚨 გადაუდებელია</Text>
          </TouchableOpacity>
        </Card>
        <Card>
          <Label t="ფოტო / ვიდეო (მაქს. 5)" />
          {media.length>0&&(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
              <View style={{flexDirection:'row',gap:8}}>
                {media.map((m,i)=>{
                  const isVideo = m.type==='video'||m.uri?.match(/\.(mp4|mov|avi|mkv)$/i);
                  return (
                    <View key={i} style={{position:'relative'}}>
                      <Image source={{uri:m.uri}} style={{width:90,height:90,borderRadius:12,backgroundColor:C.surface2}} />
                      {isVideo&&(
                        <View style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.35)',borderRadius:12}}>
                          <Text style={{fontSize:22}}>▶️</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={()=>setMedia(prev=>prev.filter((_,j)=>j!==i))}
                        style={{position:'absolute',top:-6,right:-6,backgroundColor:C.err,borderRadius:12,width:22,height:22,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:C.bg}}>
                        <Text style={{color:'#fff',fontSize:12,fontWeight:'800'}}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity onPress={pickImage}
            style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,padding:14,borderRadius:12,borderWidth:1.5,borderColor:C.border,borderStyle:'dashed',backgroundColor:C.surface2}}>
            <Ionicons name="camera-outline" size={20} color={C.text2} />
            <Text style={{color:C.text2,fontWeight:'600'}}>ფოტო / ვიდეო ({media.length}/5)</Text>
          </TouchableOpacity>
        </Card>
        <Btn title="✅ გამოქვეყნება" onPress={handleSubmit} loading={loading} style={{marginTop:4}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
