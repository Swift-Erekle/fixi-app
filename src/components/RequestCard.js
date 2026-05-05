import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CAT_COLORS = { 'ელექტრიკოსი':'#8b5cf6','სანტექნიკი':'#3b82f6','კონდიციონერი':'#10b981','მხატვარი':'#f59e0b','დურგალი':'#ef4444','ინტერნეტი':'#06b6d4','სხვა':'#6b7280' };
const CAT_ICONS  = { 'ელექტრიკოსი':'⚡','სანტექნიკი':'🔧','კონდიციონერი':'❄️','მხატვარი':'🎨','დურგალი':'🪚','ინტერნეტი':'🌐','სხვა':'🛠️','მშენებელი':'🏗️','მებაღე':'🌿','ტექნიკოსი':'💻','სახლი':'🏠','ფილების':'🪟','შემდუღებელი':'🔩','მეკარე':'🔑' };
function getCatColor(c) { for (const [k,v] of Object.entries(CAT_COLORS)) if (c?.toLowerCase().includes(k.toLowerCase())) return v; return C.accent; }
function getCatIcon(c)  { for (const [k,v] of Object.entries(CAT_ICONS))  if (c?.toLowerCase().includes(k.toLowerCase())) return v; return '📋'; }

function Badge({ color, label }) {
  return (
    <View style={{ backgroundColor: color + '25', borderRadius: 10, borderWidth: 1, borderColor: color + '60', paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export default function RequestCard({ request, onPress }) {
  const { user } = useAuth();
  const [fav, setFav]           = useState(request.isFavorite || false);
  const [toggling, setToggling] = useState(false);
  const color    = getCatColor(request.category);
  const catIcon  = getCatIcon(request.category);
  const ageMs    = request.createdAt ? Date.now() - new Date(request.createdAt).getTime() : Infinity;
  const isNew    = ageMs < 24 * 3600000;
  const isWaiting = ageMs > 48 * 3600000 && !(request._count?.offers > 0) && !(request.offers?.length > 0);
  const isUrgent  = request.urgency === 'urgent';
  const isWorker = user?.type === 'handyman' || user?.type === 'company';
  const offerCount = request._count?.offers || 0;

  const mediaArr = Array.isArray(request.media)
    ? request.media
    : (request.media ? (() => { try { return JSON.parse(request.media); } catch { return []; } })() : []);
  const firstImage = mediaArr[0] ? (typeof mediaArr[0] === 'string' ? mediaArr[0] : mediaArr[0]?.url) : null;

  async function toggleFav() {
    if (!user) { Alert.alert('', 'შესვლა საჭიროა'); return; }
    if (!isWorker || toggling) return;
    setToggling(true);
    const next = !fav;
    setFav(next);
    try { await api(`/requests/${request.id}/favorite`, { method: 'POST' }); }
    catch { setFav(!next); }
    finally { setToggling(false); }
  }

  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: 'hidden' }}>

      {/* ── Body: image left + content right ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={{ flexDirection: 'row', padding: 12, gap: 12 }}>

        {/* Left: image or emoji placeholder */}
        <View style={{ width: 105, height: 105, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={{ width: 105, height: 105 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 105, height: 105, backgroundColor: color + '20', borderWidth: 1.5, borderColor: color + '45', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 42 }}>{catIcon}</Text>
            </View>
          )}
          {/* Category label overlaid on image */}
          <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.62)', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>{request.category || ''}</Text>
          </View>
        </View>

        {/* Right: content */}
        <View style={{ flex: 1, minWidth: 0 }}>

          {/* Badges row + heart */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 5, flexWrap: 'wrap' }}>
            {isNew     && <Badge color="#10b981" label="✨ ახალი" />}
            {isUrgent  && <Badge color={C.err}   label="⚡ საჩქარო" />}
            {!isNew && !isUrgent && isWaiting && <Badge color="#f59e0b" label="⏳ ახლოს" />}
            <View style={{ flex: 1 }} />
            {isWorker && (
              <TouchableOpacity onPress={toggleFav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={toggling}>
                <Text style={{ fontSize: 19, color: fav ? C.err : C.text2 }}>{fav ? '♥' : '♡'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', lineHeight: 20, marginBottom: 6 }} numberOfLines={2}>{request.title}</Text>

          {/* Meta: city + price + offers */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {request.city ? <Text style={{ color: C.text2, fontSize: 12 }}>📍 {request.city}</Text> : null}
            {request.budget === 0
              ? <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>💬 შეთ.</Text>
              : request.budget > 0
                ? <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '900' }}>₾{request.budget}</Text>
                : null
            }
            <Text style={{ color: C.text2, fontSize: 12 }}>💬 {offerCount} შეთ.</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Full-width action button ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}
        style={{ backgroundColor: color + '22', borderTopWidth: 1, borderTopColor: color + '44', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Text style={{ color, fontWeight: '700', fontSize: 14 }}>დეტალურად ნახვა →</Text>
      </TouchableOpacity>
    </View>
  );
}
