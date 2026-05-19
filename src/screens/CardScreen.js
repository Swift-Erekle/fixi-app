import { useLanguage } from "../context/LanguageContext"; // src/screens/CardScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform, RefreshControl, Switch } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';
import { Btn } from '../components/UI';

export default function CardScreen() {const { t: tr } = useLanguage();
  const { user, updateUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bindUrl, setBindUrl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(!!user?.autoRenew);
  const [arLoading, setArLoading] = useState(false);

  const load = useCallback(async () => {
    try {const res = await api('/payment/cards');setCards(Array.isArray(res) ? res : res.cards || []);}
    catch (e) {} finally
    {setLoading(false);setRefreshing(false);}
  }, []);

  useFocusEffect(useCallback(() => {load();}, [load]));

  async function bindNewCard() {
    try {
      const res = await api('/payment/cards/bind', { method: 'POST' });
      if (res.redirectUrl) setBindUrl(res.redirectUrl);
    } catch (e) {Alert.alert(tr("screens_cardscreen_text_1pf8t0"), e?.error || tr("screens_cardscreen_text_jql6y8"));}
  }

  function onNavChange(navState) {
    const u = String(navState.url || '');
    if (u.includes('/payment-success')) {
      setBindUrl(null);
      Alert.alert(tr("screens_cardscreen_text_1vfd3s"), tr("screens_cardscreen_0_10_w3lomn"));
      setTimeout(load, 1500);
    } else if (u.includes('/payment-fail') || u.includes('/cancel')) {setBindUrl(null);}
  }

  async function setDefault(id) {
    try {await api(`/payment/cards/${id}/default`, { method: 'PATCH' });load();}
    catch (e) {Alert.alert('⚠️', e?.error || tr("screens_adminscreen_text_1vf9mb"));}
  }

  async function toggleAutoRenew(val) {
    setArLoading(true);
    try {
      await api('/payment/auto-renew', { method: 'PATCH', body: { autoRenew: val } });
      setAutoRenew(val);
      updateUser({ autoRenew: val });
    } catch (e) {Alert.alert('⚠️', e?.error || tr("screens_adminscreen_text_1vf9mb"));} finally
    {setArLoading(false);}
  }

  async function deleteCard(id) {
    Alert.alert(tr("screens_cardscreen_text_8m5bid"), '', [{ text: tr("cancel"), style: 'cancel' }, { text: tr("rd_delete_btn"), style: 'destructive', onPress: async () => {try {await api(`/payment/cards/${id}`, { method: 'DELETE' });load();} catch (e) {Alert.alert('⚠️', e?.error || tr("screens_adminscreen_text_6tavvo"));}} }]);
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true);load();}} tintColor={C.accent} />}>

      <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 20 }}>{tr("screens_cardscreen_text_72gxob")}</Text>

      {cards.length === 0 ?
      <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 32, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>💳</Text>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>{tr("screens_cardscreen_text_1gsozg")}</Text>
          <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center' }}>{tr("screens_cardscreen_text_ck1hes")}</Text>
        </View> :

      cards.map((card) =>
      <View key={card.id} style={{
        backgroundColor: C.surface, borderRadius: 18, borderWidth: 1.5,
        borderColor: card.isDefault ? C.accent : C.border, padding: 18, marginBottom: 12
      }}>
            {/* Card visual */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={{ width: 52, height: 36, backgroundColor: card.isDefault ? C.accent + '30' : C.surface2, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: card.isDefault ? C.accent + '50' : C.border }}>
                <Text style={{ fontSize: 20 }}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }}>{card.brand || 'Card'} •••• {card.last4}</Text>
                {card.expiry && <Text style={{ color: C.text2, fontSize: 13, marginTop: 2 }}>Exp: {card.expiry}</Text>}
              </View>
              {card.isDefault &&
          <View style={{ backgroundColor: C.accent + '20', borderRadius: 10, borderWidth: 1, borderColor: C.accent + '40', paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: C.accent, fontSize: 11, fontWeight: '800' }}>{tr("screens_cardscreen_text_xcyb0o")}</Text>
                </View>
          }
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!card.isDefault &&
          <TouchableOpacity onPress={() => setDefault(card.id)}
          style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{tr("screens_cardscreen_text_1h55wf")}</Text>
                </TouchableOpacity>
          }
              <TouchableOpacity onPress={() => deleteCard(card.id)}
          style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.err + '50', alignItems: 'center', backgroundColor: C.err + '10' }}>
                <Text style={{ color: C.err, fontSize: 13, fontWeight: '600' }}>{tr("screens_adminscreen_text_2slm56")}</Text>
              </TouchableOpacity>
            </View>
          </View>
      )
      }

      <Btn title={tr("screens_cardscreen_text_9i63pa")} onPress={bindNewCard} style={{ marginBottom: 14 }} />

      {/* Auto-renew toggle — only if user has a plan */}
      {user?.plan && user.plan !== 'start' &&
      <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: autoRenew ? C.ok + '60' : C.border, padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: C.text, fontWeight: '800', fontSize: 15 }}>{tr("screens_cardscreen_text_9d5kar")}</Text>
              <Text style={{ color: C.text2, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                {autoRenew ? tr("screens_cardscreen_1_1ap43i") : tr("screens_cardscreen_text_42t0l")

              }
              </Text>
            </View>
            {arLoading ?
          <ActivityIndicator color={C.ok} /> :
          <Switch value={autoRenew} onValueChange={toggleAutoRenew} trackColor={{ false: C.border, true: C.ok }} thumbColor="#fff" />
          }
          </View>
        </View>
      }

      <Modal visible={!!bindUrl} animationType="slide" onRequestClose={() => setBindUrl(null)}>
        <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'ios' ? 44 : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
            <TouchableOpacity onPress={() => setBindUrl(null)} style={{ padding: 4 }}><Ionicons name="close" size={26} color={C.text} /></TouchableOpacity>            <Text style={{ color: C.text, fontWeight: '700', marginLeft: 12 }}>{tr("screens_cardscreen_text_1i794i")}</Text>
          </View>
          {bindUrl && <WebView source={{ uri: bindUrl }} onNavigationStateChange={onNavChange} startInLoadingState />}
        </View>
      </Modal>
    </ScrollView>);

}
