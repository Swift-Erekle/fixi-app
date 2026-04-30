// src/screens/ChatScreen.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/UI';
import { connectSocket, getSocket } from '../utils/socket';

export default function ChatScreen({ route, navigation }) {
  const { chatId, title } = route.params;
  const { user } = useAuth();
  const [chat, setChat]           = useState(null);
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [agreeing, setAgreeing]   = useState(false);
  const [countdown, setCountdown] = useState('');
  const flatRef    = useRef(null);
  const typingTimer = useRef(null);
  const countdownTimer = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: title || 'ჩათი' });
    loadChat();
    setupSocket();
    return () => {
      const sock = getSocket();
      if (sock) {
        sock.emit('leaveChat', chatId);
        sock.off('newMessage');
        sock.off('userTyping');
        sock.off('offerAgreedSingle');
        sock.off('offerUpdated');
        sock.off('offerDisagreed');
        sock.off('proposalAgreed');
        sock.off('proposalDisagreed');
        sock.off('chatBlocked');
      }
    };
  }, [chatId]);

  async function loadChat() {
    try {
      const data = await api('/chat/' + chatId);
      setChat(data);
      setMessages(data.messages || []);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) { console.warn(e); }
  }

  async function setupSocket() {
    const sock = await connectSocket();
    if (!sock) return;
    sock.emit('joinChat', chatId);
    sock.on('newMessage', msg => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
      if (msg.fromId && msg.fromId !== user?.id) {
        api(`/chat/${chatId}/read`, { method: 'POST' }).catch(() => {});
      }
    });
    sock.on('userTyping', ({ userId, isTyping }) => {
      if (userId !== user?.id) setOtherTyping(isTyping);
    });
    const onAgreementChange = () => loadChat();
    sock.on('offerAgreedSingle', onAgreementChange);
    sock.on('offerUpdated',      onAgreementChange);
    sock.on('offerDisagreed',    onAgreementChange);
    sock.on('proposalAgreed',    onAgreementChange);
    sock.on('proposalDisagreed', onAgreementChange);
    sock.on('chatBlocked',       onAgreementChange);
  }

  function handleTyping(val) {
    setText(val);
    const sock = getSocket();
    if (sock) {
      sock.emit('typing', { chatId, isTyping: true });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => sock.emit('typing', { chatId, isTyping: false }), 1500);
    }
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    const sock = getSocket();
    if (sock?.connected) {
      sock.emit('sendMessage', { chatId, content, type: 'text' });
      setText('');
      sock.emit('typing', { chatId, isTyping: false });
    } else {
      setSending(true);
      try {
        const msg = await api('/chat/' + chatId + '/messages', { method: 'POST', body: { content } });
        setMessages(prev => [...prev, msg]);
        setText('');
      } catch (e) { Alert.alert('შეცდომა', e.error || 'გაგზავნა ვერ მოხდა'); }
      finally { setSending(false); }
    }
  }

  async function sendImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append('file', { uri: result.assets[0].uri, name: 'chat.jpg', type: 'image/jpeg' });
      const msg = await api('/chat/' + chatId + '/upload', { method: 'POST', body: form });
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) { Alert.alert('შეცდომა', e.error || 'ატვირთვა ვერ მოხდა'); }
    finally { setSending(false); }
  }

  async function handleAgreement(action) {
    if (!chat) return;
    if (action === 'disagree') {
      Alert.alert(
        'ვერ შევთანხმდი',
        'ნამდვილად გინდა უარი თქვა? სხვა შეთავაზებების ნახვა კვლავ შეგეძლება.',
        [
          { text: 'გაუქმება', style: 'cancel' },
          { text: 'დადასტურება', style: 'destructive', onPress: () => _doAgreement('disagree') },
        ]
      );
      return;
    }
    _doAgreement(action);
  }

  async function _doAgreement(action) {
    setAgreeing(true);
    try {
      const offerId = chat.offer?.id;
      if (offerId) {
        await api(`/offers/${offerId}/${action}`, { method: 'POST' });
      } else if (chat.proposal?.id) {
        await api(`/proposals/${chat.proposal.id}/${action}`, { method: 'POST' });
      }
      await loadChat();
      if (action === 'agree') Alert.alert('✅ შეთანხმება დაფიქსირდა', 'მეორე მხარე მიიღებს შეტყობინებას.');
    } catch (e) {
      if (e.error?.includes('ელოდება') || e.error?.includes('ჯერ')) {
        Alert.alert('👀', e.error);
      } else {
        Alert.alert('შეცდომა', e.error || 'ვერ შესრულდა');
      }
      await loadChat();
    } finally { setAgreeing(false); }
  }

  // Offer flow: USER first (recipientAgreed), HANDYMAN confirms (senderAgreed)
  // Proposal flow: HANDYMAN first (senderAgreed), USER confirms (recipientAgreed)
  function canAgree() {
    if (!chat || !user) return false;
    const offer    = chat.offer;
    const proposal = chat.proposal;
    const isUser     = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser     && !offer.recipientAgreed)                       return true;
      if (isHandyman && offer.recipientAgreed && !offer.senderAgreed) return true;
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman && !proposal.senderAgreed)                            return true;
      if (isUser     && proposal.senderAgreed && !proposal.recipientAgreed) return true;
    }
    return false;
  }

  // Only user can disagree on offer flow; both can disagree on proposal flow
  function canDisagree() {
    if (!chat || !user) return false;
    const offer    = chat.offer;
    const proposal = chat.proposal;
    const isUser     = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      // Server allows ONLY user to disagree on offers
      if (isUser && !offer.recipientAgreed) return true;
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman && !proposal.senderAgreed)                            return true;
      if (isUser     && proposal.senderAgreed && !proposal.recipientAgreed) return true;
    }
    return false;
  }

  // Context text above agreement buttons — exact texts from website
  function agreeContextText() {
    if (!chat || !user) return '';
    const offer    = chat.offer;
    const proposal = chat.proposal;
    const isUser     = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser     && !offer.recipientAgreed)
        return 'თუ საბოლოოდ შეთანხმდით ხელოსანთან — აირჩიე „შევთანხმდი". თუ გინდა სხვა შეთავაზებების გადახედვა — აირჩიე „ვერ შევთანხმდი".';
      if (isHandyman && offer.recipientAgreed && !offer.senderAgreed)
        return 'მომხმარებელი ეთანხმება — შენ ეთანხმები სამუშაოს დაწყებას?';
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman && !proposal.senderAgreed)
        return 'თუ საბოლოოდ შეთანხმდით მომხმარებელთან — აირჩიე „შევთანხმდი" და დაელოდე მის პასუხს. წინააღმდეგ შემთხვევაში — აირჩიე „ვერ შევთანხმდი".';
      if (isUser && proposal.senderAgreed && !proposal.recipientAgreed)
        return 'ხელოსანი ეთანხმება — დააჭირე „შევთანხმდი"-ს სამუშაოს დასაწყებად.';
    }
    return '';
  }

  // Role-specific instruction injected after "chat opened" system message
  function getChatInstruction() {
    if (!chat || !user) return null;
    const offer    = chat.offer;
    const proposal = chat.proposal;
    const isUser     = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser)     return 'თუ საბოლოოდ შეთანხმდით ხელოსანთან — აირჩიე „შევთანხმდი". თუ გინდა სხვა შეთავაზებების გადახედვა — აირჩიე „ვერ შევთანხმდი".';
      if (isHandyman) return 'როცა შეთანხმებამდე მიხვალთ, დაელოდეთ სანამ მომხმარებელი არ გამოგიგზავნით დათანხმებას!';
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman) return 'თუ საბოლოოდ შეთანხმდით მომხმარებელთან — აირჩიე „შევთანხმდი" და დაელოდე მის პასუხს. წინააღმდეგ შემთხვევაში — აირჩიე „ვერ შევთანხმდი".';
      if (isUser)     return 'დაელოდეთ სანამ ხელოსანი/კომპანია არ დათანხმდება. შემდეგ გამოგიჩნდება ღილაკი — დააჭირეთ „შევთანხმდი"-ს!';
    }
    return null;
  }

  // Build the display list: filter old dual-label messages, inject instruction
  const displayMessages = useMemo(() => {
    const instruction = getChatInstruction();
    const result = [];
    let injected = false;
    for (const m of messages) {
      // Filter server-stored dual-label instruction messages (website also hides these)
      if ((m.type === 'system' || !m.fromId) && m.content &&
          (m.content.includes('🔧 ხელოსანი:') || m.content.includes('👤 მომხმარებელი:'))) {
        continue;
      }
      result.push(m);
      // Inject role-specific instruction after first "chat opened" or "proposal sent" message
      if (!injected && instruction && (m.type === 'system' || !m.fromId) && m.content &&
          (m.content.includes('ჩათი გაიხსნა') || m.content.includes('შემოთავაზება გაიგზავნა'))) {
        result.push({ id: '__instruction__', type: '__instruction__', content: instruction });
        injected = true;
      }
    }
    return result;
  }, [messages, chat, user]);

  // Countdown timer for agreed offers/proposals
  useEffect(() => {
    const completedAt = chat?.offer?.completedAt || chat?.proposal?.completedAt;
    const isAgreed = (chat?.offer?.status === 'agreed') || (chat?.proposal?.status === 'agreed');
    if (!isAgreed || !completedAt) { setCountdown(''); clearInterval(countdownTimer.current); return; }
    function tick() {
      const diff = new Date(completedAt) - Date.now();
      if (diff <= 0) { setCountdown('⏱ ვადა გასულია'); clearInterval(countdownTimer.current); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setCountdown(`⏱ ${d}დ ${h}სთ ${m}წთ`);
      else if (h > 0) setCountdown(`⏱ ${h}სთ ${m}წთ ${s}წმ`);
      else setCountdown(`⏱ ${m}წთ ${s}წმ`);
    }
    tick();
    countdownTimer.current = setInterval(tick, 1000);
    return () => clearInterval(countdownTimer.current);
  }, [chat]);

  const other = chat ? (user?.type === 'user' ? chat.handyman : chat.user) : null;
  const isFullyAgreed = (chat?.offer?.status === 'agreed') || (chat?.proposal?.status === 'agreed');

  function renderMessage({ item: msg }) {
    // Role-specific instruction card
    if (msg.type === '__instruction__') {
      return (
        <View style={{ backgroundColor: C.accent + '14', borderRadius: 12, borderWidth: 1, borderColor: C.accent + '40', marginHorizontal: 14, marginVertical: 8, padding: 12 }}>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>💡 {msg.content}</Text>
        </View>
      );
    }
    const isMe = msg.fromId === user?.id;
    if (msg.type === 'system' || !msg.fromId) {
      return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <View style={{ backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, maxWidth: '85%' }}>
            <Text style={{ color: C.text2, fontSize: 12, textAlign: 'center' }}>{msg.content}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 6, paddingHorizontal: 14 }}>
        <View style={{
          maxWidth: '78%', backgroundColor: isMe ? C.accent : C.surface,
          borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4,
          padding: 12, borderWidth: isMe ? 0 : 1, borderColor: C.border,
        }}>
          {msg.type === 'image' ? (
            <Image source={{ uri: msg.content }} style={{ width: 210, height: 160, borderRadius: 10 }} resizeMode="cover" />
          ) : msg.type === 'video' ? (
            <Text style={{ color: isMe ? '#fff' : C.text }}>🎥 ვიდეო</Text>
          ) : msg.type === 'voice' ? (
            <Text style={{ color: isMe ? '#fff' : C.text }}>🎤 ხმოვანი</Text>
          ) : (
            <Text style={{ color: isMe ? '#fff' : C.text, fontSize: 14, lineHeight: 21 }}>{msg.content}</Text>
          )}
          <Text style={{ color: isMe ? 'rgba(255,255,255,.55)' : C.text2, fontSize: 10, marginTop: 5, textAlign: 'right' }}>
            {new Date(msg.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Other user info bar */}
      {other && (
        <TouchableOpacity
          onPress={() => navigation.navigate('HandymanDetail', { id: other.id })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border }}
        >
          <Avatar user={other} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>{other.name} {other.surname || ''}</Text>
            {(chat?.offer?.request?.title || chat?.proposal?.title) && (
              <Text style={{ color: C.accent, fontSize: 11 }} numberOfLines={1}>
                📋 {chat.offer?.request?.title || chat.proposal?.title}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.text2} />
        </TouchableOpacity>
      )}

      {/* Status banners */}
      {isFullyAgreed && (
        <View style={{ backgroundColor: C.ok + '15', borderBottomWidth: 1, borderBottomColor: C.ok + '30', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: C.ok, fontWeight: '700', fontSize: 13 }}>🤝 შეთანხმება დასრულებულია — თანამშრომლობა დაიწყო</Text>
          {countdown ? <Text style={{ color: C.ok, fontSize: 12, marginTop: 3 }}>{countdown}</Text> : null}
        </View>
      )}
      {chat?.offer?.status === 'completed' && (
        <View style={{ backgroundColor: C.ok + '15', borderBottomWidth: 1, borderBottomColor: C.ok + '30', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: C.ok, fontWeight: '700', fontSize: 13 }}>✅ სამუშაო დასრულებულია</Text>
        </View>
      )}
      {(chat?.offer?.status === 'disagreed' || chat?.proposal?.status === 'disagreed') && (
        <View style={{ backgroundColor: C.err + '15', borderBottomWidth: 1, borderBottomColor: C.err + '30', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: C.err, fontWeight: '700', fontSize: 13 }}>❌ ვერ შევთანხმდით — ჩათი დაიხურება 24 საათში</Text>
        </View>
      )}

      <FlatList
        ref={flatRef}
        data={displayMessages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 14 }}
        onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
      />

      {otherTyping && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
          <Text style={{ color: C.text2, fontSize: 12 }}>⌨️ წერს...</Text>
        </View>
      )}

      {/* Agreement bar — appears when it's this user's turn to decide */}
      {canAgree() && (
        <View style={{ backgroundColor: C.surface2, borderTopWidth: 1.5, borderTopColor: C.accent + '50', padding: 12, paddingHorizontal: 14 }}>
          <Text style={{ color: C.text2, fontSize: 12, marginBottom: 10, lineHeight: 18 }}>{agreeContextText()}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => handleAgreement('agree')} disabled={agreeing}
              style={{ flex: 1, backgroundColor: C.ok + '20', borderRadius: 12, borderWidth: 1.5, borderColor: C.ok, padding: 13, alignItems: 'center' }}>
              {agreeing
                ? <ActivityIndicator color={C.ok} size="small" />
                : <Text style={{ color: C.ok, fontWeight: '800', fontSize: 14 }}>✅ შევთანხმდი</Text>
              }
            </TouchableOpacity>
            {canDisagree() && (
              <TouchableOpacity onPress={() => handleAgreement('disagree')} disabled={agreeing}
                style={{ flex: 1, backgroundColor: C.err + '15', borderRadius: 12, borderWidth: 1.5, borderColor: C.err + '60', padding: 13, alignItems: 'center' }}>
                <Text style={{ color: C.err, fontWeight: '800', fontSize: 14 }}>❌ ვერ შევთანხმდი</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 10, paddingHorizontal: 14, gap: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, opacity: isFullyAgreed ? 0.5 : 1 }}>
        <TouchableOpacity onPress={sendImage} disabled={sending || isFullyAgreed}
          style={{ padding: 8, backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="image-outline" size={22} color={C.text2} />
        </TouchableOpacity>
        <TextInput
          style={{ flex: 1, backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.text, fontSize: 14, maxHeight: 110, borderWidth: 1, borderColor: C.border }}
          placeholder={isFullyAgreed ? '🤝 ჩათი დაბლოკილია' : 'შეტყობინება...'} placeholderTextColor={C.text2}
          value={text} onChangeText={handleTyping} multiline
          editable={!isFullyAgreed}
        />
        <TouchableOpacity onPress={sendMessage} disabled={!text.trim() || sending || isFullyAgreed}
          style={{ backgroundColor: text.trim() && !isFullyAgreed ? C.accent : C.surface2, borderRadius: 20, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: text.trim() && !isFullyAgreed ? C.accent : C.border }}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color={text.trim() && !isFullyAgreed ? '#fff' : C.text2} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
