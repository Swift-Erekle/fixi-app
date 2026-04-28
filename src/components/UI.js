// src/components/UI.js
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Image, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../utils/theme';

// ── Button ────────────────────────────────────────────────────
export function Btn({ title, onPress, loading, outline, danger, style, textStyle, small, icon }) {
  const bg = danger ? C.err + '18' : outline ? 'transparent' : C.accent;
  const border = danger ? C.err : outline ? C.border : C.accent;
  const textColor = danger ? C.err : outline ? C.text : '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: bg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: border,
        paddingVertical: small ? 9 : 14,
        paddingHorizontal: small ? 14 : 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        opacity: loading ? 0.6 : 1,
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <>
            {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
            <Text style={[{ color: textColor, fontWeight: '700', fontSize: small ? 13 : 15 }, textStyle]}>{title}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ user, size = 40 }) {
  if (user?.avatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surface2 }}
      />
    );
  }
  const emoji = user?.emoji || (user?.type === 'company' ? '🏢' : user?.type === 'user' ? '👤' : '🔧');
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    }}>
      <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
    </View>
  );
}

// ── Plan Badge ────────────────────────────────────────────────
export function PlanBadge({ user, style }) {
  const now = new Date();
  const planOk = user?.plan && user.plan !== 'start' && user.planExpiresAt && new Date(user.planExpiresAt) > now;
  const vipOk  = user?.vipType && user.vipType !== 'none' && user.vipExpiresAt && new Date(user.vipExpiresAt) > now;

  let label = null, color = C.text2;
  if (user?.plan === 'top'  && planOk) { label = '🔝 TOP';  color = '#f1c40f'; }
  else if (user?.plan === 'pro' && planOk) { label = '⚡ Pro'; color = C.pro; }
  if (vipOk && user.vipType === 'vipp') { label = (label ? label + ' · ' : '') + '💜 VIP+'; color = '#9b59b6'; }
  else if (vipOk) { label = (label ? label + ' · ' : '') + '⭐ VIP'; color = '#f1c40f'; }

  if (!label) return null;
  return (
    <View style={[{
      backgroundColor: color + '22', borderRadius: 20,
      borderWidth: 1, borderColor: color + '55',
      paddingHorizontal: 9, paddingVertical: 3,
    }, style]}>
      <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

// ── Stars ─────────────────────────────────────────────────────
export function Stars({ reviews, style }) {
  if (!reviews?.length) return <Text style={[{ color: C.text2, fontSize: 12 }, style]}>—</Text>;
  const avg = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
  return (
    <Text style={[{ color: '#f1c40f', fontSize: 13, fontWeight: '700' }, style]}>
      ★ {avg.toFixed(1)} <Text style={{ color: C.text2, fontWeight: '400', fontSize: 12 }}>({reviews.length})</Text>
    </Text>
  );
}

// ── Divider ───────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: C.border, marginVertical: 12 }, style]} />;
}

// ── Empty State ───────────────────────────────────────────────
export function Empty({ icon = '📭', title, subtitle }) {
  return (
    <View style={{ alignItems: 'center', padding: 44 }}>
      <Text style={{ fontSize: 52, marginBottom: 14 }}>{icon}</Text>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>{title}</Text>
      {subtitle ? <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text> : null}
    </View>
  );
}

// ── Tag ───────────────────────────────────────────────────────
export function Tag({ label, color, bg, style }) {
  return (
    <View style={[{
      backgroundColor: bg || (color ? color + '18' : C.surface2),
      borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 4,
      borderWidth: 1,
      borderColor: color ? color + '44' : C.border,
    }, style]}>
      <Text style={{ color: color || C.text2, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Text style={{ color: C.text, fontSize: 17, fontWeight: '800' }}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Screen Header (used in tab screens) ──────────────────────
export function ScreenHeader({ title, subtitle, navigation, showBell, unread = 0 }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{title}</Text>
        {subtitle ? <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {showBell && navigation ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={{ position: 'relative', padding: 4 }}
        >
          <Ionicons name="notifications-outline" size={24} color={C.text} />
          {unread > 0 && (
            <View style={{
              position: 'absolute', top: 0, right: 0,
              backgroundColor: C.err, borderRadius: 10,
              width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Card wrapper ──────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: C.surface,
      borderRadius: 16, borderWidth: 1, borderColor: C.border,
      padding: 16, marginBottom: 12,
    }, style]}>
      {children}
    </View>
  );
}

// ── Info Row (label + value) ──────────────────────────────────
export function InfoRow({ label, value, valueColor }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border + '88' }}>
      <Text style={{ color: C.text2, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: valueColor || C.text, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

// ── Star Rating picker ────────────────────────────────────────
export function StarPicker({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={{ fontSize: 32, color: n <= value ? '#f1c40f' : C.border }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
