// src/screens/main/ChatListScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Empty } from '../../components/UI';
import { getSocket } from '../../utils/socket';

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try { setChats(await api('/chat/mine')); }
    catch (e) { console.warn(e); }
    finally { setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const h = () => load(false);
    sock.on('newMessage', h);
    return () => sock.off('newMessage', h);
  }, []);

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
      <View style={{ paddingHorizontal:20, paddingTop:16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border }}>
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
