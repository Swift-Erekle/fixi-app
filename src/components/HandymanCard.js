// src/components/HandymanCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { C } from '../utils/theme';
import { Avatar, PlanBadge } from './UI'; // ✅ FIXED: PlanBadge imported

const CAT_COLORS = { 'ელექტრიკოსი':'#8b5cf6','სანტექნიკი':'#3b82f6','კონდიციონერი':'#10b981','მხატვარი':'#f59e0b','დურგალი':'#ef4444','ინტერნეტი':'#06b6d4' };
function getCatColor(s) { for (const [k,v] of Object.entries(CAT_COLORS)) if (s?.toLowerCase().includes(k.toLowerCase())) return v; return C.accent; }

function Stars({ reviews }) {
  if (!reviews?.length) return null;
  const avg = reviews.reduce((s,r)=>s+r.stars,0)/reviews.length;
  return <Text style={{ color:'#f1c40f', fontSize:13, fontWeight:'700' }}>★ {avg.toFixed(1)} <Text style={{ color:C.text2, fontWeight:'400', fontSize:12 }}>({reviews.length})</Text></Text>;
}

function VipBadge({ user }) {
  const now = new Date();
  const planTop = user.plan==='top' && user.planExpiresAt && new Date(user.planExpiresAt)>now;
  const vipOk   = user.vipType && user.vipType!=='none' && user.vipExpiresAt && new Date(user.vipExpiresAt)>now;
  if (!vipOk && !planTop) return null;
  const isPlus = planTop || user.vipType==='vipp';
  return (
    <View style={{ backgroundColor:isPlus?'#9b59b622':'#f1c40f22', borderRadius:20, borderWidth:1, borderColor:isPlus?'#9b59b6':'#f1c40f', paddingHorizontal:10, paddingVertical:4 }}>
      <Text style={{ color:isPlus?'#9b59b6':'#f1c40f', fontSize:11, fontWeight:'800' }}>{isPlus?'💜 VIP+':'⭐ VIP'}</Text>
    </View>
  );
}

export default function HandymanCard({ user, onPress }) {
  const now = new Date();
  const accentColor = getCatColor(user.specialty);
  const vipOk  = user.vipType && user.vipType!=='none' && user.vipExpiresAt && new Date(user.vipExpiresAt)>now;
  const planTop = user.plan==='top' && user.planExpiresAt && new Date(user.planExpiresAt)>now;
  const isPlus  = planTop || user.vipType==='vipp';
  const borderColor = isPlus?'#9b59b6':vipOk?'#f1c40f66':C.border;

  return (
    <View style={{ backgroundColor:C.surface, borderRadius:18, borderWidth:1, borderColor, marginBottom:14, overflow:'hidden' }}>
      <View style={{ padding:16 }}>
        {/* Top row: VIP badge + Plan badge */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <VipBadge user={user} />
          {/* ✅ FIXED: PlanBadge now shown */}
          <PlanBadge user={user} />
        </View>

        <View style={{ flexDirection:'row', gap:14 }}>
          <Avatar user={user} size={56} />
          <View style={{ flex:1 }}>
            <Text style={{ color:C.text, fontSize:16, fontWeight:'800', marginBottom:2 }}>
              {user.name} {user.surname||''}
            </Text>
            <Text style={{ color:accentColor, fontSize:13, fontWeight:'600', marginBottom:4 }}>
              {user.specialty||''}
            </Text>
            {user.city ? <Text style={{ color:C.text2, fontSize:12, marginBottom:4 }}>📍 {user.city}</Text> : null}
            {user.verified ? <Text style={{ color:'#10b981', fontSize:12, fontWeight:'600' }}>✅ ვერიფიცირებული</Text> : null}
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginTop:12, marginBottom:user.services?.length?10:0 }}>
          {user.reviewsReceived?.length ? <Stars reviews={user.reviewsReceived} /> : null}
          <Text style={{ color:C.text2, fontSize:12 }}>💼 {user.jobs||0} პროექტი</Text>
        </View>

        {/* Services */}
        {user.services?.length ? (
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 }}>
            {user.services.slice(0,3).map((s,i) => (
              <View key={i} style={{ backgroundColor:C.surface2, borderRadius:8, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:C.border }}>
                <Text style={{ color:C.text2, fontSize:11 }}>{s}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={onPress} activeOpacity={0.85}
        style={{ backgroundColor:accentColor+'22', borderTopWidth:1, borderTopColor:accentColor+'44', padding:13, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:6 }}>
        <Text style={{ fontSize:15 }}>👁</Text>
        <Text style={{ color:accentColor, fontWeight:'700', fontSize:14 }}>პროფილის ნახვა</Text>
      </TouchableOpacity>
    </View>
  );
}
