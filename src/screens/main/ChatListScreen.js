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

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try { setChats(await api('/chat/mine')); }
    catch (e) { console.warn(e); }
    finally { setRefreshing(false); }
  }

  // Smart focus refresh: update chat data (unread counts, previews) WITHOUT
  // reshuffling the list. Sort order is managed by the socket handler.
  // Full reload only happens on initial mount or pull-to-refresh.
  async function softRefresh() {
    try {
      const fresh = await api('/chat/mine');
      setChats(prev => {
        // Initial load — no local state yet
        if (prev.length === 0) return fresh;

        const freshById = Object.fromEntries(fresh.map(c => [c.id, c]));

        // Update each existing chat with fresh server data but KEEP local order
        const updated = prev
          .filter(c => freshById[c.id])           // remove deleted chats
          .map(c => ({
            ...freshById[c.id],
            // Keep local updatedAt if socket already moved it higher
            updatedAt: c.updatedAt > freshById[c.id].updatedAt
              ? c.updatedAt
              : freshById[c.id].updatedAt,
            messages: c.messages?.length ? c.messages : freshById[c.id].messages,
          }));

        // Append truly new chats (e.g. new offer accepted while away)
        const existingIds = new Set(prev.map(c => c.id));
        const brandNew = fresh.filter(c => !existingIds.has(c.id));
        if (brandNew.length > 0) {
          return [...updated, ...brandNew]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        return updated; // order unchanged
      });
    } catch (e) { console.warn(e); }
  }

  // On initial mount: full load
  useEffect(() => { load(); }, []);

  // On every focus (returning from a chat): soft refresh — no reorder
  useFocusEffect(useCallback(() => { softRefresh(); }, []));
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const handler = (msg) => {
      setChats(prev => {
        const idx = prev.findIndex(c => c.id === msg.chatId);
        if (idx === -1) return prev;

        // newMessage only fires when a real message is created —
        // just opening a chat does NOT trigger this event.
        // So we can safely always re-sort here (own + others' messages).
        // This gives WhatsApp/Messenger/Viber behavior:
        //   • send or receive → chat goes to top ✅
        //   • open chat, read, come back → position unchanged ✅
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
    sock.on('newMessage', handler);
    return () => sock.off('newMessage', handler);
  }, [user]);

  function getOther(chat) {
    if (!user) return null;
    return user.type === 'user' ? chat.handyman : chat.user;
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
                {item.offer?.request && <Text style={{ color:C.accent, fontSize:11, marginBottom:2 }} numberOfLines={1}>📋 {item.offer.request.title}</Text>}
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
