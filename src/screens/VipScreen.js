// src/screens/VipScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';
import { Card } from '../components/UI';

const PRICES = {
  handyman:{ vip:{1:2,5:10},  vipp:{1:4,5:18}  },
  company: { vip:{1:5,5:25},  vipp:{1:10,5:50} },
};
const PLAN_PRICES = {
  handyman:{ pro:29,  top:69  },
  company: { pro:99,  top:159 },
};

function PriceCard({ icon, label, price, accent, onPress, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}
      style={{ flex:1, backgroundColor:C.surface, borderRadius:16, borderWidth:1.5, borderColor:accent+'66', padding:16, alignItems:'center', marginHorizontal:4 }}>
      <Text style={{ fontSize:26, marginBottom:8 }}>{icon}</Text>
      <Text style={{ color:accent, fontSize:22, fontWeight:'900' }}>{price}₾</Text>
      <Text style={{ color:C.text2, fontSize:12, marginTop:4, fontWeight:'600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function PlanCard({ icon, label, price, features, accent, onPress, active }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={{ backgroundColor:C.surface, borderRadius:18, borderWidth:active?2:1, borderColor:active?accent:C.border, padding:18, marginBottom:12 }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <Text style={{ fontSize:24 }}>{icon}</Text>
          <View>
            <Text style={{ color:C.text, fontWeight:'900', fontSize:18 }}>{label}</Text>
            {active && <Text style={{ color:accent, fontSize:11, fontWeight:'700' }}>● აქტიური</Text>}
          </View>
        </View>
        <View>
          <Text style={{ color:accent, fontSize:24, fontWeight:'900' }}>{price}₾</Text>
          <Text style={{ color:C.text2, fontSize:11, textAlign:'right' }}>/თვე</Text>
        </View>
      </View>
      {features.map((f,i) => (
        <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:5 }}>
          <Text style={{ color:'#10b981', fontSize:14 }}>✓</Text>
          <Text style={{ color:C.text2, fontSize:13 }}>{f}</Text>
        </View>
      ))}
      <View style={{ marginTop:12, backgroundColor:active?'#10b98115':accent+'18', borderRadius:12, padding:12, alignItems:'center', borderWidth:1, borderColor:active?'#10b98130':accent+'30' }}>
        <Text style={{ color:active?'#10b981':accent, fontWeight:'700', fontSize:14 }}>
          {active ? '✅ აქტიურია' : `გამოწერა → ${price}₾/თვე`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VipScreen() {
  const nav = useNavigation();
  const { user, refreshUser } = useAuth();
  const [busy, setBusy]             = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  if (!user) return (
    <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}>
      <Text style={{ color:C.text2 }}>საჭიროა ავტორიზაცია</Text>
    </View>
  );

  const uType  = user.type==='company' ? 'company' : 'handyman';
  const prices = PRICES[uType];
  const planPr = PLAN_PRICES[uType];
  const now    = new Date();
  const vipOk  = user.vipType && user.vipType!=='none' && user.vipExpiresAt && new Date(user.vipExpiresAt)>now;
  const planOk = user.plan && user.plan!=='start' && user.planExpiresAt && new Date(user.planExpiresAt)>now;

  // ✅ FIXED: VIP uses /payment/create-order, PLANS use /payment/subscribe
  async function buyVip(vipType, days) {
    setBusy(true);
    try {
      const res = await api('/payment/create-order', { method:'POST', body:{ vipType, days } });
      if (res.demo)          { Alert.alert('✅ demo',''); await refreshUser(); }
      else if (res.redirectUrl) setCheckoutUrl(res.redirectUrl);
      else Alert.alert('⚠️','ვერ შევქმენი გადახდა');
    } catch(e) { Alert.alert('⚠️ შეცდომა', e?.error||'ვერ შესრულდა'); }
    finally { setBusy(false); }
  }

  async function buyPlan(plan) {
    setBusy(true);
    try {
      // ✅ FIXED: correct endpoint for subscription plans
      const res = await api('/payment/subscribe', { method:'POST', body:{ plan, cardId: null } });
      if (res.demo)          { Alert.alert('✅ demo',''); await refreshUser(); }
      else if (res.redirectUrl) setCheckoutUrl(res.redirectUrl);
      else if (res.ok)       { Alert.alert('✅','ტარიფი გააქტიურდა!'); await refreshUser(); }
      else Alert.alert('⚠️','ვერ შევქმენი გადახდა');
    } catch(e) { Alert.alert('⚠️ შეცდომა', e?.error||'ვერ შესრულდა'); }
    finally { setBusy(false); }
  }

  function onNavChange(navState) {
    const u = String(navState.url||'');
    if (u.includes('/payment-success')||u.includes('payment-ok')) {
      setCheckoutUrl(null);
      Alert.alert('🎉','გადახდა წარმატებულია!');
      setTimeout(()=>refreshUser(),1500);
    } else if (u.includes('/payment-fail')||u.includes('/cancel')) {
      setCheckoutUrl(null);
    }
  }

  const proFeatures = uType==='handyman'
    ? ['ულიმიტო შეთავაზებები','მაღალი პოზიცია ძიებაში','⚡ Pro ბეჯი','ავტო-განახლება 30 დღეში']
    : ['ულიმიტო შეთავაზებები','მაღალი პოზიცია ძიებაში','⚡ Pro ბეჯი','ავტო-განახლება 30 დღეში'];
  const topFeatures = uType==='handyman'
    ? ['Pro-ს ყველა ფუნქცია','ყოველდღე ავტო VIP+','🔝 TOP ბეჯი','ავტო-განახლება 30 დღეში']
    : ['Pro-ს ყველა ფუნქცია','ყოველდღე ავტო VIP+','🏢 VIP+ კომპანიების სექცია','🔝 TOP ბეჯი'];

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:16, paddingBottom:40 }}>
      <Text style={{ color:C.text, fontSize:22, fontWeight:'900', marginBottom:4 }}>⭐ VIP & ტარიფები</Text>
      <Text style={{ color:C.text2, fontSize:13, marginBottom:20 }}>გაზარდე ხილვადობა და მიიღე მეტი შეკვეთა</Text>

      {/* Active status */}
      {(vipOk||planOk) && (
        <View style={{ backgroundColor:C.ok+'15', borderRadius:14, borderWidth:1, borderColor:C.ok+'30', padding:14, marginBottom:20, flexDirection:'row', alignItems:'center', gap:12 }}>
          <Text style={{ fontSize:24 }}>✅</Text>
          <View>
            {planOk && <Text style={{ color:C.ok, fontWeight:'800', fontSize:14 }}>{user.plan==='top'?'🔝 TOP':'⚡ Pro'} — {new Date(user.planExpiresAt).toLocaleDateString('ka-GE')}</Text>}
            {vipOk  && <Text style={{ color:'#f1c40f', fontWeight:'700', fontSize:13 }}>{user.vipType==='vipp'?'💜 VIP+':'⭐ VIP'} — {new Date(user.vipExpiresAt).toLocaleDateString('ka-GE')}</Text>}
          </View>
        </View>
      )}

      {/* VIP */}
      <Text style={{ color:C.text, fontWeight:'800', fontSize:17, marginBottom:6 }}>⭐ VIP</Text>
      <Text style={{ color:C.text2, fontSize:13, marginBottom:12 }}>სიის სათავეში ძიების შედეგებში</Text>
      <View style={{ flexDirection:'row', marginBottom:24, marginHorizontal:-4 }}>
        <PriceCard icon="⭐" label="1 დღე" price={prices.vip[1]} accent="#f1c40f" onPress={()=>buyVip('vip',1)} disabled={busy} />
        <PriceCard icon="⭐" label="5 დღე" price={prices.vip[5]} accent="#f1c40f" onPress={()=>buyVip('vip',5)} disabled={busy} />
      </View>

      {/* VIP+ */}
      <Text style={{ color:C.text, fontWeight:'800', fontSize:17, marginBottom:6 }}>💜 VIP+</Text>
      <Text style={{ color:C.text2, fontSize:13, marginBottom:12 }}>
        ყოველთვის VIP-ზე მაღლა{uType==='company'?' · კომპანიების სექცია':''}
      </Text>
      <View style={{ flexDirection:'row', marginBottom:28, marginHorizontal:-4 }}>
        <PriceCard icon="💜" label="1 დღე" price={prices.vipp[1]} accent="#9b59b6" onPress={()=>buyVip('vipp',1)} disabled={busy} />
        <PriceCard icon="💜" label="5 დღე" price={prices.vipp[5]} accent="#9b59b6" onPress={()=>buyVip('vipp',5)} disabled={busy} />
      </View>

      {/* Plans — ✅ FIXED endpoint */}
      <Text style={{ color:C.text, fontWeight:'800', fontSize:17, marginBottom:14 }}>📦 ყოველთვიური ტარიფი</Text>
      <PlanCard icon="⚡" label="Pro" price={planPr.pro} features={proFeatures} accent="#3b82f6" onPress={()=>buyPlan('pro')} active={planOk&&user.plan==='pro'} />
      <PlanCard icon="🔝" label="TOP" price={planPr.top} features={topFeatures} accent="#f1c40f" onPress={()=>buyPlan('top')} active={planOk&&user.plan==='top'} />

      <Card style={{ marginTop:8 }}>
        <Text style={{ color:C.text2, fontSize:12, lineHeight:20 }}>
          💳 გადახდა TBC Pay-ით{'\n'}
          🔒 ბარათის მონაცემები ჩვენ არ ვინახავთ{'\n'}
          ⏱ სტატუსი გააქტიურდება გადახდისთანავე{'\n'}
          🔄 ტარიფი ავტომატურად განახლდება 30 დღეში
        </Text>
      </Card>

      {busy && <View style={{ alignItems:'center', marginTop:20 }}><ActivityIndicator color={C.accent} /></View>}

      <Modal visible={!!checkoutUrl} animationType="slide" onRequestClose={()=>setCheckoutUrl(null)}>
        <View style={{ flex:1, backgroundColor:C.bg, paddingTop:Platform.OS==='ios'?44:0 }}>
          <View style={{ flexDirection:'row', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:C.border, backgroundColor:C.surface }}>
            <TouchableOpacity onPress={()=>setCheckoutUrl(null)} style={{ padding:4 }}>
              <Ionicons name="close" size={26} color={C.text} />
            </TouchableOpacity>
            <Text style={{ color:C.text, fontWeight:'700', marginLeft:12, fontSize:16 }}>TBC Pay</Text>
          </View>
          {checkoutUrl && <WebView source={{ uri:checkoutUrl }} onNavigationStateChange={onNavChange} startInLoadingState />}
        </View>
      </Modal>
    </ScrollView>
  );
}
