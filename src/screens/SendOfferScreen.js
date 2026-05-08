import { useLanguage } from "../context/LanguageContext"; // src/screens/SendOfferScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Btn, Card } from '../components/UI';

function Label({ t }) {
  return <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</Text>;
}

const getPresets = (tr) => [
  { label: tr('duration_1_hour'), d: 0, h: 1 },
  { label: tr('duration_3_hours'), d: 0, h: 3 },
  { label: tr('duration_1_day'), d: 1, h: 0 },
  { label: tr('duration_2_days'), d: 2, h: 0 },
  { label: tr('duration_3_days'), d: 3, h: 0 },
  { label: tr('duration_1_week'), d: 7, h: 0 },
];


export default function SendOfferScreen({ route, navigation }) {const { t: tr } = useLanguage();
  const { requestId, requestTitle } = route.params;
  const { user } = useAuth();
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const presets = getPresets(tr);

  const dMins = parseInt(days || 0) * 24 * 60 + parseInt(hours || 0) * 60;
  const dLabel = [parseInt(days || 0) > 0 ? tr('duration_days_count', { count: days }) : '', parseInt(hours || 0) > 0 ? tr('duration_hours_count', { count: hours }) : ''].filter(Boolean).join(' ');

  function applyPreset(p) {setDays(p.d > 0 ? String(p.d) : '');setHours(p.h > 0 ? String(p.h) : '');}

  async function handleSend() {
    if (!negotiable && !price) return Alert.alert(tr("error"), tr("screens_myoffersscreen_text_1yz7ja"));
    if (dMins <= 0) return Alert.alert(tr("error"), tr("screens_proposalsscreen_text_1svwb6"));

    // Client-side plan limit check
    if (user && (user.plan === 'start' || !user.plan)) {
      if (user.trialExpiresAt && new Date(user.trialExpiresAt) < new Date()) {
        Alert.alert(tr("screens_sendofferscreen_start_3_1p8if8"), tr("screens_sendofferscreen_pro_top_1nbkrj"),

        [{ text: tr("cancel"), style: 'cancel' }, { text: tr("screens_sendofferscreen_text_1gqvvo"), onPress: () => navigation.navigate('Vip') }]);
        return;
      }
      // Admin-granted unlimited mode: skip the monthly count check
      if (!user.startUnlimited) {
        try {
          const myOffers = await api('/offers/mine');
          // ✅ FIX #5: rolling 30-day window instead of calendar month
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const recentCount = (myOffers || []).filter((o) =>
          new Date(o.createdAt) >= thirtyDaysAgo
          ).length;
          if (recentCount >= 5) {
            Alert.alert(tr("screens_sendofferscreen_30_qxvle1"),
            tr('start_offer_limit_message', { count: recentCount }),
            [{ text: tr("cancel"), style: 'cancel' }, { text: tr("screens_sendofferscreen_text_1gqvvo"), onPress: () => navigation.navigate('Vip') }]);
            return;
          }
        } catch (_) {}
      }
    }

    setLoading(true);
    try {
      await api('/offers', { method: 'POST', body: {
          requestId,
          negotiable,
          price: negotiable ? 0 : parseInt(price),
          durationMinutes: dMins,
          duration: dLabel,
          comment
        } });
      Alert.alert(tr("screens_sendofferscreen_text_16ts10"), tr("screens_sendofferscreen_text_1mhbzb"), [{ text: tr("screens_changepasswordscreen_text_i1qxce"), onPress: () => navigation.goBack() }]);
    } catch (e) {
      if (e.upgradeRequired) {
        Alert.alert(tr("screens_sendofferscreen_text_1rxs9x"), e.error, [
        { text: tr("cancel"), style: 'cancel' },
        { text: tr("screens_sendofferscreen_text_1gqvvo"), onPress: () => navigation.navigate('Vip') }]
        );
      } else {Alert.alert(tr("error"), e.error || tr("screens_chatscreen_text_ws73p2"));}
    } finally {setLoading(false);}
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 6 }}>{tr("screens_sendofferscreen_text_14xp5h")}</Text>
        <Text style={{ color: C.text2, fontSize: 13, marginBottom: 20 }} numberOfLines={2}>"{requestTitle}"</Text>

        <Card>
          <Label t={tr("screens_sendofferscreen_text_1hobhm")} />
          <TextInput
            style={{ backgroundColor: negotiable ? C.surface2 + '80' : C.surface2, borderRadius: 12, borderWidth: 1, borderColor: negotiable ? C.border + '80' : C.border, padding: 13, color: negotiable ? C.text2 : C.text, fontSize: 22, fontWeight: '900', opacity: negotiable ? 0.4 : 1 }}
            placeholder="0" placeholderTextColor={C.text2}
            value={negotiable ? '' : price}
            onChangeText={setPrice}
            keyboardType="numeric"
            editable={!negotiable} />
          
          <TouchableOpacity
            onPress={() => {setNegotiable((v) => !v);if (!negotiable) setPrice('');}}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent + '18' : C.surface2 }}>
            
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {negotiable && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
            </View>
            <Text style={{ color: negotiable ? C.accent : C.text2, fontWeight: '700', fontSize: 14 }}>{tr("screens_createrequestscreen_text_1vgvue")}</Text>
          </TouchableOpacity>
        </Card>

        <Card>
          <Label t={tr("screens_handymandetailscreen_text_vr41xw")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {presets.map((p) => {
                const sel = dMins === p.d * 24 * 60 + p.h * 60;
                return (
                  <TouchableOpacity key={p.label} onPress={() => applyPreset(p)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: sel ? C.accent : C.border, backgroundColor: sel ? C.accent + '22' : C.surface2 }}>
                    <Text style={{ color: sel ? C.accent : C.text2, fontWeight: '600', fontSize: 13 }}>{p.label}</Text>
                  </TouchableOpacity>);

              })}
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>{tr("proposal_days_label")}</Text>
              <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}
              placeholder="0" placeholderTextColor={C.text2} value={days} onChangeText={setDays} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>{tr("proposal_hours_label")}</Text>
              <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}
              placeholder="0" placeholderTextColor={C.text2} value={hours} onChangeText={setHours} keyboardType="numeric" />
            </View>
          </View>
          {dLabel ? <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700', marginTop: 10 }}>⏱ {dLabel}</Text> : null}
        </Card>

        <Card>
          <Label t={tr("review_comment_label")} />
          <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14, height: 110, textAlignVertical: 'top' }}
          placeholder={tr("screens_sendofferscreen_text_1so8nh")} placeholderTextColor={C.text2} value={comment} onChangeText={setComment} multiline />
        </Card>

        {(negotiable || price) && dMins > 0 &&
        <View style={{ backgroundColor: C.accent + '15', borderRadius: 14, borderWidth: 1, borderColor: C.accent + '40', padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: C.text2, fontSize: 13 }}>{tr("screens_sendofferscreen_text_1mpu6n")}</Text>
              {negotiable ?
            <Text style={{ color: C.accent, fontSize: 16, fontWeight: '900' }}>{tr("screens_requestdetailscreen_text_zbbljz")}</Text> :
            <Text style={{ color: C.accent, fontSize: 20, fontWeight: '900' }}>₾{price}</Text>
            }
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text2, fontSize: 13 }}>{tr("screens_adminscreen_text_v3rmgj")}</Text>
              <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>⏱ {dLabel}</Text>
            </View>
          </View>
        }

        <Btn title={tr("screens_sendofferscreen_text_1bm6sv")} onPress={handleSend} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>);

}
