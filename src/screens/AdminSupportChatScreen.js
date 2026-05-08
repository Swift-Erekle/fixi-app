import { useLanguage } from "../context/LanguageContext"; // src/screens/AdminSupportChatScreen.js
// Staff/admin chat with a specific user's support request
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Alert } from
'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { connectSocket, getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';

export default function AdminSupportChatScreen({ route, navigation }) {const { t: tr } = useLanguage();
  const { supportId, userName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const list = await api('/admin/support');
      const sr = list.find((s) => s.id === supportId);
      setMessages(sr?.messages || []);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }, [supportId]);

  useFocusEffect(useCallback(() => {
    navigation.setOptions({ title: userName ? `🎧 ${userName}` : tr("user_support_title") });
    load();
  }, [load, navigation, userName]));

  useEffect(() => {
    let sock;
    (async () => {
      sock = await connectSocket();
      if (!sock) return;
      sock.emit('joinSupport', supportId);
      sock.on('newSupportMsg', (msg) => {
        if (msg.supportRequestId !== supportId) return;
        setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      });
    })();
    return () => {
      const s = getSocket();
      if (s) s.off('newSupportMsg');
    };
  }, [supportId]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const sock = getSocket();
    try {
      // Use socket if available
      if (sock?.connected) {
        sock.emit('sendSupportMsg', { supportId, content: body });
        setText('');
      } else {
        // No REST endpoint for staff support reply, so we still rely on socket
        Alert.alert('⚠️', tr("screens_adminsupportchatscreen_text_gwgfkt"));
      }
    } finally {setSending(false);}
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => m.id || String(i)}
          contentContainerStyle={{ padding: 14 }}
          renderItem={({ item: m }) => {
            // Operator (staff/admin) messages on right, user messages on left
            const isOperator = m.fromRole === 'operator';
            return (
              <View style={{ alignSelf: isOperator ? 'flex-end' : 'flex-start', maxWidth: '82%', marginBottom: 8 }}>
                {!isOperator &&
                <Text style={{ color: C.text2, fontSize: 11, marginBottom: 3, fontWeight: '600' }}>👤 {userName || tr("reg_type_user")}</Text>
                }
                <View style={{
                  backgroundColor: isOperator ? C.accent : C.surface,
                  borderRadius: 18,
                  borderBottomRightRadius: isOperator ? 4 : 18,
                  borderBottomLeftRadius: isOperator ? 18 : 4,
                  padding: 11, paddingHorizontal: 13,
                  borderWidth: isOperator ? 0 : 1, borderColor: C.border
                }}>
                  <Text style={{ color: isOperator ? '#fff' : C.text, fontSize: 14, lineHeight: 20 }}>{m.content}</Text>
                  <Text style={{ color: isOperator ? 'rgba(255,255,255,.6)' : C.text2, fontSize: 10, marginTop: 3, textAlign: 'right' }}>
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              </View>);

          }}
          ListEmptyComponent={
          <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 42, marginBottom: 10 }}>🎧</Text>
              <Text style={{ color: C.text, fontWeight: '700' }}>{tr("screens_adminsupportchatscreen_text_1vh2nb")}</Text>
            </View>
          } />
        

        {/* Input */}
        <View style={{ flexDirection: 'row', padding: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, alignItems: 'flex-end', gap: 10 }}>
          <TextInput value={text} onChangeText={setText}
          placeholder={tr("screens_adminsupportchatscreen_text_1nen4c")} placeholderTextColor={C.text2} multiline
          style={{ flex: 1, color: C.text, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, maxHeight: 110, fontSize: 14, borderWidth: 1, borderColor: C.border }} />
          
          <TouchableOpacity onPress={send} disabled={!text.trim() || sending}
          style={{ backgroundColor: text.trim() ? C.accent : C.surface2, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: text.trim() ? C.accent : C.border }}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={17} color={text.trim() ? '#fff' : C.text2} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>);

}
