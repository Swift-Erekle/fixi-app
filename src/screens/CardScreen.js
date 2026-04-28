// src/screens/CardScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { C } from '../utils/theme';
import { Btn } from '../components/UI';

export default function CardScreen() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bindUrl, setBindUrl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const res = await api('/payment/cards'); setCards(res.cards || []); }
    catch (e) { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function bindNewCard() {
    try {
      const res = await api('/payment/cards/bind', { method: 'POST' });
      if (res.demo) { Alert.alert('✅ Demo', 'ბარათი დამატდა'); load(); }
      else if (res.redirectUrl) setBindUrl(res.redirectUrl);
    } catch (e) { Alert.alert('⚠️ შეცდომა', e?.error || 'ვერ შეიქმნა'); }
  }

  function onNavChange(navState) {
    const u = String(navState.url || '');
    if (u.includes('/payment-success') || u.includes('payment-ok')) {
      setBindUrl(null);
      Alert.alert('✅ ბარათი დაემატა', '0.10₾ ტრანზაქცია ავტომატურად დაბრუნდება.');
      setTimeout(load, 1500);
    } else if (u.includes('/payment-fail') || u.includes('/cancel')) { setBindUrl(null); }
  }

  async function setDefault(id) {
    try { await api(`/payment/cards/${id}/default`, { method: 'PATCH' }); load(); }
    catch (e) { Alert.alert('⚠️', e?.error || 'ვერ შესრულდა'); }
  }

  async function deleteCard(id) {
    Alert.alert('ბარათის წაშლა?', '', [{ text: 'გაუქმება', style: 'cancel' }, { text: 'წაშლა', style: 'destructive', onPress: async () => { try { await api(`/payment/cards/${id}`, { method: 'DELETE' }); load(); } catch (e) { Alert.alert('⚠️', e?.error || 'ვერ'); } } }]);
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}>

      <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 20 }}>💳 ჩემი ბარათები</Text>

      {cards.length === 0 ? (
        <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 32, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>💳</Text>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>ბარათი ჯერ არ გაქვს</Text>
          <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center' }}>დაამატე ბარათი ავტომატური გადახდებისთვის</Text>
        </View>
      ) : (
        cards.map(card => (
          <View key={card.id} style={{
            backgroundColor: C.surface, borderRadius: 18, borderWidth: 1.5,
            borderColor: card.isDefault ? C.accent : C.border, padding: 18, marginBottom: 12,
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
              {card.isDefault && (
                <View style={{ backgroundColor: C.accent + '20', borderRadius: 10, borderWidth: 1, borderColor: C.accent + '40', paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: C.accent, fontSize: 11, fontWeight: '800' }}>მთავარი</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!card.isDefault && (
                <TouchableOpacity onPress={() => setDefault(card.id)}
                  style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>⭐ მთავრად</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteCard(card.id)}
                style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.err + '50', alignItems: 'center', backgroundColor: C.err + '10' }}>
                <Text style={{ color: C.err, fontSize: 13, fontWeight: '600' }}>🗑 წაშლა</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Btn title="+ ახალი ბარათის მიბმა" onPress={bindNewCard} style={{ marginBottom: 14 }} />

      <View style={{ backgroundColor: C.surface2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ color: C.text2, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
          🔒 ბარათის მიბმისას ჩამოიჭრება 0.10₾{'\n'}რომელიც ავტომატურად დაბრუნდება
        </Text>
      </View>

      <Modal visible={!!bindUrl} animationType="slide" onRequestClose={() => setBindUrl(null)}>
        <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'ios' ? 44 : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
            <TouchableOpacity onPress={() => setBindUrl(null)} style={{ padding: 4 }}><Ionicons name="close" size={26} color={C.text} /></TouchableOpacity>            <Text style={{ color: C.text, fontWeight: '700', marginLeft: 12 }}>ბარათის მიბმა</Text>
          </View>
          {bindUrl && <WebView source={{ uri: bindUrl }} onNavigationStateChange={onNavChange} startInLoadingState />}
        </View>
      </Modal>
    </ScrollView>
  );
}
