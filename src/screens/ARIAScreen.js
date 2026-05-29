import { useLanguage } from "../context/LanguageContext"; // src/screens/ARIAScreen.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from
'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function getQuickReplies(tr) {
  return [
    { label: tr('aria_quick_how_label'), key: 'how', answer: tr('aria_quick_how_answer') },
    { label: tr('aria_quick_plans_label'), key: 'plans', answer: tr('aria_quick_plans_answer') },
    { label: tr('aria_quick_vip_label'), key: 'vip', answer: tr('aria_quick_vip_answer') },
    { label: tr('aria_quick_request_label'), key: 'request', answer: tr('aria_quick_request_answer') },
  ];
}


function findQuickReply(text, quickReplies) {
  const t = text.toLowerCase().trim();
  if (t.includes('როგორ მუშაობ') || t.includes('myfix')) return quickReplies[0];
  if (t.includes('ტარიფ') || t.includes('ფასი') || t.includes('ღირ')) return quickReplies[1];
  if (t.includes('vip')) return quickReplies[2];
  if (t.includes('მოთხოვნა') && (t.includes('დავდ') || t.includes('შევქმნა') || t.includes('გამოვაქვეყნო'))) return quickReplies[3];
  return null;
}

function Message({ msg }) {
  const isAria = msg.role === 'model';
  function renderText(text) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <Text key={i} style={{ color: isAria ? C.text : '#fff', fontSize: 14, lineHeight: 22 }}>
          {parts.map((p, j) => j % 2 === 1 ? <Text key={j} style={{ fontWeight: '800' }}>{p}</Text> : p)}
          {'\n'}
        </Text>);

    });
  }
  return (
    <View style={{ alignSelf: isAria ? 'flex-start' : 'flex-end', maxWidth: '85%', marginBottom: 12, paddingHorizontal: 14 }}>
      {isAria &&
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent + '30', borderWidth: 1, borderColor: C.accent + '50', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 11 }}>✨</Text>
          </View>
          <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>ARIA</Text>
        </View>
      }
      <View style={{ backgroundColor: isAria ? C.surface : C.accent, borderRadius: 18, borderBottomLeftRadius: isAria ? 4 : 18, borderBottomRightRadius: isAria ? 18 : 4, padding: 13, paddingHorizontal: 15, borderWidth: isAria ? 1 : 0, borderColor: C.border }}>
        {renderText(msg.text)}
      </View>
      <Text style={{ color: C.text2, fontSize: 10, marginTop: 4, textAlign: isAria ? 'left' : 'right', paddingHorizontal: 4 }}>
        {new Date(msg.time).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
        {msg.static ? '  ⚡' : ''}
      </Text>
    </View>);

}

export default function ARIAScreen({ navigation }) {const { t: tr, lang } = useLanguage();
  const quickReplies = getQuickReplies(tr);
  const initialAriaText = tr("screens_ariascreen_aria_myfix_ge_ai_17k390");
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
  { id: '0', role: 'model', time: Date.now(), static: true, text: initialAriaText }]
  );
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [opReq, setOpReq] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const listRef = useRef(null);
  const scrollDown = useCallback(() => {setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);}, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === '0' && prev[0]?.static) {
        return [{ ...prev[0], text: initialAriaText }];
      }
      return prev;
    });
  }, [initialAriaText, lang]);

  function addMsg(role, text, isStatic = false) {
    const msg = { id: Date.now().toString() + Math.random(), role, time: Date.now(), text, static: isStatic };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }

  async function sendToAPI(content, history) {
    setLoading(true);
    try {
      const apiHistory = history.filter((m) => m.role === 'user' || m.role === 'model').slice(-16).map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
      apiHistory.push({ role: 'user', parts: [{ text: content }] });
      const res = await api('/aria/chat', { method: 'POST', body: { messages: apiHistory, userType: user?.type || 'unknown' } });
      let reply = res.reply || tr("screens_ariascreen_text_zoocxr");
      const needsOp = reply.includes('[OPERATOR_REQUEST]');
      reply = reply.replace('[OPERATOR_REQUEST]', '').trim();
      addMsg('model', reply, !!res.static);
      scrollDown();
      if (needsOp) setOpReq(true);
    } catch (e) {
      addMsg('model', tr("screens_ariascreen_text_igtexz"), true);
      scrollDown();
    } finally {setLoading(false);}
  }

  async function send(override) {
    const content = (override || text).trim();
    if (!content || loading) return;
    setText('');setShowQuick(false);
    addMsg('user', content);scrollDown();
    const quick = findQuickReply(content, quickReplies);
    if (quick) {setTimeout(() => {addMsg('model', quick.answer, true);scrollDown();}, 300);return;}
    await sendToAPI(content, messages);
  }

  function tapQuick(qr) {
    setShowQuick(false);
    addMsg('user', qr.label);scrollDown();
    setTimeout(() => {addMsg('model', qr.answer, true);scrollDown();}, 300);
  }

  function goToSupport() {setOpReq(false);navigation.navigate('Support');}

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: insets.top + 14, paddingBottom: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent + '20', borderWidth: 1, borderColor: C.accent + '50', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>✨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>ARIA</Text>
          <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '600' }}>{tr("screens_ariascreen_myfix_ge_ai_1xyenp")}</Text>
        </View>
        <TouchableOpacity onPress={goToSupport} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Ionicons name="headset-outline" size={16} color={C.text2} />
          <Text style={{ color: C.text2, fontSize: 12, fontWeight: '600' }}>{tr("support_title")}</Text>
        </TouchableOpacity>
      </View>

      {opReq &&
      <TouchableOpacity onPress={goToSupport} style={{ backgroundColor: C.accent + '18', borderBottomWidth: 1, borderBottomColor: C.accent + '40', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="headset" size={18} color={C.accent} />
          <Text style={{ color: C.accent, fontWeight: '700', flex: 1 }}>{tr("screens_ariascreen_text_tj49pc")}</Text>
        </TouchableOpacity>
      }

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Message msg={item} />}
          contentContainerStyle={{ paddingVertical: 16 }}
          onLayout={scrollDown}
          ListFooterComponent={loading ?
          <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <View style={{ backgroundColor: C.surface, borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' }}>
                <ActivityIndicator color={C.accent} size="small" />
              </View>
            </View> :
          null} />
        

        {showQuick &&
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
            <Text style={{ color: C.text2, fontSize: 11, marginBottom: 8, paddingLeft: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("screens_ariascreen_text_6cx36n")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {quickReplies.map((qr) =>
              <TouchableOpacity key={qr.key} onPress={() => tapQuick(qr)}
              style={{ backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.accent + '55', paddingHorizontal: 14, paddingVertical: 9 }}>
                    <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>{qr.label}</Text>
                  </TouchableOpacity>
              )}
              </View>
            </ScrollView>
          </View>
        }

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface }}>
          <TextInput
            style={{ flex: 1, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.text, fontSize: 14, maxHeight: 110, borderWidth: 1, borderColor: C.border }}
            placeholder={tr("screens_ariascreen_text_1tgb3b")} placeholderTextColor={C.text2}
            value={text} onChangeText={setText} multiline
            onFocus={() => setShowQuick(false)} />
          
          <TouchableOpacity onPress={() => send()} disabled={!text.trim() || loading}
          style={{ backgroundColor: text.trim() ? C.accent : C.surface2, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: text.trim() ? C.accent : C.border }}>
            <Ionicons name="send" size={17} color={text.trim() ? '#fff' : C.text2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>);

}
