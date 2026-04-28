// src/screens/MyOffersScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { Tag, Empty, Btn } from '../components/UI';

const STATUS = {
  accepted:{label:'✅ მიღებული',color:'#10b981'},rejected:{label:'❌ უარყოფილი',color:'#ef4444'},
  pending:{label:'⏳ მოლოდინში',color:'#f59e0b'},disagreed:{label:'↩️ გაუქმებული',color:'#6b7280'},
};

function EditModal({ offer, visible, onClose, onSaved }) {
  const [price,setPrice]=useState(String(offer?.price||''));
  const [days,setDays]=useState(''); const [hours,setHours]=useState('');
  const [comment,setComment]=useState(offer?.comment||'');
  const [loading,setLoading]=useState(false);
  const dMins=(parseInt(days||0)*24*60)+(parseInt(hours||0)*60);
  const dLabel=[parseInt(days||0)>0?`${days} დღე`:'',parseInt(hours||0)>0?`${hours} საათი`:''].filter(Boolean).join(' ');

  async function save() {
    if (!price) return Alert.alert('შეცდომა','ფასი სავალდებულოა');
    setLoading(true);
    try {
      await api(`/offers/${offer.id}`,{method:'PATCH',body:{price:parseInt(price),...(dMins>0?{durationMinutes:dMins,duration:dLabel}:{}),comment}});
      onSaved(); onClose(); Alert.alert('✅','შეთავაზება განახლდა!');
    } catch(e){Alert.alert('შეცდომა',e.error||'ვერ');} finally{setLoading(false);}
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.5)'}}>
        <View style={{backgroundColor:C.surface,borderRadius:24,padding:24,margin:16}}>
          <Text style={{color:C.text,fontSize:18,fontWeight:'900',marginBottom:20}}>✏️ შეთავაზების რედ.</Text>
          <Text style={{color:C.text2,fontSize:12,fontWeight:'700',marginBottom:8,textTransform:'uppercase'}}>ახალი ფასი (₾) *</Text>
          <TextInput style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:C.border,padding:13,color:C.text,fontSize:20,fontWeight:'900',marginBottom:16,textAlign:'center'}}
            value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={C.text2} />
          <Text style={{color:C.text2,fontSize:12,fontWeight:'700',marginBottom:8,textTransform:'uppercase'}}>ახალი ვადა (სურვილისამებრ)</Text>
          <View style={{flexDirection:'row',gap:10,marginBottom:16}}>
            <TextInput style={{flex:1,backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:C.border,padding:12,color:C.text,textAlign:'center'}}
              placeholder="დღეები" placeholderTextColor={C.text2} value={days} onChangeText={setDays} keyboardType="numeric" />
            <TextInput style={{flex:1,backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:C.border,padding:12,color:C.text,textAlign:'center'}}
              placeholder="საათები" placeholderTextColor={C.text2} value={hours} onChangeText={setHours} keyboardType="numeric" />
          </View>
          <Text style={{color:C.text2,fontSize:12,fontWeight:'700',marginBottom:8,textTransform:'uppercase'}}>კომენტარი</Text>
          <TextInput style={{backgroundColor:C.surface2,borderRadius:12,borderWidth:1,borderColor:C.border,padding:13,color:C.text,fontSize:14,height:80,textAlignVertical:'top',marginBottom:20}}
            value={comment} onChangeText={setComment} placeholder="კომენტარი..." placeholderTextColor={C.text2} multiline />
          <Btn title="შენახვა" onPress={save} loading={loading} style={{marginBottom:10}} />
          <TouchableOpacity onPress={onClose} style={{padding:12,alignItems:'center'}}><Text style={{color:C.text2}}>გაუქმება</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function MyOffersScreen({ navigation }) {
  const [offers,setOffers]=useState([]);
  const [refreshing,setRefreshing]=useState(false);
  const [editOffer,setEditOffer]=useState(null);

  async function load(r=false) {
    if(r)setRefreshing(true);
    try{setOffers(await api('/offers/mine'));}catch(e){console.warn(e);}finally{setRefreshing(false);}
  }
  useFocusEffect(useCallback(()=>{load();},[  ]));

  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <FlatList
        data={offers} keyExtractor={o=>o.id}
        contentContainerStyle={{padding:16,paddingBottom:20}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={C.accent} />}
        ListHeaderComponent={<Text style={{color:C.text,fontSize:22,fontWeight:'900',marginBottom:16}}>📤 ჩემი შეთავაზებები</Text>}
        renderItem={({item:o})=>{
          const st=STATUS[o.status]||STATUS.pending;
          return (
            <TouchableOpacity activeOpacity={0.85}
              onPress={()=>o.chat?.id?navigation.navigate('Chat',{chatId:o.chat.id,title:o.request?.title||'ჩათი'}):navigation.navigate('RequestDetail',{id:o.requestId})}
              style={{backgroundColor:C.surface,borderRadius:16,borderWidth:1,borderColor:C.border,padding:16,marginBottom:12}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <Text style={{color:C.text,fontWeight:'800',fontSize:14,flex:1,marginRight:8}} numberOfLines={2}>{o.request?.title}</Text>
                <View style={{alignItems:'flex-end',gap:4}}>
                  <Text style={{color:C.accent,fontWeight:'900',fontSize:20}}>₾{o.price}</Text>
                  {o.status==='pending'&&(
                    <TouchableOpacity onPress={()=>setEditOffer(o)}
                      style={{backgroundColor:C.surface2,borderRadius:8,borderWidth:1,borderColor:C.border,paddingHorizontal:8,paddingVertical:4,flexDirection:'row',alignItems:'center',gap:4}}>
                      <Ionicons name="create-outline" size={13} color={C.text2} />
                      <Text style={{color:C.text2,fontSize:11,fontWeight:'600'}}>რედ.</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:o.comment?10:0}}>
                {o.request?.category&&<Tag label={o.request.category} />}
                {o.request?.city&&<Tag label={'📍 '+o.request.city} />}
                <Tag label={st.label} color={st.color} />
                {o.duration&&<Tag label={'⏱ '+o.duration} />}
              </View>
              {o.comment&&<Text style={{color:C.text2,fontSize:13,lineHeight:18}} numberOfLines={2}>{o.comment}</Text>}
              {o.status==='accepted'&&o.chat?.id&&(
                <View style={{marginTop:10,backgroundColor:'#10b98115',borderRadius:10,padding:10,borderWidth:1,borderColor:'#10b98130',alignItems:'center'}}>
                  <Text style={{color:'#10b981',fontWeight:'700',fontSize:13}}>💬 ჩათი გახსნილია → შედი</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Empty icon="📤" title="შეთავაზება ჯერ არ გაქვს" subtitle="გადადი მოთხოვნებზე და გაგზავნე შეთავაზება" />}
      />
      {editOffer&&<EditModal offer={editOffer} visible={!!editOffer} onClose={()=>setEditOffer(null)} onSaved={()=>load()} />}
    </View>
  );
}
