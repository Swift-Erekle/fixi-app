// src/screens/SupportScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';

export default function SupportScreen() {
  const { user } = useAuth();
  const [messages,  setMessages]  = useState([]);
  const [supportId, setSupportId] = useState(null);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  // ✅ FIXED: live operator status
  const [opStatus,  setOpStatus]  = useState('waiting'); // 'waiting' | 'active' | 'online'
  const listRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api('/admin/support/mine');
      setMessages(res?.messages||[]);
      setSupportId(res?.supportId||null);
      setTimeout(()=>listRef.current?.scrollToEnd({animated:false}),100);
    } catch (e) {}
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(()=>{ load(); return ()=>{}; },[load]));

  useEffect(() => {
    const s = getSocket();
    if (!s||!supportId) return;
    s.emit('joinSupport', supportId);
    const handler = msg => {
      setMessages(prev => {
        if (prev.find(m=>m.id===msg.id)) return prev;
        return [...prev, { id:msg.id, fromId:msg.fromRole==='user'?user.id:'staff', content:msg.content, createdAt:msg.createdAt }];
      });
      setTimeout(()=>listRef.current?.scrollToEnd({animated:true}),50);
    };
    s.on('newSupportMsg', handler);
    // ✅ FIXED: listen for operator typing / active status
    const onAlert = () => setOpStatus('active');
    s.on('supportAlert', onAlert);
    return ()=>{ s.off('newSupportMsg',handler); s.off('supportAlert',onAlert); };
  }, [supportId, user]);

  async function send() {
    const body = text.trim();
    if (!body||sending) return;
    setSending(true);
    setOpStatus('waiting'); // ✅ reset to waiting when user sends
    try {
      const msg = await api('/admin/support', { method:'POST', body:{ content:body } });
      const normalized = { id:msg.id, fromId:msg.fromRole==='user'||!msg.fromRole?user.id:'staff', content:msg.content||body, createdAt:msg.createdAt||new Date().toISOString() };
      setMessages(prev => normalized.id&&prev.find(m=>m.id===normalized.id) ? prev : [...prev,normalized]);
      if (msg.supportRequestId&&!supportId) setSupportId(msg.supportRequestId);
      setText('');
      setTimeout(()=>listRef.current?.scrollToEnd({animated:true}),100);
    } catch (e) { Alert.alert('⚠️',e?.error||'ვერ გაიგზავნა'); }
    finally { setSending(false); }
  }

  if (!user) return (
    <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center',alignItems:'center',padding:24}}>
      <Text style={{fontSize:52,marginBottom:14}}>🔒</Text>
      <Text style={{color:C.text,fontWeight:'800',fontSize:16}}>საჭიროა ავტორიზაცია</Text>
    </View>
  );

  if (loading) return <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={C.accent}/></View>;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor:C.surface, borderBottomWidth:1, borderBottomColor:C.border, padding:16 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
          <View style={{ width:40, height:40, borderRadius:20, backgroundColor:C.accent+'20', borderWidth:1, borderColor:C.accent+'40', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontSize:20 }}>🎧</Text>
          </View>
          <View>
            <Text style={{ color:C.text, fontWeight:'900', fontSize:16 }}>სუპორტი</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:2 }}>
              <View style={{ width:8, height:8, borderRadius:4, backgroundColor: opStatus==='active'?C.accent:C.ok }} />
              <Text style={{ color: opStatus==='active'?C.accent:C.ok, fontSize:11, fontWeight:'600' }}>
                {opStatus==='active' ? '● ოპერატორი პასუხობს' : '● ოპერატორი მოლოდინში'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS==='ios' ? 64 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m,i)=>m.id||String(i)}
          contentContainerStyle={{ padding:16 }}
          ListEmptyComponent={
            <View style={{ padding:40, alignItems:'center' }}>
              <Text style={{ fontSize:52, marginBottom:14 }}>💬</Text>
              <Text style={{ color:C.text, fontWeight:'800', fontSize:16, marginBottom:6 }}>დაგვიწერე!</Text>
              <Text style={{ color:C.text2, fontSize:13, textAlign:'center' }}>ჩვენი გუნდი მზადაა დაგეხმაროს</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.fromId===user.id;
            return (
              <View style={{ alignSelf:isMe?'flex-end':'flex-start', maxWidth:'80%', marginBottom:10 }}>
                {!isMe && (
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
                    <View style={{ width:20,height:20,borderRadius:10,backgroundColor:C.accent+'30',alignItems:'center',justifyContent:'center' }}>
                      <Text style={{ fontSize:10 }}>🎧</Text>
                    </View>
                    <Text style={{ color:C.text2, fontSize:11, fontWeight:'600' }}>სუპორტი</Text>
                  </View>
                )}
                <View style={{
                  backgroundColor:isMe ? C.accent : C.surface,
                  borderRadius:18, borderBottomRightRadius:isMe?4:18, borderBottomLeftRadius:isMe?18:4,
                  padding:12, paddingHorizontal:14,
                  borderWidth:isMe?0:1, borderColor:C.border,
                }}>
                  <Text style={{ color:isMe?'#fff':C.text, fontSize:14, lineHeight:20 }}>{item.content}</Text>
                  <Text style={{ color:isMe?'rgba(255,255,255,.6)':C.text2, fontSize:10, marginTop:4, textAlign:'right' }}>
                    {new Date(item.createdAt).toLocaleTimeString('ka-GE',{hour:'2-digit',minute:'2-digit'})}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={{ flexDirection:'row', padding:10, paddingHorizontal:14, borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.surface, alignItems:'flex-end', gap:10 }}>
          <TextInput
            value={text} onChangeText={setText}
            placeholder="შეტყობინება..." placeholderTextColor={C.text2} multiline
            style={{ flex:1, color:C.text, backgroundColor:C.bg, borderRadius:20, paddingHorizontal:14, paddingVertical:10, maxHeight:120, fontSize:14, borderWidth:1, borderColor:C.border }}
          />
          <TouchableOpacity onPress={send} disabled={!text.trim()||sending}
            style={{ backgroundColor:text.trim()?C.accent:C.surface2, width:42,height:42,borderRadius:21,justifyContent:'center',alignItems:'center', borderWidth:1, borderColor:text.trim()?C.accent:C.border }}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color={text.trim()?'#fff':C.text2} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
