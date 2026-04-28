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
    // Mark as read
    if (!n.read) {
      api('/notifications/read', { method:'POST', body:{ id:n.id } }).catch(() => {});
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read:true } : x));
    }
    // Navigate
    if (n.link) {
      const m = n.link.match(/[?&](chat|user|req)=([^&]+)/);
      if (m) {
        const [_, k, v] = m;
        if (k === 'chat')  navigation.navigate('Chat', { chatId:v, title:'ჩათი' });
        if (k === 'user')  navigation.navigate('HandymanDetail', { id:v });
        if (k === 'req')   navigation.navigate('RequestDetail',  { id:v });
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
