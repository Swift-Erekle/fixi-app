import { useLanguage } from "../context/LanguageContext"; // src/screens/ChatScreen.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from
'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/UI';
import { connectSocket, getSocket } from '../utils/socket';

export default function ChatScreen({ route, navigation }) {const { t: tr } = useLanguage();
  const { chatId, title } = route.params;
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const recTimer = useRef(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [disagreeing, setDisagreeing] = useState(false);
  const [countdown, setCountdown] = useState('');
  const flatRef = useRef(null);
  const typingTimer = useRef(null);
  const countdownTimer = useRef(null);
  const socketHandlersRef = useRef({});

  useEffect(() => {
    navigation.setOptions({ title: title || tr("dash_chats") });
    loadChat();
    setupSocket();
    return () => {
      const sock = getSocket();
      if (sock) {
        sock.emit('leaveChat', chatId);
        const { newMsgHandler, typingHandler, onAgreementChange } = socketHandlersRef.current;
        if (newMsgHandler) sock.off('newMessage', newMsgHandler);
        if (typingHandler) sock.off('userTyping', typingHandler);
        if (onAgreementChange) {
          sock.off('offerAgreedSingle', onAgreementChange);
          sock.off('offerUpdated', onAgreementChange);
          sock.off('offerDisagreed', onAgreementChange);
          sock.off('proposalAgreed', onAgreementChange);
          sock.off('proposalDisagreed', onAgreementChange);
          sock.off('chatBlocked', onAgreementChange);
        }
      }
    };
  }, [chatId]);

  async function loadChat() {
    try {
      const data = await api('/chat/' + chatId);
      setChat(data);
      setMessages(data.messages || []);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {console.warn(e);}
  }

  async function setupSocket() {
    const sock = await connectSocket();
    if (!sock) return;
    sock.emit('joinChat', chatId);

    const newMsgHandler = (msg) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
      if (msg.fromId && msg.fromId !== user?.id) {
        api(`/chat/${chatId}/read`, { method: 'POST' }).catch(() => {});
      }
    };

    const typingHandler = ({ userId, isTyping }) => {
      if (userId !== user?.id) setOtherTyping(isTyping);
    };

    const onAgreementChange = () => loadChat();

    socketHandlersRef.current = { newMsgHandler, typingHandler, onAgreementChange };

    sock.on('newMessage', newMsgHandler);
    sock.on('userTyping', typingHandler);
    sock.on('offerAgreedSingle', onAgreementChange);
    sock.on('offerUpdated', onAgreementChange);
    sock.on('offerDisagreed', onAgreementChange);
    sock.on('proposalAgreed', onAgreementChange);
    sock.on('proposalDisagreed', onAgreementChange);
    sock.on('chatBlocked', onAgreementChange);
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
        setMessages((prev) => [...prev, msg]);
        setText('');
      } catch (e) {Alert.alert(tr("error"), e.error || tr("screens_chatscreen_text_ws73p2"));} finally
      {setSending(false);}
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
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {Alert.alert(tr("error"), e.error || tr("prof_upload_err"));} finally
    {setSending(false);}
  }

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return Alert.alert('', tr("screens_chatscreen_text_s466k9"));
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecDuration(0);
      recTimer.current = setInterval(() => setRecDuration((d) => d + 1), 1000);
    } catch (e) {
      console.warn('[VOICE] startRecording error:', e);
      Alert.alert(tr("error"), tr("screens_chatscreen_text_3obb8u"));
    }
  }

  async function stopRecording() {
    clearInterval(recTimer.current);
    setIsRecording(false);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      setRecDuration(0);
      if (uri) await uploadVoice(uri);
    } catch (e) {
      console.warn('[VOICE] stopRecording error:', e);
      setRecording(null);
    }
  }

  async function cancelRecording() {
    clearInterval(recTimer.current);
    setIsRecording(false);
    setRecDuration(0);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch (_) {}
      setRecording(null);
    }
  }

  async function uploadVoice(uri) {
    setSending(true);
    try {
      const form = new FormData();
      form.append('file', { uri, name: 'voice.m4a', type: 'audio/mpeg' });
      const msg = await api('/chat/' + chatId + '/upload', { method: 'POST', body: form });
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert(tr("error"), e.error || tr("screens_chatscreen_text_124i4y"));
    } finally {setSending(false);}
  }

  function formatRecDuration(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  async function handleAgreement(action) {
    if (!chat) return;
    if (action === 'disagree') {
      Alert.alert(tr("screens_chatscreen_text_1c0mmb"), tr("screens_chatscreen_text_1xunbf"),


      [
      { text: tr("cancel"), style: 'cancel' },
      { text: tr("verify_btn"), style: 'destructive', onPress: () => _doAgreement('disagree') }]

      );
      return;
    }
    _doAgreement(action);
  }

  async function _doAgreement(action) {
    // ✅ FIX: separate loading states — spinner on the clicked button only
    if (action === 'agree') setAgreeing(true);else
    setDisagreeing(true);
    try {
      const offerId = chat.offer?.id;
      if (offerId) {
        await api(`/offers/${offerId}/${action}`, { method: 'POST' });
      } else if (chat.proposal?.id) {
        await api(`/proposals/${chat.proposal.id}/${action}`, { method: 'POST' });
      }
      await loadChat();
      if (action === 'agree') Alert.alert(tr("screens_chatscreen_text_x5hwl3"), tr("screens_chatscreen_text_7a7imu"));
    } catch (e) {
      if (e.error?.includes('ელოდება') || e.error?.includes('ჯერ')) {
        Alert.alert('👀', e.error);
      } else {
        Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_1vf9mb"));
      }
      await loadChat();
    } finally {
      setAgreeing(false);
      setDisagreeing(false);
    }
  }

  function canAgree() {
    if (!chat || !user) return false;
    const offer = chat.offer;
    const proposal = chat.proposal;
    const isUser = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser && !offer.recipientAgreed) return true;
      if (isHandyman && offer.recipientAgreed && !offer.senderAgreed) return true;
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman && !proposal.senderAgreed) return true;
      if (isUser && proposal.senderAgreed && !proposal.recipientAgreed) return true;
    }
    return false;
  }

  function canDisagree() {
    if (!chat || !user) return false;
    const offer = chat.offer;
    const proposal = chat.proposal;
    const isUser = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser && !offer.recipientAgreed) return true;
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman && !proposal.senderAgreed) return true;
      if (isUser && proposal.senderAgreed && !proposal.recipientAgreed) return true;
    }
    return false;
  }

  function agreeContextText() {
    if (!chat || !user) return '';
    const offer = chat.offer;
    const proposal = chat.proposal;
    const isUser = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser && !offer.recipientAgreed)
      return tr("screens_chatscreen_text_hgmk1u");
      if (isHandyman && offer.recipientAgreed && !offer.senderAgreed)
      return tr("screens_chatscreen_text_1m2a00");
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman && !proposal.senderAgreed)
      return tr("screens_chatscreen_text_17qp02");
      if (isUser && proposal.senderAgreed && !proposal.recipientAgreed)
      return tr("screens_chatscreen_text_p1rfdm");
    }
    return '';
  }

  function getChatInstruction() {
    if (!chat || !user) return null;
    const offer = chat.offer;
    const proposal = chat.proposal;
    const isUser = user.id === chat.userId;
    const isHandyman = user.id === chat.handymanId;
    if (offer && offer.status === 'accepted') {
      if (isUser) return tr("screens_chatscreen_text_hgmk1u");
      if (isHandyman) return tr("chat_instr_handyman_offer");
    }
    if (proposal && proposal.status === 'accepted') {
      if (isHandyman) return tr("screens_chatscreen_text_17qp02");
      if (isUser) return tr("screens_chatscreen_text_1p2tyh");
    }
    return null;
  }

  const displayMessages = useMemo(() => {
    const instruction = getChatInstruction();
    const result = [];
    let injected = false;
    for (const m of messages) {
      if ((m.type === 'system' || !m.fromId) && m.content && (
      m.content.includes('🔧 ხელოსანი:') || m.content.includes('👤 მომხმარებელი:'))) {
        continue;
      }
      result.push(m);
      if (!injected && instruction && (m.type === 'system' || !m.fromId) && m.content && (
      m.content.includes('ჩათი გაიხსნა') || m.content.includes('შემოთავაზება გაიგზავნა'))) {
        result.push({ id: '__instruction__', type: '__instruction__', content: instruction });
        injected = true;
      }
    }
    return result;
  }, [messages, chat, user]);

  useEffect(() => {
    const completedAt = chat?.offer?.completedAt || chat?.proposal?.completedAt;
    const isAgreed = chat?.offer?.status === 'agreed' || chat?.proposal?.status === 'agreed';
    if (!isAgreed || !completedAt) {setCountdown('');clearInterval(countdownTimer.current);return;}
    function tick() {
      const diff = new Date(completedAt) - Date.now();
      if (diff <= 0) {setCountdown(tr("screens_chatscreen_text_fu7r0a"));clearInterval(countdownTimer.current);return;}
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff % 86400000 / 3600000);
      const m = Math.floor(diff % 3600000 / 60000);
      const s = Math.floor(diff % 60000 / 1000);
      if (d > 0) setCountdown(tr('countdown_dhm', { days: d, hours: h, minutes: m }));else
      if (h > 0) setCountdown(tr('countdown_hms', { hours: h, minutes: m, seconds: s }));else
      setCountdown(tr('countdown_ms', { minutes: m, seconds: s }));
    }
    tick();
    countdownTimer.current = setInterval(tick, 1000);
    return () => clearInterval(countdownTimer.current);
  }, [chat, tr]);

  const other = chat ? user?.type === 'user' ? chat.handyman : chat.user : null;
  const isFullyAgreed = chat?.offer?.status === 'agreed' || chat?.proposal?.status === 'agreed';

  // ✅ FIX #9: header tap — request detail if available, otherwise handyman profile
  function handleHeaderTap() {
    const reqId = chat?.offer?.request?.id || chat?.offer?.requestId || chat?.requestId;
    if (reqId) {
      navigation.navigate('RequestDetail', { id: reqId });
    } else if (other?.id && (other.type === 'handyman' || other.type === 'company')) {
      navigation.navigate('HandymanDetail', { id: other.id });
    }
  }

  function VoiceMessage({ uri, isMe }) {const { t: tr } = useLanguage();
    const [sound, setSound] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [pos, setPos] = useState(0);

    async function toggle() {
      if (playing) {
        await sound?.pauseAsync();
        setPlaying(false);
      } else {
        if (sound) {
          await sound.playAsync();
          setPlaying(true);
        } else {
          try {
            const { sound: s } = await Audio.Sound.createAsync(
              { uri },
              { shouldPlay: true },
              (status) => {
                if (status.isLoaded) {
                  setDuration(Math.floor((status.durationMillis || 0) / 1000));
                  setPos(Math.floor((status.positionMillis || 0) / 1000));
                  if (status.didJustFinish) {setPlaying(false);setPos(0);}
                }
              }
            );
            setSound(s);
            setPlaying(true);
          } catch (e) {Alert.alert('', tr("screens_chatscreen_text_1rsmr7"));}
        }
      }
    }

    useEffect(() => () => {sound?.unloadAsync();}, [sound]);

    const total = duration || 1;
    const progress = pos / total;
    return (
      <TouchableOpacity onPress={toggle} activeOpacity={0.8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 160 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.accent + '25', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>{playing ? '⏸' : '▶️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ height: 4, backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : C.border, borderRadius: 2, marginBottom: 4 }}>
            <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: isMe ? '#fff' : C.accent, borderRadius: 2 }} />
          </View>
          <Text style={{ color: isMe ? 'rgba(255,255,255,0.7)' : C.text2, fontSize: 11 }}>
            🎤 {playing ? `${pos}s` : duration ? `${duration}s` : tr("screens_chatscreen_text_1k7jfx")}
          </Text>
        </View>
      </TouchableOpacity>);

  }

  function renderMessage({ item: msg }) {
    if (msg.type === '__instruction__') {
      return (
        <View style={{ backgroundColor: C.accent + '14', borderRadius: 12, borderWidth: 1, borderColor: C.accent + '40', marginHorizontal: 14, marginVertical: 8, padding: 12 }}>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>💡 {msg.content}</Text>
        </View>);

    }
    const isMe = msg.fromId === user?.id;
    if (msg.type === 'system' || !msg.fromId) {
      return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <View style={{ backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, maxWidth: '85%' }}>
            <Text style={{ color: C.text2, fontSize: 12, textAlign: 'center' }}>{msg.content}</Text>
          </View>
        </View>);

    }
    return (
      <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 6, paddingHorizontal: 14 }}>
        <View style={{
          maxWidth: '78%', backgroundColor: isMe ? C.accent : C.surface,
          borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4,
          padding: 12, borderWidth: isMe ? 0 : 1, borderColor: C.border
        }}>
          {msg.type === 'image' ?
          <Image source={{ uri: msg.content }} style={{ width: 210, height: 160, borderRadius: 10 }} resizeMode="cover" /> :
          msg.type === 'video' ?
          <Text style={{ color: isMe ? '#fff' : C.text }}>{tr("chats_video")}</Text> :
          msg.type === 'voice' ?
          <VoiceMessage uri={msg.content} isMe={isMe} /> :

          <Text style={{ color: isMe ? '#fff' : C.text, fontSize: 14, lineHeight: 21 }}>{msg.content}</Text>
          }
          <Text style={{ color: isMe ? 'rgba(255,255,255,.55)' : C.text2, fontSize: 10, marginTop: 5, textAlign: 'right' }}>
            {new Date(msg.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>);

  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}>
      
      {/* ✅ FIX #9: header tap goes to RequestDetail if requestId exists */}
      {other &&
      <TouchableOpacity
        onPress={handleHeaderTap}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
        
          <Avatar user={other} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>{other.name} {other.surname || ''}</Text>
            {(chat?.offer?.request?.title || chat?.proposal?.title) &&
          <Text style={{ color: C.accent, fontSize: 11 }} numberOfLines={1}>
                📋 {chat.offer?.request?.title || chat.proposal?.title}
              </Text>
          }
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.text2} />
        </TouchableOpacity>
      }

      {isFullyAgreed &&
      <View style={{ backgroundColor: C.ok + '15', borderBottomWidth: 1, borderBottomColor: C.ok + '30', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: C.ok, fontWeight: '700', fontSize: 13 }}>{tr("screens_chatscreen_text_yi9wr7")}</Text>
          {countdown ? <Text style={{ color: C.ok, fontSize: 12, marginTop: 3 }}>{countdown}</Text> : null}
        </View>
      }
      {chat?.offer?.status === 'completed' &&
      <View style={{ backgroundColor: C.ok + '15', borderBottomWidth: 1, borderBottomColor: C.ok + '30', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: C.ok, fontWeight: '700', fontSize: 13 }}>{tr("screens_chatscreen_text_15o38r")}</Text>
        </View>
      }
      {(chat?.offer?.status === 'disagreed' || chat?.proposal?.status === 'disagreed') &&
      <View style={{ backgroundColor: C.err + '15', borderBottomWidth: 1, borderBottomColor: C.err + '30', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: C.err, fontWeight: '700', fontSize: 13 }}>{tr("screens_chatscreen_24_1ak9zj")}</Text>
        </View>
      }

      <FlatList
        ref={flatRef}
        data={displayMessages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 14 }}
        onLayout={() => flatRef.current?.scrollToEnd({ animated: false })} />
      

      {otherTyping &&
      <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
          <Text style={{ color: C.text2, fontSize: 12 }}>{tr("screens_chatscreen_text_8qedhz")}</Text>
        </View>
      }

      {canAgree() &&
      <View style={{ backgroundColor: C.surface2, borderTopWidth: 1.5, borderTopColor: C.accent + '50', padding: 12, paddingHorizontal: 14 }}>
          <Text style={{ color: C.text2, fontSize: 12, marginBottom: 10, lineHeight: 18 }}>{agreeContextText()}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => handleAgreement('agree')} disabled={agreeing || disagreeing}
          style={{ flex: 1, backgroundColor: C.ok + '20', borderRadius: 12, borderWidth: 1.5, borderColor: C.ok, padding: 13, alignItems: 'center', opacity: disagreeing ? 0.45 : 1 }}>
              {agreeing ?
            <ActivityIndicator color={C.ok} size="small" /> :
            <Text style={{ color: C.ok, fontWeight: '800', fontSize: 14 }}>{tr("screens_chatscreen_text_kl78q8")}</Text>
            }
            </TouchableOpacity>
            {canDisagree() &&
          <TouchableOpacity onPress={() => handleAgreement('disagree')} disabled={agreeing || disagreeing}
          style={{ flex: 1, backgroundColor: C.err + '15', borderRadius: 12, borderWidth: 1.5, borderColor: C.err + '60', padding: 13, alignItems: 'center', opacity: agreeing ? 0.45 : 1 }}>
                {disagreeing ?
            <ActivityIndicator color={C.err} size="small" /> :
            <Text style={{ color: C.err, fontWeight: '800', fontSize: 14 }}>{tr("screens_chatscreen_text_lms2yw")}</Text>
            }
              </TouchableOpacity>
          }
          </View>
        </View>
      }

      <View style={{ borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, opacity: isFullyAgreed ? 0.5 : 1 }}>
        {isRecording &&
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingHorizontal: 16, backgroundColor: C.err + '12', borderBottomWidth: 1, borderBottomColor: C.err + '30' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.err }} />
            <Text style={{ color: C.err, fontWeight: '700', fontSize: 13, flex: 1 }}>{tr("screens_chatscreen_text_2h0t12")}{formatRecDuration(recDuration)}</Text>
            <TouchableOpacity onPress={cancelRecording} style={{ padding: 6 }}>
              <Text style={{ color: C.text2, fontSize: 12 }}>{tr("cancel")}</Text>
            </TouchableOpacity>
          </View>
        }
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 10, paddingHorizontal: 14, gap: 10 }}>
          {!isRecording &&
          <TouchableOpacity onPress={sendImage} disabled={sending || isFullyAgreed}
          style={{ padding: 8, backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="image-outline" size={22} color={C.text2} />
            </TouchableOpacity>
          }
          <TextInput
            style={{ flex: 1, backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.text, fontSize: 14, maxHeight: 110, borderWidth: 1, borderColor: C.border }}
            placeholder={isFullyAgreed ? tr("screens_chatscreen_text_1l9asi") : isRecording ? tr("screens_chatscreen_text_2h0t12") : tr("chat_msg_placeholder")}
            placeholderTextColor={C.text2}
            value={text} onChangeText={handleTyping} multiline
            editable={!isFullyAgreed && !isRecording} />
          
          {!text.trim() && !isRecording && !isFullyAgreed &&
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={sending}
            style={{ backgroundColor: C.surface2, borderRadius: 20, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
            
              <Ionicons name="mic-outline" size={20} color={C.text2} />
            </TouchableOpacity>
          }
          {isRecording &&
          <TouchableOpacity onPress={stopRecording}
          style={{ backgroundColor: C.err, borderRadius: 20, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          }
          {text.trim() && !isRecording &&
          <TouchableOpacity onPress={sendMessage} disabled={!text.trim() || sending || isFullyAgreed}
          style={{ backgroundColor: text.trim() && !isFullyAgreed ? C.accent : C.surface2, borderRadius: 20, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: text.trim() && !isFullyAgreed ? C.accent : C.border }}>
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color={text.trim() && !isFullyAgreed ? '#fff' : C.text2} />}
            </TouchableOpacity>
          }
        </View>
      </View>
    </KeyboardAvoidingView>);

}
