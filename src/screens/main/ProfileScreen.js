// src/screens/main/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Avatar, PlanBadge, Btn, Divider } from '../../components/UI';

function MenuItem({ icon, label, onPress, danger, badge }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 15, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}
    >
      <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, color: danger ? C.err : C.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      {badge ? (
        <View style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{badge}</Text>
        </View>
      ) : (
        <Text style={{ color: C.text2, fontSize: 16 }}>›</Text>
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: C.text2, fontSize: 11, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginHorizontal: 16 }}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>👤</Text>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 8 }}>{t('profile_login_title')}</Text>
        <Text style={{ color: C.text2, fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
          {t('profile_login_desc')}
        </Text>
        <Btn title={t('profile_login_btn')} onPress={() => navigation.navigate('Login')} style={{ width: '100%', marginBottom: 10 }} />
        <Btn title={t('profile_register_btn')} onPress={() => navigation.navigate('Register')} outline style={{ width: '100%' }} />
      </View>
    );
  }

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('', t('profile_photo_perm'));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const form = new FormData();
      form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
      const data = await api('/users/avatar', { method: 'POST', body: form });
      updateUser({ avatar: data.avatar });
    } catch (e) {
      Alert.alert(t('error'), e.error || t('profile_upload_err'));
    } finally { setUploading(false); }
  }

  function planLabel() {
    const now = new Date();
    if (user.plan === 'top' && user.planExpiresAt && new Date(user.planExpiresAt) > now)
      return '🔝 TOP — ' + new Date(user.planExpiresAt).toLocaleDateString('ka-GE');
    if (user.plan === 'pro' && user.planExpiresAt && new Date(user.planExpiresAt) > now)
      return '⚡ Pro — ' + new Date(user.planExpiresAt).toLocaleDateString('ka-GE');
    if (user.trialExpiresAt && new Date(user.trialExpiresAt) > now)
      return '🆓 Trial — ' + new Date(user.trialExpiresAt).toLocaleDateString('ka-GE');
    return 'Start';
  }

  const typeLabel = user.type === 'user' ? t('profile_type_user')
    : user.type === 'handyman' ? t('profile_type_handyman')
    : user.type === 'company' ? t('profile_type_company')
    : user.type === 'admin' ? t('profile_type_admin') : t('profile_type_staff');

  const isWorker = user.type === 'handyman' || user.type === 'company';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Hero section */}
      <View style={{
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
        padding: 24, paddingTop: insets.top + 24, alignItems: 'center', marginBottom: 20,
      }}>
        <TouchableOpacity onPress={pickAvatar} disabled={uploading} style={{ marginBottom: 12 }}>
          <View>
            <Avatar user={user} size={80} />
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              backgroundColor: C.accent, borderRadius: 12, padding: 5,
              borderWidth: 2, borderColor: C.bg,
            }}>
              <Text style={{ fontSize: 11 }}>✏️</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>
          {user.name} {user.surname || ''}
        </Text>
        <Text style={{ color: C.text2, fontSize: 13, marginBottom: 10 }}>{user.email}</Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <View style={{
            backgroundColor: C.surface2, borderRadius: 20, borderWidth: 1, borderColor: C.border,
            paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '600' }}>{typeLabel}</Text>
          </View>
          <PlanBadge user={user} />
          {user.verified && (
            <View style={{
              backgroundColor: '#10b98122', borderRadius: 20, borderWidth: 1, borderColor: '#10b98144',
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>{t('profile_verif')}</Text>
            </View>
          )}
        </View>

        {isWorker && (
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{user.jobs || 0}</Text>
              <Text style={{ color: C.text2, fontSize: 12 }}>{t('profile_jobs')}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: C.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{planLabel()}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Worker actions */}
      {isWorker && (
        <Section title={t('profile_section_worker')}>
          <MenuItem icon="✏️" label={t('profile_edit')} onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem icon="📤" label={t('profile_my_offers')} onPress={() => navigation.navigate('MyOffers')} />
          <MenuItem icon="⭐" label={t('profile_vip_buy')} onPress={() => navigation.navigate('Vip')} />
          <MenuItem icon="🔖" label={t('profile_saved_req')} onPress={() => navigation.navigate('Favorites')} />
        </Section>
      )}

      {/* User actions */}
      {user.type === 'user' && (
        <Section title={t('profile_section_requests')}>
          <MenuItem icon="📋" label={t('profile_my_requests')} onPress={() => navigation.navigate('MyRequests')} />
        </Section>
      )}

      {/* Admin / Staff tools */}
      {(user.type === 'admin' || user.type === 'staff') && (
        <Section title={t('profile_section_admin')}>
          <MenuItem icon="🛡️" label={t('profile_admin_panel')} onPress={() => navigation.navigate('Tabs', { screen:'Admin' })} />
        </Section>
      )}

      {/* General */}
      <Section title={t('profile_section_account')}>
        <MenuItem icon="🔔" label={t('profile_notifications')} onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="💳" label={t('profile_cards')} onPress={() => navigation.navigate('Cards')} />
        <MenuItem icon="🎧" label={t('profile_support')} onPress={() => navigation.navigate('Support')} />
        <MenuItem icon="🔑" label={t('profile_change_pass')} onPress={() => navigation.navigate('ChangePassword')} />
        <MenuItem icon="📜" label={t('legal_profile_menu')} onPress={() => navigation.navigate('Legal', { initialTab: 'terms' })} />
      </Section>

      {/* Logout */}
      <View style={{ marginHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => Alert.alert(t('profile_logout_title'), t('profile_logout_confirm'), [
            { text: t('profile_logout_cancel'), style: 'cancel' },
            { text: t('profile_logout_title'), style: 'destructive', onPress: logout },
          ])}
          style={{
            backgroundColor: C.err + '15',
            borderRadius: 14, borderWidth: 1, borderColor: C.err + '44',
            padding: 15, alignItems: 'center',
          }}
        >
          <Text style={{ color: C.err, fontWeight: '700', fontSize: 15 }}>{t('profile_logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
