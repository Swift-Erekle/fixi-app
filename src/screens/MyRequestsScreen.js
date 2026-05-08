import { useLanguage } from "../context/LanguageContext"; // src/screens/MyRequestsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import RequestCard from '../components/RequestCard';
import { Empty, Btn } from '../components/UI';

export default function MyRequestsScreen({ navigation }) {const { t: tr } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load(r = false) {
    if (r) setRefreshing(true);
    try {setRequests(await api('/requests/mine'));}
    catch (e) {console.warn(e);} finally
    {setRefreshing(false);}
  }

  useFocusEffect(useCallback(() => {load();}, []));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 12 }}>{tr("dash_my_reqs_tab")}</Text>
            <Btn
            title={tr("req_cta_btn")}
            onPress={() => navigation.navigate('CreateRequest')} />
          
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
        renderItem={({ item }) =>
        <RequestCard request={item} onPress={() => navigation.navigate('RequestDetail', { id: item.id })} />
        }
        ListEmptyComponent={<Empty icon="📋" title={tr("screens_myrequestsscreen_text_38ijsy")} subtitle={tr("screens_myrequestsscreen_text_zm8wyb")} />} />
      
    </View>);

}
