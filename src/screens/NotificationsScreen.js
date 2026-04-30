// src/screens/NotificationsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { getSocket } from '../utils/socket';
import { C } from '../utils/theme';
import { Empty } from '../components/UI';

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)    return 'ახლახანს';
  if (diff < 3600)  return Math.floor(diff/60) + ' წთ.';
  if (diff < 86400) return Math.floor(diff/3600) + ' სთ.';
  if (diff < 604800) return Math.floor(diff/86400) + ' დღ.';
  return new Date(d).toLocaleDateString('ka-GE');
}

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api('/notifications');
      setItems(res.notifications || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Auto-mark all as read on open
    api('/notifications/read', { method:'POST', body:{} }).catch(() => {});
  }, [load]));

  // Live notifications
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const handler = notif => setItems(prev => [notif, ...prev]);
    sock.on('notification', handler);
    return () => sock.off('notification', handler);
  }, []);

  function handleTap(n) {
    if (!n.read) {
      api('/notifications/read', { method:'POST', body:{ id:n.id } }).catch(() => {});
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read:true } : x));
    }

    // Try structured data field first
    const data = typeof n.data === 'string' ? (() => { try { return JSON.parse(n.data); } catch { return null; } })() : (n.data || null);
    if (data) {
      if (data.chatId)     return navigation.navigate('Chat', { chatId: data.chatId, title: data.title || 'ჩათი' });
      if (data.requestId)  return navigation.navigate('RequestDetail', { id: data.requestId });
      if (data.handymanId) return navigation.navigate('HandymanDetail', { id: data.handymanId });
      if (data.screen === 'Chats') return navigation.navigate('Tabs', { screen: 'Chats' });
      if (data.type === 'support') return navigation.navigate('Support');
    }

    // Fall back to link string
    if (n.link) {
      // matches: ?chat=x, &chatId=x, ?req=x, ?requestId=x, ?user=x, ?handymanId=x
      const chatM  = n.link.match(/[?&](?:chat(?:Id)?)=([^&]+)/);
      const reqM   = n.link.match(/[?&](?:req(?:uest(?:Id)?)?)=([^&]+)/);
      const userM  = n.link.match(/[?&](?:user(?:Id)?|handyman(?:Id)?)=([^&]+)/);
      if (chatM) return navigation.navigate('Chat', { chatId: chatM[1], title: 'ჩათი' });
      if (reqM)  return navigation.navigate('RequestDetail', { id: reqM[1] });
      if (userM) return navigation.navigate('HandymanDetail', { id: userM[1] });
      // path-style: /chat/xxx  /request/xxx
      const pathM = n.link.match(/\/(chat|request|handyman|req)\/([a-z0-9-]+)/i);
      if (pathM) {
        const [, seg, id] = pathM;
        if (seg === 'chat')     return navigation.navigate('Chat', { chatId: id, title: 'ჩათი' });
        if (seg === 'request' || seg === 'req') return navigation.navigate('RequestDetail', { id });
        if (seg === 'handyman') return navigation.navigate('HandymanDetail', { id });
      }
    }
  }

  async function deleteNotif(id) {
    setItems(prev => prev.filter(n => n.id !== id));
    api(`/notifications/${id}`, { method:'DELETE' }).catch(() => {});
  }

  if (loading) return <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}><ActivityIndicator color={C.accent}/></View>;

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <FlatList
        data={items}
        keyExtractor={n => n.id}
        contentContainerStyle={{ padding:14, paddingBottom:20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent}/>}
        renderItem={({ item:n }) => (
          <TouchableOpacity onPress={() => handleTap(n)} activeOpacity={0.85}
            style={{
              backgroundColor: n.read ? C.surface : C.accent + '12',
              borderRadius:12, borderWidth:1,
              borderColor: n.read ? C.border : C.accent + '55',
              padding:13, marginBottom:8,
            }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <Text style={{ color:C.text, fontWeight: n.read ? '600' : '800', fontSize:14, flex:1, marginRight:8 }}>
                {n.title}
              </Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ color:C.text2, fontSize:11 }}>{timeAgo(n.createdAt)}</Text>
                <TouchableOpacity onPress={() => deleteNotif(n.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                  <Ionicons name="close" size={16} color={C.text2}/>
                </TouchableOpacity>
              </View>
            </View>
            {n.body && <Text style={{ color:C.text2, fontSize:13, lineHeight:18 }}>{n.body}</Text>}
            {!n.read && (
              <View style={{ position:'absolute', left:0, top:0, bottom:0, width:3, backgroundColor:C.accent, borderTopLeftRadius:12, borderBottomLeftRadius:12 }}/>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Empty icon="🔔" title="შეტყობინებები არ არის" subtitle="აქ გამოჩნდება ყველა აქტივობა"/>}
      />
    </View>
  );
}
