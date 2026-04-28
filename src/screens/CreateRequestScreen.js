// src/screens/CreateRequestScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Btn, Card } from '../components/UI';

const CATS = ['სანტექნიკი','ელექტრიკოსი','მხატვარი','დურგალი','კონდიციონერი','ინტერნეტი','კარ-ფანჯარა','სახურავი','ქვამჭრელი','სხვა'];
// ✅ FIXED: Full Georgian cities list
const CITIES = ['თბილისი','ბათუმი','ქუთაისი','რუსთავი','გორი','ზუგდიდი','პოტი','სამტრედია','ხაშური','სენაკი','ზესტაფონი','მარნეული','თელავი','ახალციხე','ოზურგეთი','ქობულეთი','ახალქალაქი','გარდაბანი','საგარეჯო','სიღნაღი','ბოლნისი','დმანისი','ყვარელი','ლაგოდეხი','დედოფლისწყარო','ხობი','ჩხოროწყუ','მარტვილი','ხარაგაული','ბაღდათი','ვანი','საჩხერე','ჭიათურა','ტყიბული','ამბროლაური','ონი','ცაგერი','ლენტეხი','მესტია','ახმეტა','თიანეთი','დუშეთი','მცხეთა','კასპი','ხელვაჩაური','ქედა','შუახევი','ხულო','ადიგენი','ასპინძა','ნინოწმინდა','სხვა'];
const CAT_COLORS = { 'ელექტრიკოსი':'#8b5cf6','სანტექნიკი':'#3b82f6','კონდიციონერი':'#10b981','მხატვარი':'#f59e0b','დურგალი':'#ef4444','ინტერნეტი':'#06b6d4' };
function getColor(s) { for (const [k,v] of Object.entries(CAT_COLORS)) if (s?.toLowerCase().includes(k.toLowerCase())) return v; return C.accent; }
function Label({ t }) { return <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</Text>; }

export default function CreateRequestScreen({ navigation }) {
  const [title,setTitle]=useState(''); const [category,setCategory]=useState('');
  const [desc,setDesc]=useState('');   const [city,setCity]=useState('თბილისი');
  const [budget,setBudget]=useState(''); const [urgent,setUrgent]=useState(false);
  const [media,setMedia]=useState([]); const [loading,setLoading]=useState(false);
  const [showCities,setShowCities]=useState(false);

  async function pickImage() {
    if (media.length>=5) return Alert.alert('','მაქს. 5 ფოტო');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes:ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection:true, quality:0.8 });
    if (!r.canceled) setMedia(prev=>[...prev,...r.assets.slice(0,5-prev.length)]);
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('შეცდომა','სათაური სავალდებულოა');
    if (!category)     return Alert.alert('შეცდომა','კატეგორია სავალდებულოა');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title',title.trim()); form.append('category',category);
      form.append('desc',desc); form.append('city',city);
      if (budget) form.append('budget',budget);
      form.append('urgency',urgent?'urgent':'normal');
      media.forEach((m,i)=>form.append('media',{uri:m.uri,name:`img_${i}.jpg`,type:'image/jpeg'}));
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection:'row',gap:8}}>
              {CATS.map(c=>{const col=getColor(c);const act=category===c;return(
                <TouchableOpacity key={c} onPress={()=>setCategory(c)}
                  style={{paddingHorizontal:14,paddingVertical:8,borderRadius:20,borderWidth:1.5,borderColor:act?col:C.border,backgroundColor:act?col+'22':C.surface2}}>
                  <Text style={{color:act?col:C.text2,fontWeight:'600',fontSize:13}}>{c}</Text>
                </TouchableOpacity>);})}
            </View>
          </ScrollView>
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
          <TextInput style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:C.border,padding:13,color:C.text,fontSize:15,marginBottom:14}}
            placeholder="სავარაუდო თანხა" placeholderTextColor={C.text2} value={budget} onChangeText={setBudget} keyboardType="numeric" />
          <TouchableOpacity onPress={()=>setUrgent(!urgent)}
            style={{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:12,borderWidth:1.5,borderColor:urgent?C.err:C.border,backgroundColor:urgent?C.err+'12':C.surface2}}>
            <View style={{width:22,height:22,borderRadius:6,borderWidth:2,borderColor:urgent?C.err:C.border,backgroundColor:urgent?C.err:'transparent',alignItems:'center',justifyContent:'center'}}>
              {urgent&&<Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{color:urgent?C.err:C.text,fontWeight:'700',fontSize:14}}>🚨 გადაუდებელია</Text>
          </TouchableOpacity>
        </Card>
        <Card>
          <Label t="ფოტოები (მაქს. 5)" />
          {media.length>0&&(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
              <View style={{flexDirection:'row',gap:8}}>
                {media.map((m,i)=>(
                  <View key={i} style={{position:'relative'}}>
                    <Image source={{uri:m.uri}} style={{width:90,height:90,borderRadius:12}} />
                    <TouchableOpacity onPress={()=>setMedia(prev=>prev.filter((_,j)=>j!==i))}
                      style={{position:'absolute',top:-6,right:-6,backgroundColor:C.err,borderRadius:12,width:22,height:22,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:C.bg}}>
                      <Text style={{color:'#fff',fontSize:12,fontWeight:'800'}}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity onPress={pickImage}
            style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,padding:14,borderRadius:12,borderWidth:1.5,borderColor:C.border,borderStyle:'dashed',backgroundColor:C.surface2}}>
            <Ionicons name="camera-outline" size={20} color={C.text2} />
            <Text style={{color:C.text2,fontWeight:'600'}}>ფოტოს დამატება ({media.length}/5)</Text>
          </TouchableOpacity>
        </Card>
        <Btn title="✅ გამოქვეყნება" onPress={handleSubmit} loading={loading} style={{marginTop:4}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
