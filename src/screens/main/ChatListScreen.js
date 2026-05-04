// src/screens/main/ChatListScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Empty } from '../../components/UI';
import { getSocket } from '../../utils/socket';

export default function ChatListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadDone = React.useRef(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try { setChats(await api('/chat/mine')); }
    catch (e) { console.warn(e); }
    finally { setRefreshing(false); }
  }

  // ROOT CAUSE FIX:
  // Prisma @updatedAt auto-updates on EVERY chat.update() call — including
  // mark-as-read when a chat is opened. This means just opening a chat changes
  // its server updatedAt, so a full load() on focus would always push it to top.
  //
  // Solution: first visit → full load (server order). Every return → soft refresh
  // that updates content (unread, preview) but KEEPS local order intact.
  // Only the socket newMessage handler is allowed to change order.
  useFocusEffect(useCallback(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      load();
      return;
    }
    api('/chat/mine').then(fresh => {
      setChats(prev => {
        if (prev.length === 0) return fresh;
        const freshById = Object.fromEntries(fresh.map(c => [c.id, c]));
        const updated = prev
          .filter(c => freshById[c.id])
          .map(c => ({
            ...freshById[c.id],
            updatedAt: c.updatedAt, // keep local socket-managed order
          }));
        const existingIds = new Set(prev.map(c => c.id));
        const brandNew = fresh
          .filter(c => !existingIds.has(c.id))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return [...brandNew, ...updated];
      });
    }).catch(() => {});
  }, []));

  // ✅ FIX #3: Socket handler — if message belongs to unknown chat, fetch full list.
  // This handles: new chat created while user is on this screen (push notification edge case).
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const handler = (msg) => {
      setChats(prev => {
        const idx = prev.findIndex(c => c.id === msg.chatId);

        // ✅ NEW: unknown chat — reload full list from server
        if (idx === -1) {
          load();
          return prev;
        }

        const updated = {
          ...prev[idx],
          messages: [msg],
          updatedAt: msg.createdAt || new Date().toISOString(),
          unreadCount: msg.fromId !== user?.id
            ? (prev[idx].unreadCount || 0) + 1
            : prev[idx].unreadCount || 0,
        };
        const newList = [...prev];
        newList[idx] = updated;
        newList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return newList;
      });
    };

    // ✅ FIX: agreement events must also push the chat to top —
    // these change the chat UI (agree/disagree buttons appear) but emit
    // NO newMessage event, so without this listener the chat silently
    // drifts down while other chats receive messages.
    const agreementHandler = ({ chatId, offerId, proposalId } = {}) => {
      const id = chatId;
      setChats(prev => {
        // If we know the chatId, bump it to top with a fresh timestamp
        if (id) {
          const idx = prev.findIndex(c => c.id === id);
          if (idx !== -1) {
            const bumped = { ...prev[idx], updatedAt: new Date().toISOString() };
            const newList = [...prev];
            newList[idx] = bumped;
            newList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            return newList;
          }
        }
        // chatId unknown — fall back to full server reload
        load();
        return prev;
      });
    };

    sock.on('newMessage',       handler);
    sock.on('offerAgreedSingle', agreementHandler);
    sock.on('offerUpdated',      agreementHandler);
    sock.on('offerDisagreed',    agreementHandler);
    sock.on('proposalAgreed',    agreementHandler);
    sock.on('proposalDisagreed', agreementHandler);

    return () => {
      sock.off('newMessage',       handler);
      sock.off('offerAgreedSingle', agreementHandler);
      sock.off('offerUpdated',      agreementHandler);
      sock.off('offerDisagreed',    agreementHandler);
      sock.off('proposalAgreed',    agreementHandler);
      sock.off('proposalDisagreed', agreementHandler);
    };
  }, [user]);

  function getOther(chat) {
    if (!user) return null;
    // Use actual IDs — works for both offer chats and proposal chats
    return chat.userId === user.id ? chat.handyman : chat.user;
  }

  function formatTime(d) {
    if (!d) return '';
    const dt = new Date(d);
    const diff = Math.floor((Date.now()-dt)/86400000);
    if (diff===0) return dt.toLocaleTimeString('ka-GE',{hour:'2-digit',minute:'2-digit'});
    if (diff===1) return 'გუშინ';
    return dt.toLocaleDateString('ka-GE',{day:'numeric',month:'short'});
  }

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <View style={{ paddingHorizontal:20, paddingTop: insets.top + 16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border }}>
        <Text style={{ color:C.text, fontSize:22, fontWeight:'900' }}>💬 ჩათები</Text>
        <Text style={{ color:C.text2, fontSize:13, marginTop:2 }}>შეტყობინებები მომხმარებლებთან</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={i=>i.id}
        contentContainerStyle={{ padding:16 }}
        renderItem={({ item }) => {
          const other = getOther(item);
          const lastMsg = item.messages?.[0];
          const unread = item.unreadCount || 0;
          const preview = lastMsg?.type==='image'?'📷 ფოტო':lastMsg?.type==='video'?'🎥 ვიდეო':lastMsg?.type==='voice'?'🎤 ხმა':lastMsg?.content||'';
          return (
            <TouchableOpacity
              onPress={()=>navigation.navigate('Chat',{ chatId:item.id, title:other?`${other.name} ${other.surname||''}`.trim():'ჩათი' })}
              style={{ backgroundColor:C.surface, borderRadius:16, borderWidth:1, borderColor:unread>0?C.accent+'55':C.border, padding:14, flexDirection:'row', gap:12, alignItems:'center', marginBottom:10 }}
              activeOpacity={0.8}
            >
              <View style={{ position:'relative' }}>
                <Avatar user={other} size={50} />
                {unread>0 && (
                  <View style={{ position:'absolute', top:-4, right:-4, backgroundColor:C.accent, borderRadius:10, minWidth:18, height:18, alignItems:'center', justifyContent:'center', paddingHorizontal:3, borderWidth:2, borderColor:C.bg }}>
                    <Text style={{ color:'#fff', fontSize:10, fontWeight:'900' }}>{unread>9?'9+':unread}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:3 }}>
                  <Text style={{ color:C.text, fontWeight:unread>0?'900':'700', fontSize:15 }}>{other?.name} {other?.surname||''}</Text>
                  <Text style={{ color:C.text2, fontSize:11 }}>{formatTime(item.updatedAt)}</Text>
                </View>
                {item.offer?.request
                  ? <Text style={{ color:C.accent, fontSize:11, marginBottom:2 }} numberOfLines={1}>📋 {item.offer.request.title}</Text>
                  : item.proposal?.title
                    ? <Text style={{ color:'#a78bfa', fontSize:11, marginBottom:2 }} numberOfLines={1}>💌 {item.proposal.title}</Text>
                    : null
                }
                <Text style={{ color:unread>0?C.text:C.text2, fontSize:13, fontWeight:unread>0?'600':'400' }} numberOfLines={1}>{preview}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={C.accent} />}
        ListEmptyComponent={<Empty icon="💬" title="ჩათები არ არის" subtitle="შეთავაზების მიღების შემდეგ ჩათი გაიხსნება" />}
      />
    </View>
  );
}
