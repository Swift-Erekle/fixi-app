import { useLanguage } from "../context/LanguageContext"; // src/components/HandymanCard.js
import React from 'react';
import { View, Text } from 'react-native';
import { C } from '../utils/theme';
import { Avatar, PlanBadge } from './UI'; // ✅ FIXED: PlanBadge imported
import GradientActionButton from './GradientActionButton';
import { getCategoryTheme } from '../utils/categoryTheme';

function Stars({ reviews }) {
  if (!reviews?.length) return null;
  const avg = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
  return <Text style={{ color: '#f1c40f', fontSize: 13, fontWeight: '700' }}>★ {avg.toFixed(1)} <Text style={{ color: C.text2, fontWeight: '400', fontSize: 12 }}>({reviews.length})</Text></Text>;
}

function VipBadge({ user }) {
  const now = new Date();
  const planTop = user.plan === 'top' && user.planExpiresAt && new Date(user.planExpiresAt) > now;
  const vipOk = user.vipType && user.vipType !== 'none' && user.vipExpiresAt && new Date(user.vipExpiresAt) > now;
  if (!vipOk && !planTop) return null;
  const isPlus = planTop || user.vipType === 'vipp';
  return (
    <View style={{ backgroundColor: isPlus ? '#9b59b622' : '#f1c40f22', borderRadius: 20, borderWidth: 1, borderColor: isPlus ? '#9b59b6' : '#f1c40f', paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: isPlus ? '#9b59b6' : '#f1c40f', fontSize: 11, fontWeight: '800' }}>{isPlus ? '💜 VIP+' : '⭐ VIP'}</Text>
    </View>);

}

export default function HandymanCard({ user, onPress }) {const { t: tr, tCat, tCity } = useLanguage();
  const now = new Date();
  const categoryTheme = getCategoryTheme(user.specialty);
  const accentColor = categoryTheme.fg;
  const vipOk = user.vipType && user.vipType !== 'none' && user.vipExpiresAt && new Date(user.vipExpiresAt) > now;
  const planTop = user.plan === 'top' && user.planExpiresAt && new Date(user.planExpiresAt) > now;
  const isPlus = planTop || user.vipType === 'vipp';
  const borderColor = isPlus ? '#9b59b6' : vipOk ? '#f1c40f66' : C.border;

  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor, marginBottom: 14, overflow: 'hidden' }}>
      <View style={{ padding: 16 }}>
        {/* Top row: VIP badge + Plan badge */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <VipBadge user={user} />
          {/* ✅ FIXED: PlanBadge now shown */}
          <PlanBadge user={user} />
        </View>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Avatar user={user} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 2 }} numberOfLines={1}>
              {user.name} {user.surname || ''}
            </Text>
            <Text style={{ color: accentColor, fontSize: 13, fontWeight: '600', lineHeight: 18, minHeight: 36, marginBottom: 4 }} numberOfLines={2}>
              {tCat(user.specialty) || ''}
            </Text>
            {user.city ? <Text style={{ color: C.text2, fontSize: 12, marginBottom: 4 }}>📍 {tCity(user.city)}</Text> : null}
            {user.verified ? <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>{tr("verified")}</Text> : null}
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: user.services?.length ? 10 : 0 }}>
          {(user.jobs || 0) >= 2 ?
          <>
              {user.reviewsReceived?.length ? <Stars reviews={user.reviewsReceived} /> : null}
              <Text style={{ color: C.text2, fontSize: 12 }}>💼 {user.jobs}{tr("hny_projects_label")}</Text>
            </> :

          <>
              <View style={{ backgroundColor: '#fbbf2422', borderRadius: 20, borderWidth: 1, borderColor: '#fbbf2455', paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '700' }}>{tr("components_handymancard_text_dyitsb")}</Text>
              </View>
              <View style={{ backgroundColor: '#a855f722', borderRadius: 20, borderWidth: 1, borderColor: '#a855f755', paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#a855f7', fontSize: 11, fontWeight: '700' }}>{tr("components_handymancard_text_2m73px")}</Text>
              </View>
              <View style={{ backgroundColor: '#10b98122', borderRadius: 20, borderWidth: 1, borderColor: '#10b98155', paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>{tr("components_handymancard_text_1nn86b")}</Text>
              </View>
            </>
          }
        </View>

        {/* Services */}
        {user.services?.length ?
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {user.services.slice(0, 3).map((s, i) =>
          <View key={i} style={{ backgroundColor: C.surface2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border, maxWidth: '100%' }}>
                <Text style={{ color: C.text2, fontSize: 11 }} numberOfLines={1}>{tCat(s)}</Text>
              </View>
          )}
          </View> :
        null}
      </View>

      <GradientActionButton
        onPress={onPress}
        icon="👁"
        title={tr("components_handymancard_text_pmqqy8")}
        colors={categoryTheme.gradient}
        shadowColor={categoryTheme.shadow}
      />
    </View>);

}
