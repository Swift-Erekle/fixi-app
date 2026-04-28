// src/screens/FavoritesScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';
import { C } from '../utils/theme';
import { Empty } from '../components/UI';

export default function FavoritesScreen() {
  const nav = useNavigation();
  const { user } = useAuth();
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await api('/requests/favorites')||[]); }
    catch (e) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user || user.type==='user') return (
    <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center', padding:24 }}>
      <Text style={{ fontSize:52, marginBottom:14 }}>🔒</Text>
      <Text style={{ color:C.text, fontWeight:'800', fontSize:16 }}>მხოლოდ ხელოსნებისთვის</Text>
    </View>
  );

  if (loading) return <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={C.accent}/></View>;

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <FlatList
        data={items}
        keyExtractor={i=>i.id}
        contentContainerStyle={{ padding:16, paddingBottom:20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={C.accent} />}
        ListHeaderComponent={
          <Text style={{ color:C.text, fontSize:22, fontWeight:'900', marginBottom:16 }}>🔖 შენახული მოთხოვნები</Text>
        }
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={()=>nav.navigate('RequestDetail',{id:item.id})} />
        )}
        ListEmptyComponent={
          <Empty icon="🔖" title="შენახული მოთხოვნა არ გაქვს" subtitle="შეინახე მოთხოვნები მოგვიანებით მარტივი წვდომისთვის" />
        }
      />
    </View>
  );
}
