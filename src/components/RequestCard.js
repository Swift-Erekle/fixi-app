import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CAT_COLORS = { 'ელექტრიკოსი':'#8b5cf6','სანტექნიკი':'#3b82f6','კონდიციონერი':'#10b981','მხატვარი':'#f59e0b','დურგალი':'#ef4444','ინტერნეტი':'#06b6d4','სხვა':'#6b7280' };
const CAT_ICONS  = { 'ელექტრიკოსი':'⚡','სანტექნიკი':'🔧','კონდიციონერი':'❄','მხატვარი':'🎨','დურგალი':'🪚','ინტერნეტი':'🌐','სხვა':'🛠' };
function getCatColor(c) { for (const [k,v] of Object.entries(CAT_COLORS)) if (c?.toLowerCase().includes(k.toLowerCase())) return v; return C.accent; }
function getCatIcon(c)  { for (const [k,v] of Object.entries(CAT_ICONS))  if (c?.toLowerCase().includes(k.toLowerCase())) return v; return '📋'; }

export default function RequestCard({ request, onPress }) {
  const { user } = useAuth();
  const [fav, setFav]           = useState(request.isFavorite || false);
  const [toggling, setToggling] = useState(false);
  const color    = getCatColor(request.category);
  const catIcon  = getCatIcon(request.category);
  const isNew    = request.createdAt && Date.now() - new Date(request.createdAt).getTime() < 48 * 3600000;
  const isWorker = user?.type === 'handyman' || user?.type === 'company';

  async function toggleFav(e) {
    if (!user) { Alert.alert('', 'შესვლა საჭიროა'); return; }
    if (!isWorker || toggling) return;
    setToggling(true);
    const next = !fav;
    setFav(next);
    try { await api(`/requests/${request.id}/favorite`, { method: 'POST' }); }
    catch { setFav(!next); }
    finally { setToggling(false); }
  }

  const budgetDisplay = request.budget === 0
    ? <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700' }}>💬 შეთანხმებით</Text>
    : request.budget > 0
      ? <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '700' }}>💰 {request.budget}₾</Text>
      : null;

  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: 'hidden' }}>
      <View style={{ padding: 16 }}>

        {/* Header row: category + heart */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              backgroundColor: color + '20', borderRadius: 20,
              borderWidth: 1, borderColor: color + '50',
              paddingHorizontal: 10, paddingVertical: 5,
              flexDirection: 'row', alignItems: 'center', gap: 4,
              flexShrink: 1,
            }}>
              <Text style={{ fontSize: 12 }}>{catIcon}</Text>
              <Text style={{ color, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{request.category || ''}</Text>
            </View>
            {isNew && (
              <View style={{ backgroundColor: '#10b98122', borderRadius: 20, borderWidth: 1, borderColor: '#10b98155', paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>ახალი</Text>
              </View>
            )}
          </View>
          {isWorker ? (
            <TouchableOpacity onPress={toggleFav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={toggling}>
              <Text style={{ fontSize: 20, color: fav ? C.err : C.text2 }}>{fav ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Title */}
        <Text style={{ color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 10, lineHeight: 22 }}>{request.title}</Text>

        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {request.city && <Text style={{ color: C.text2, fontSize: 13 }}>📍 {request.city}</Text>}
          {budgetDisplay}
          <Text style={{ color: C.text2, fontSize: 13 }}>💬 {request._count?.offers || 0} შეთ.</Text>
          {request.urgency === 'urgent' && <Text style={{ color: C.err, fontSize: 12, fontWeight: '700' }}>🚨 გადაუდ.</Text>}
        </View>
      </View>

      <TouchableOpacity onPress={onPress} activeOpacity={0.85}
        style={{ backgroundColor: color + '22', borderTopWidth: 1, borderTopColor: color + '44', padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Text style={{ color, fontWeight: '700', fontSize: 14 }}>დეტალურად ნახვა →</Text>
      </TouchableOpacity>
    </View>
  );
}
