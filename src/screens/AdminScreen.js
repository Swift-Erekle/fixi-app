import { useLanguage } from "../context/LanguageContext"; // src/screens/AdminScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, FlatList, TextInput, Modal, Switch } from
'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Card, Btn, Tag, Empty } from '../components/UI';
import { CATEGORIES } from '../utils/categories';

const TABS = [
{ key: 'analytics', label: '📊', adminOnly: true },
{ key: 'accounts', label: '👥', adminOnly: false },
{ key: 'requests', label: '📋', adminOnly: false },
{ key: 'support', label: '🎧', adminOnly: false },
{ key: 'staff', label: '👨‍💼', adminOnly: false }];


// ────────── Analytics tab ──────────
function AnalyticsTab() {const { t: tr } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {setData(await api('/admin/analytics'));}
    catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }, []);

  useFocusEffect(useCallback(() => {load();}, [load]));

  if (loading) return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>;
  if (!data) return <Empty icon="📊" title={tr("screens_adminscreen_text_1a86r7")} />;

  const stat = (icon, label, val, color) =>
  <View style={{ flex: 1, minWidth: 150, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text style={{ color: C.text2, fontSize: 11, fontWeight: '600' }}>{label}</Text>
      </View>
      <Text style={{ color: color || C.text, fontSize: 22, fontWeight: '900' }}>{val}</Text>
    </View>;


  return (
    <ScrollView contentContainerStyle={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stat('👤', tr("screens_adminscreen_text_fdu689"), data.users)}
        {stat('🔧', tr("tab_handymen"), data.handymen)}
        {stat('🏢', tr("home_companies"), data.companies)}
        {stat('👨‍💼', tr("profile_type_staff"), data.staff)}
        {stat('📋', tr("screens_adminscreen_text_6il2u4"), data.openReqs)}
        {stat('💬', tr("rd_offers_title"), data.totalOffers)}
        {stat('✅', tr("status_accepted"), data.acceptedOffers, C.ok)}
        {stat('⭐', tr("screens_adminscreen_text_1owo2o"), data.avgRating)}
        {stat('💜', tr("screens_adminscreen_vip_io7my3"), data.vipActive, '#9b59b6')}
        {stat('🚫', tr("screens_adminscreen_text_wqomhv"), data.blockedUsers, C.err)}
        {stat('🎧', tr("screens_adminscreen_text_bq2x4n"), data.supportPending, C.warn)}
        {stat('💰', tr("screens_adminscreen_text_71xaao"), ((data.vipRevenueTetri || 0) / 100).toFixed(0), C.ok)}
      </View>
    </ScrollView>);

}

const GEO_CITIES = [
'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი', 'თელავი',
'ახალციხე', 'ოზურგეთი', 'ქობულეთი', 'ხაშური', 'სამტრედია', 'სენაკი', 'ზესტაფონი',
'მარნეული', 'ბოლნისი', 'გარდაბანი', 'კასპი', 'ქარელი', 'ჭიათურა', 'ხონი'];


// ────────── Admin Quick Registration modal ──────────
function QuickRegModal({ visible, onClose, onSuccess }) {const { t: tr, tCat, tCity } = useLanguage();
  const [type, setType] = useState('handyman');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [city, setCity] = useState('');
  const [specs, setSpecs] = useState([]);
  const [desc, setDesc] = useState('');
  const [whatsapp, setWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);

  const isCompany = type === 'company';

  function reset() {
    setType('handyman');setName('');setSurname('');setEmail('');setPhone('');
    setPass('');setCity('');setSpecs([]);setDesc('');setWhatsapp(false);setLoading(false);setShowCities(false);
  }

  useEffect(() => {if (visible) reset();}, [visible]);

  function toggleSpec(name) {
    setSpecs((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);
  }

  async function handleSubmit() {
    if (!name.trim()) return Alert.alert(tr("error"), tr("screens_adminscreen_text_vlrihw"));
    if (!isCompany && !surname.trim()) return Alert.alert(tr("error"), tr("screens_adminscreen_text_vxolow"));
    if (!email.trim()) return Alert.alert(tr("error"), tr("screens_adminscreen_text_1cnt50"));
    if (!pass || pass.length < 8) return Alert.alert(tr("error"), tr("reg_err_short_pass"));
    if (specs.length === 0) return Alert.alert(tr("error"), tr("screens_adminscreen_text_50kd3h"));
    if (whatsapp && !phone.trim()) return Alert.alert(tr("error"), tr("screens_adminscreen_whatsapp_m0vav8"));

    setLoading(true);
    try {
      const user = await api('/admin/register-worker', {
        method: 'POST',
        body: {
          name: name.trim(), surname: isCompany ? '' : surname.trim(),
          email: email.trim().toLowerCase(), phone: phone.trim() || undefined,
          password: pass, type,
          specialty: specs[0], specialties: specs,
          city: city || undefined, desc: desc.trim() || undefined,
          whatsappEnabled: whatsapp
        }
      });
      Alert.alert(tr("screens_adminscreen_text_1rnnqv"), user.email);
      onSuccess?.();
      onClose();
    } catch (e) {
      Alert.alert(tr("error"), e.error || tr("reg_err_failed"));
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '95%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 16 }}>{tr("screens_adminscreen_text_1w1uzj")}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.text2} /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type selector */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[{ k: 'handyman', l: tr("screens_adminscreen_text_1yvknr") }, { k: 'company', l: tr("prof_company_badge") }].map((t) =>
              <TouchableOpacity key={t.k} onPress={() => setType(t.k)} style={{ flex: 1, padding: 11, borderRadius: 10, borderWidth: 1.5, borderColor: type === t.k ? C.accent : C.border, backgroundColor: type === t.k ? C.accent + '22' : C.surface2, alignItems: 'center' }}>
                  <Text style={{ color: type === t.k ? C.accent : C.text2, fontWeight: '700', fontSize: 13 }}>{t.l}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Name */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{isCompany ? tr("reg_company_name") : tr("reg_name")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, marginBottom: 12 }}
            placeholder={isCompany ? tr("reg_company_ph") : tr("reg_name_ph")} placeholderTextColor={C.text2}
            value={name} onChangeText={setName} />

            {/* Surname — handyman only */}
            {!isCompany && <>
              <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("screens_adminscreen_text_4yfili")}</Text>
              <TextInput style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, marginBottom: 12 }}
              placeholder={tr("reg_surname")} placeholderTextColor={C.text2} value={surname} onChangeText={setSurname} />
            </>}

            {/* Email */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("reg_email")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, marginBottom: 12 }}
            placeholder="worker@email.com" placeholderTextColor={C.text2} keyboardType="email-address" autoCapitalize="none"
            value={email} onChangeText={setEmail} />

            {/* Phone */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("reg_phone")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, marginBottom: 12 }}
            placeholder="+995 5XX XXX XXX" placeholderTextColor={C.text2} keyboardType="phone-pad"
            value={phone} onChangeText={setPhone} />

            {/* Password */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("screens_adminscreen_8_e6q9q8")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, marginBottom: 12 }}
            placeholder="••••••••" placeholderTextColor={C.text2} secureTextEntry
            value={pass} onChangeText={setPass} />

            {/* City picker */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("filter_city")}</Text>
            <TouchableOpacity onPress={() => setShowCities(!showCities)}
            style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: showCities ? C.accent : C.border, padding: 12, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: city ? C.text : C.text2, fontSize: 14 }}>{city ? tCity(city) : tr("screens_adminscreen_text_1fvifh")}</Text>
              <Ionicons name={showCities ? 'chevron-up' : 'chevron-down'} size={16} color={C.text2} />
            </TouchableOpacity>
            {showCities &&
            <View style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 12, maxHeight: 200 }}>
                <ScrollView nestedScrollEnabled>
                  {GEO_CITIES.map((c) =>
                <TouchableOpacity key={c} onPress={() => {setCity(c);setShowCities(false);}}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: city === c ? C.accent + '18' : 'transparent' }}>
                      <Text style={{ color: city === c ? C.accent : C.text, fontWeight: city === c ? '700' : '400' }}>{tCity(c)}</Text>
                    </TouchableOpacity>
                )}
                </ScrollView>
              </View>
            }

            {/* Specialties */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("reg_specialty")}</Text>
            {specs.length > 0 &&
            <Text style={{ color: C.accent, fontSize: 12, marginBottom: 8 }}>✓ {specs.map(tCat).join(', ')}</Text>
            }
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {CATEGORIES.map((c) => {
                const sel = specs.includes(c.name);
                return (
                  <TouchableOpacity key={c.name} onPress={() => toggleSpec(c.name)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: sel ? C.accent : C.border, backgroundColor: sel ? C.accent + '18' : C.surface2 }}>
                    <Text style={{ fontSize: 15 }}>{c.icon}</Text>
                    <Text style={{ color: sel ? C.accent : C.text, fontWeight: '700', fontSize: 12 }}>{tCat(c.name)}</Text>
                  </TouchableOpacity>);

              })}
            </View>

            {/* Description */}
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("edit_desc_label")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, height: 80, textAlignVertical: 'top', marginBottom: 12 }}
            placeholder={tr("reg_desc_placeholder")} placeholderTextColor={C.text2} multiline
            value={desc} onChangeText={setDesc} />

            {/* WhatsApp toggle */}
            <TouchableOpacity onPress={() => setWhatsapp((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: whatsapp ? '#25D366' : C.border, backgroundColor: whatsapp ? '#25D36615' : C.surface2, marginBottom: 18 }}>
              <Switch value={whatsapp} onValueChange={setWhatsapp} trackColor={{ false: C.border, true: '#25D366' }} thumbColor="#fff" />
              <View>
                <Text style={{ color: whatsapp ? '#25D366' : C.text, fontWeight: '700', fontSize: 14 }}>💬 WhatsApp</Text>
                <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>{tr("reg_whatsapp_desc")}</Text>
              </View>
            </TouchableOpacity>

            <View style={{ backgroundColor: '#10b98115', borderRadius: 12, borderWidth: 1, borderColor: '#10b98130', padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{tr("screens_adminscreen_start_3_zwz1do")}

              </Text>
            </View>

            <Btn title="⚡ Register (Admin)" onPress={handleSubmit} loading={loading} />
          </ScrollView>
        </View>
      </View>
    </Modal>);

}

// ────────── User requests sub-modal ──────────
function UserRequestsModal({ userId, userName, visible, onClose, navigation }) {const { t: tr, tCat, tCity } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    api('/admin/users/' + userId + '/requests').
    then((data) => setItems(Array.isArray(data) ? data : [])).
    catch(() => setItems([])).
    finally(() => setLoading(false));
  }, [visible, userId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 15 }}>{tr("screens_adminscreen_text_8zwpwc")}{userName}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.text2} /></TouchableOpacity>
          </View>
          {loading ?
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View> :

          <FlatList
            data={items}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
            ListEmptyComponent={<Empty icon="📋" title={tr("screens_adminscreen_text_yx1y2k")} />}
            renderItem={({ item: r }) =>
            <TouchableOpacity
              onPress={() => {onClose();navigation.navigate('RequestDetail', { id: r.id });}}
              style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 }}>
              
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ color: C.text, fontWeight: '700', fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={2}>{r.title}</Text>
                    <Tag label={r.status} color={r.status === 'open' ? C.ok : r.status === 'completed' ? C.text2 : C.warn} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {r.category ? <Tag label={tCat(r.category)} /> : null}
                    {r.city ? <Tag label={'📍 ' + tCity(r.city)} /> : null}
                    <Tag label={'💬 ' + (r._count?.offers || 0)} />
                    {r.budget ? <Tag label={'₾' + r.budget} /> : <Tag label={tr("screens_adminscreen_text_1ctwo5")} />}
                  </View>
                  <Text style={{ color: C.text2, fontSize: 11, marginTop: 6 }}>
                    📅 {new Date(r.createdAt).toLocaleDateString('ka-GE')}
                  </Text>
                </TouchableOpacity>
            } />

          }
        </View>
      </View>
    </Modal>);

}

// ────────── User offers sub-modal ──────────
function UserOffersModal({ userId, userName, visible, onClose, navigation }) {const { t: tr } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    api('/admin/users/' + userId + '/offers').
    then((data) => setItems(Array.isArray(data) ? data : [])).
    catch(() => setItems([])).
    finally(() => setLoading(false));
  }, [visible, userId]);

  const statusColor = (s) => s === 'accepted' ? C.ok : s === 'pending' ? C.warn : C.err;
  const statusLabel = (s) => s === 'accepted' ? tr("status_accepted") : s === 'pending' ? tr("prof_waiting_label") : tr("status_rejected");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 15 }}>{tr("screens_adminscreen_text_1y5l6g")}{userName}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.text2} /></TouchableOpacity>
          </View>
          {loading ?
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View> :

          <FlatList
            data={items}
            keyExtractor={(o, i) => o.id || String(i)}
            contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
            ListEmptyComponent={<Empty icon="💬" title={tr("offers_empty")} />}
            renderItem={({ item: o }) => {
              const reqTitle = o.request?.title || tr("chat_req_btn");
              const reqOwner = o.request?.user ? `${o.request.user.name || ''} ${o.request.user.surname || ''}`.trim() : '';
              return (
                <TouchableOpacity
                  onPress={() => o.request?.id && (onClose(), navigation.navigate('RequestDetail', { id: o.request.id }))}
                  style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 10 }}>
                  
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }} numberOfLines={2}>{reqTitle}</Text>
                      {reqOwner ? <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>👤 {reqOwner}</Text> : null}
                      {o.comment ? <Text style={{ color: C.text2, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{o.comment}</Text> : null}
                      <Text style={{ color: C.text2, fontSize: 11, marginTop: 4 }}>
                        📅 {new Date(o.createdAt).toLocaleDateString('ka-GE')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
                      <Text style={{ color: C.accent, fontWeight: '900', fontSize: 16 }}>₾{o.price}</Text>
                      <Tag label={statusLabel(o.status)} color={statusColor(o.status)} />
                    </View>
                  </TouchableOpacity>);

            }} />

          }
        </View>
      </View>
    </Modal>);

}

// ────────── User detail modal ──────────
function UserDetailModal({ userId, visible, onClose, onBlockToggle, navigation, isAdmin }) {const { t: tr } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [unlimitedToggling, setUnlimitedToggling] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setUser(null);
    try {setUser(await api('/admin/users/' + userId));}
    catch (e) {Alert.alert(tr("error"), e.error || tr("dash_cant_load"));onClose();} finally
    {setLoading(false);}
  }, [userId]);

  useEffect(() => {
    if (visible) {setShowRequests(false);setShowOffers(false);load();}
  }, [visible, userId]);

  async function toggleStartUnlimited(value) {
    if (unlimitedToggling || !user) return;
    setUnlimitedToggling(true);
    try {
      await api(`/admin/users/${user.id}/start-unlimited`, { method: 'PATCH', body: { startUnlimited: value } });
      setUser((prev) => ({ ...prev, startUnlimited: value }));
    } catch (e) {
      Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_1vf9mb"));
    } finally {
      setUnlimitedToggling(false);
    }
  }

  if (!visible) return null;

  const now = new Date();
  const fdate = (d) => d ? new Date(d).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const planOk = user && user.plan && user.plan !== 'start' && user.planExpiresAt && new Date(user.planExpiresAt) > now;
  const trialOk = user && user.plan === 'start' && user.trialExpiresAt && new Date(user.trialExpiresAt) > now;
  const vipOk = user && user.vipType && user.vipType !== 'none' && user.vipExpiresAt && new Date(user.vipExpiresAt) > now;
  const userName = user ? `${user.name || ''} ${user.surname || ''}`.trim() : '';

  return (
    <>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 16 }}>{tr("screens_adminscreen_text_nwq5ik")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.text2} />
            </TouchableOpacity>
          </View>

          {loading ?
            <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View> :
            user ?
            <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              {/* Avatar + name */}
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                <Avatar user={user} size={60} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontSize: 19, fontWeight: '900' }}>{user.name} {user.surname || ''}</Text>
                  <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                    {user.type}{user.specialty ? ' · ' + user.specialty : ''}
                  </Text>
                  <Text style={{ color: C.text2, fontSize: 12, marginTop: 3 }}>📧 {user.email}</Text>
                  {user.phone ? <Text style={{ color: C.text2, fontSize: 12 }}>📞 {user.phone}</Text> : null}
                  {user.city ? <Text style={{ color: C.text2, fontSize: 12 }}>📍 {user.city}</Text> : null}
                  <Text style={{ color: C.text2, fontSize: 11, marginTop: 4 }}>
                    🗓️ {fdate(user.createdAt)} · {user.emailVerified ? tr("profile_verif") : tr("screens_adminscreen_text_1izjt4")}
                  </Text>
                  {user.blocked ? <Text style={{ color: C.err, fontSize: 12, marginTop: 4 }}>{tr("screens_adminscreen_text_pghmcq")}</Text> : null}
                </View>
              </View>

              {/* Stats — requests & offers are tappable */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <TouchableOpacity onPress={() => setShowRequests(true)}
                style={{ flex: 1, minWidth: 70, backgroundColor: C.accent + '18', borderRadius: 12, borderWidth: 1.5, borderColor: C.accent + '55', padding: 10, alignItems: 'center' }}>
                  <Text style={{ color: C.accent, fontSize: 18, fontWeight: '900' }}>{user._count?.requests || 0}</Text>
                  <Text style={{ color: C.accent, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{tr("screens_adminscreen_text_1t8o8t")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOffers(true)}
                style={{ flex: 1, minWidth: 70, backgroundColor: '#3b82f618', borderRadius: 12, borderWidth: 1.5, borderColor: '#3b82f655', padding: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#3b82f6', fontSize: 18, fontWeight: '900' }}>{user._count?.offers || 0}</Text>
                  <Text style={{ color: '#3b82f6', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{tr("screens_adminscreen_text_1hozwq")}</Text>
                </TouchableOpacity>
                {[
                { label: tr("jobs"), val: user.jobs || 0 },
                { label: tr("reviews"), val: user._count?.reviewsReceived || 0 }].
                map((s) =>
                <View key={s.label} style={{ flex: 1, minWidth: 70, backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>{s.val}</Text>
                    <Text style={{ color: C.text2, fontSize: 10, marginTop: 2 }}>{s.label}</Text>
                  </View>
                )}
              </View>

              {/* Plan/VIP info (workers only) */}
              {(user.type === 'handyman' || user.type === 'company') &&
              <View style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 }}>
                  <Text style={{ color: C.text2, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{tr("screens_adminscreen_text_9k89bs")}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <View style={{ flex: 1, minWidth: 120 }}>
                      <Text style={{ color: C.text2, fontSize: 12 }}>{tr("screens_adminscreen_text_1ch9t1")}</Text>
                      <Text style={{ color: user.plan === 'top' ? '#f1c40f' : user.plan === 'pro' ? '#3498db' : C.text2, fontWeight: '700', fontSize: 13 }}>
                        {user.plan === 'top' ? '🔝 TOP' : user.plan === 'pro' ? '⚡ Pro' : '🆓 Start'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 120 }}>
                      <Text style={{ color: C.text2, fontSize: 12 }}>{tr("screens_adminscreen_text_17w04y")}</Text>
                      <Text style={{ color: planOk ? C.ok : trialOk ? '#2ecc71' : C.text2, fontWeight: '700', fontSize: 13 }}>
                        {planOk ? tr("screens_adminscreen_text_z1ddfm") : trialOk ? '🆓 Trial' : '—'}
                      </Text>
                    </View>
                    {user.planExpiresAt ?
                  <View style={{ flex: 1, minWidth: 120 }}>
                        <Text style={{ color: C.text2, fontSize: 12 }}>{tr("screens_adminscreen_text_v3rmgj")}</Text>
                        <Text style={{ color: C.text, fontWeight: '600', fontSize: 13 }}>{fdate(user.planExpiresAt)}</Text>
                      </View> :
                  null}
                  </View>
                  {vipOk ?
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text2, fontSize: 12 }}>VIP:</Text>
                        <Text style={{ color: user.vipType === 'vipp' ? '#9b59b6' : '#f39c12', fontWeight: '700', fontSize: 13 }}>
                          {user.vipType === 'vipp' ? '💜 VIP+' : '⭐ VIP'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text2, fontSize: 12 }}>{tr("screens_adminscreen_vip_nrz8n0")}</Text>
                        <Text style={{ color: C.text, fontWeight: '600', fontSize: 13 }}>{fdate(user.vipExpiresAt)}</Text>
                      </View>
                    </View> :
                null}
                  {isAdmin ?
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{tr("screens_adminscreen_start_3_fop0lo")}</Text>
                        <Text style={{ color: C.text2, fontSize: 11, marginTop: 2 }}>{tr("screens_adminscreen_5_30_trial_9zwh0t")}</Text>
                      </View>
                      <Switch
                    value={!!user.startUnlimited}
                    onValueChange={toggleStartUnlimited}
                    disabled={unlimitedToggling}
                    trackColor={{ false: C.border, true: C.accent }}
                    thumbColor={'#fff'} />
                  
                    </View> :
                null}
                </View>
              }

              {/* Payments history — VIP + Subscription combined */}
              {(user.vipPayments?.length || 0) + (user.subscriptionPayments?.length || 0) > 0 ? (() => {
                const vipPays = (user.vipPayments || []).map((p) => ({ ...p, _kind: 'vip' }));
                const subPays = (user.subscriptionPayments || []).map((p) => ({ ...p, _kind: 'sub' }));
                const allPays = [...vipPays, ...subPays].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
                const totalPaid = allPays.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
                return (
                  <View style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: C.text2, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr("screens_adminscreen_text_pfpd3h")}</Text>
                      <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>{tr("screens_adminscreen_text_1vyxip")}{(totalPaid / 100).toFixed(2)}</Text>
                    </View>
                    {allPays.map((p, i) =>
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                        <View>
                          <Text style={{ color: C.text, fontWeight: '600', fontSize: 12 }}>
                            {p._kind === 'sub' ?
                          p.plan === 'top' ? '🔝 TOP' : p.plan === 'pro' ? '⚡ Pro' : p.plan || '—' :
                          p.vipType === 'vip' ? '⭐ VIP' : p.vipType === 'vipp' ? '💜 VIP+' : p.vipType === 'bind' ? tr("screens_adminscreen_text_1iekqj") : p.vipType || '—'}
                          </Text>
                          <Text style={{ color: C.text2, fontSize: 11 }}>{fdate(p.createdAt)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: C.accent, fontWeight: '800', fontSize: 14 }}>₾{((p.amount || 0) / 100).toFixed(2)}</Text>
                          <Text style={{ color: p.status === 'paid' ? C.ok : p.status === 'pending' ? C.warn : C.err, fontSize: 11 }}>
                            {p.status === 'paid' ? '✅' : p.status === 'pending' ? '⏳' : '❌'} {p.status}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>);

              })() : null}

              {/* Actions */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity onPress={() => {onClose();onBlockToggle(user);}}
                style={{ backgroundColor: (user.blocked ? C.ok : C.err) + '18', borderRadius: 12, borderWidth: 1, borderColor: (user.blocked ? C.ok : C.err) + '66', padding: 14, alignItems: 'center' }}>
                  <Text style={{ color: user.blocked ? C.ok : C.err, fontWeight: '700', fontSize: 14 }}>{user.blocked ? tr("screens_adminscreen_text_6gcbv0") : tr("screens_adminscreen_text_19rh40")}</Text>
                </TouchableOpacity>
                {(user.type === 'handyman' || user.type === 'company') &&
                <TouchableOpacity onPress={() => {onClose();navigation.navigate('HandymanDetail', { id: user.id });}}
                style={{ backgroundColor: C.accent + '18', borderRadius: 12, borderWidth: 1, borderColor: C.accent + '66', padding: 14, alignItems: 'center' }}>
                    <Text style={{ color: C.accent, fontWeight: '700', fontSize: 14 }}>{tr("prof_view")}</Text>
                  </TouchableOpacity>
                }
              </View>
            </ScrollView> :
            null}
        </View>
      </View>
    </Modal>

    <UserRequestsModal
        userId={userId}
        userName={userName}
        visible={showRequests}
        onClose={() => setShowRequests(false)}
        navigation={navigation} />
      
    <UserOffersModal
        userId={userId}
        userName={userName}
        visible={showOffers}
        onClose={() => setShowOffers(false)}
        navigation={navigation} />
      
  </>);

}

// ────────── Accounts tab ──────────
function AccountsTab({ navigation, isAdmin }) {const { t: tr } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter === 'blocked') q.set('blocked', 'true');else
      if (filter !== 'all') q.set('type', filter);
      if (search.trim()) q.set('search', search.trim());
      setUsers(await api('/admin/users?' + q.toString()));
    } catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }, [filter, search]);

  useFocusEffect(useCallback(() => {load();}, [load]));

  async function toggleBlock(u) {
    Alert.alert(u.blocked ? tr("screens_adminscreen_text_zy6su6") : tr("screens_adminscreen_text_15skc9"), `${u.name} ${u.surname || ''}`, [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("verify_btn"), onPress: async () => {
        try {await api(`/admin/users/${u.id}/block`, { method: 'PATCH' });load();}
        catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_1vf9mb"));}
      } }]
    );
  }

  const FILTERS = [
  { k: 'all', l: tr("filter_all") }, { k: 'user', l: tr("screens_adminscreen_text_1sm6ov") }, { k: 'handyman', l: tr("hero_h1_2") },
  { k: 'company', l: tr("screens_adminscreen_text_5aicgq") }, { k: 'blocked', l: tr("screens_adminscreen_text_1jr6hb") }];


  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
          <TextInput style={{ flex: 1, color: C.text, fontSize: 13, paddingVertical: 9 }}
          placeholder={tr("home_search")} placeholderTextColor={C.text2} value={search} onChangeText={setSearch} />
          {search ?
          <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.text2} />
            </TouchableOpacity> :
          null}
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
            {FILTERS.map((f) =>
            <TouchableOpacity key={f.k} onPress={() => setFilter(f.k)}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: filter === f.k ? C.accent : C.border, backgroundColor: filter === f.k ? C.accent + '22' : C.surface }}>
                <Text style={{ color: filter === f.k ? C.accent : C.text2, fontSize: 12, fontWeight: '700' }}>{f.l}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {loading ? <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} /> :
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.accent} />}
        renderItem={({ item: u }) =>
        <TouchableOpacity
          onPress={() => {setSelectedUserId(u.id);setDetailVisible(true);}}
          activeOpacity={0.75}
          style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: u.blocked ? C.err + '55' : C.border, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          
              <Avatar user={u} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>{u.name} {u.surname || ''}</Text>
                <Text style={{ color: C.text2, fontSize: 11 }}>{u.email}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Tag label={u.type} />
                  {u.blocked && <Tag label={tr("screens_adminscreen_text_1jr6hb")} color={C.err} />}
                  {u.verified && <Tag label="✓" color={C.ok} />}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.text2} />
            </TouchableOpacity>
        }
        ListHeaderComponent={
        <Text style={{ color: C.text2, fontSize: 12, marginBottom: 8 }}>{users.length}{tr("profile_section_account")}</Text>
        }
        ListEmptyComponent={<Empty icon="👥" title={tr("screens_adminscreen_text_8zf67z")} />} />

      }

      <UserDetailModal
        userId={selectedUserId}
        visible={detailVisible}
        onClose={() => {setDetailVisible(false);setSelectedUserId(null);}}
        onBlockToggle={toggleBlock}
        navigation={navigation}
        isAdmin={isAdmin} />
      
    </View>);

}

// ────────── Requests tab ──────────
function RequestsTab({ navigation }) {const { t: tr, tCat, tCity } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {setRequests(await api('/admin/requests'));}
    catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }, []);

  useFocusEffect(useCallback(() => {load();}, [load]));

  function handleDelete(id, title) {
    Alert.alert(tr("screens_adminscreen_text_jbdoqo"), title || '', [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("screens_adminscreen_text_2slm56"), style: 'destructive', onPress: async () => {
        try {await api('/admin/requests/' + id, { method: 'DELETE' });load();}
        catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_166fhi"));}
      } }]
    );
  }

  if (loading) return <ActivityIndicator color={C.accent} style={{ marginTop: 30 }} />;

  return (
    <FlatList
      data={requests}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.accent} />}
      renderItem={({ item: r }) =>
      <TouchableOpacity onPress={() => navigation.navigate('RequestDetail', { id: r.id })}
      style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={1}>{r.title}</Text>
            <TouchableOpacity onPress={() => handleDelete(r.id, r.title)}
          style={{ backgroundColor: C.err + '18', borderRadius: 8, borderWidth: 1, borderColor: C.err + '55', paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: C.err, fontSize: 11, fontWeight: '700' }}>🗑</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <Tag label={tCat(r.category)} />
            {r.city && <Tag label={'📍 ' + tCity(r.city)} />}
            <Tag label={r.status} color={r.status === 'open' ? C.ok : r.status === 'completed' ? C.text2 : C.warn} />
            <Tag label={'💬 ' + (r._count?.offers || 0)} />
          </View>
          <Text style={{ color: C.text2, fontSize: 11 }}>👤 {r.user?.name} {r.user?.surname || ''}</Text>
        </TouchableOpacity>
      }
      ListEmptyComponent={<Empty icon="📋" title={tr("req_not_found")} />} />);


}

// ────────── Support tab ──────────
function SupportTab({ navigation }) {const { t: tr } = useLanguage();
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {setReqs(await api('/admin/support'));}
    catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }, []);

  useFocusEffect(useCallback(() => {load();}, [load]));

  async function setStatus(id, status) {
    try {await api(`/admin/support/${id}/status`, { method: 'PATCH', body: { status } });load();}
    catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_6tavvo"));}
  }

  if (loading) return <ActivityIndicator color={C.accent} style={{ marginTop: 30 }} />;

  return (
    <FlatList
      data={reqs}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.accent} />}
      renderItem={({ item: s }) => {
        const stCol = s.status === 'pending' ? C.warn : s.status === 'active' ? C.err : C.text2;
        return (
          <TouchableOpacity onPress={() => navigation.navigate('AdminSupportChat', { supportId: s.id, userName: `${s.user?.name || ''} ${s.user?.surname || ''}`.trim() })}
          style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>👤 {s.user?.name} {s.user?.surname || ''}</Text>
              <Tag label={s.status === 'pending' ? tr("screens_adminscreen_text_x565oq") : s.status === 'active' ? tr("screens_adminscreen_text_1a8x15") : tr("screens_adminscreen_text_105f9g")} color={stCol} />
            </View>
            {s.lastMsg && <Text style={{ color: C.text2, fontSize: 12, marginBottom: 6 }} numberOfLines={2}>{s.lastMsg}</Text>}
            {s.status !== 'closed' &&
            <TouchableOpacity onPress={(e) => {e.stopPropagation?.();setStatus(s.id, 'closed');}}
            style={{ backgroundColor: C.err + '15', borderRadius: 8, borderWidth: 1, borderColor: C.err + '66', paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' }}>
                <Text style={{ color: C.err, fontSize: 11, fontWeight: '700' }}>{tr("screens_adminscreen_text_e44jc7")}</Text>
              </TouchableOpacity>
            }
          </TouchableOpacity>);

      }}
      ListEmptyComponent={<Empty icon="🎧" title={tr("screens_adminscreen_text_ldmrdv")} />} />);


}

// ────────── Staff tab ──────────
function StaffTab({ isAdmin }) {const { t: tr } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {setStaff(await api('/admin/users?type=staff'));}
    catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }, []);

  useFocusEffect(useCallback(() => {load();}, [load]));

  async function createStaff() {
    if (!form.name || !form.email || !form.password) return Alert.alert('', tr("login_err_fill"));
    if (form.password.length < 8) return Alert.alert('', tr("reg_err_short_pass"));
    try {
      await api('/admin/staff', { method: 'POST', body: form });
      Alert.alert('✅', tr("screens_adminscreen_text_1hzufa"));
      setShowCreate(false);setForm({ name: '', email: '', phone: '', password: '' });
      load();
    } catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_1vf9mb"));}
  }

  async function deleteStaff(id, name) {
    Alert.alert(tr("screens_adminscreen_text_oijfz6"), name, [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("rd_delete_btn"), style: 'destructive', onPress: async () => {
        try {await api(`/admin/users/${id}`, { method: 'DELETE' });load();}
        catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_6tavvo"));}
      } }]
    );
  }

  return (
    <View style={{ flex: 1, padding: 14 }}>
      {isAdmin &&
      <Btn title={tr("screens_adminscreen_text_1745tp")} onPress={() => setShowCreate(true)} small style={{ marginBottom: 10 }} />
      }

      {loading ? <ActivityIndicator color={C.accent} /> :
      <FlatList
        data={staff}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item: s }) =>
        <View style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 12 }}>
              <Avatar user={s} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{s.name} {s.surname || ''}</Text>
                <Text style={{ color: C.text2, fontSize: 11 }}>{s.email}</Text>
                {s.phone && <Text style={{ color: C.text2, fontSize: 11 }}>📞 {s.phone}</Text>}
              </View>
              {isAdmin &&
          <TouchableOpacity onPress={() => deleteStaff(s.id, s.name)}
          style={{ backgroundColor: C.err + '18', borderRadius: 8, borderWidth: 1, borderColor: C.err + '66', paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'center' }}>
                  <Text style={{ color: C.err, fontSize: 11, fontWeight: '700' }}>{tr("rd_delete_btn")}</Text>
                </TouchableOpacity>
          }
            </View>
        }
        ListEmptyComponent={<Empty icon="👨‍💼" title={tr("screens_adminscreen_text_4khlks")} />} />

      }

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: C.surface, borderRadius: 24, padding: 22, margin: 14 }}>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '900', marginBottom: 16 }}>{tr("screens_adminscreen_text_1745tp")}</Text>
            {[
            { k: 'name', p: tr("reg_name") },
            { k: 'email', p: tr("reg_email") },
            { k: 'phone', p: tr("reg_phone") },
            { k: 'password', p: tr("screens_adminscreen_8_16srwq"), secure: true }].
            map((f) =>
            <TextInput key={f.k}
            style={{ backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 14, marginBottom: 10 }}
            placeholder={f.p} placeholderTextColor={C.text2}
            value={form[f.k]} onChangeText={(v) => setForm({ ...form, [f.k]: v })}
            secureTextEntry={f.secure} autoCapitalize="none" />

            )}
            <Btn title={tr("screens_adminscreen_text_1n4vkm")} onPress={createStaff} />
            <TouchableOpacity onPress={() => setShowCreate(false)} style={{ padding: 12, alignItems: 'center', marginTop: 6 }}>
              <Text style={{ color: C.text2 }}>{tr("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>);

}

// ────────── Main ──────────
export default function AdminScreen({ navigation }) {const { t: tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState('accounts');
  const [quickRegVisible, setQuickRegVisible] = useState(false);

  if (!user || user.type !== 'admin' && user.type !== 'staff') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 52, marginBottom: 14 }}>🔒</Text>
        <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }}>{tr("screens_adminscreen_text_13kmzc")}</Text>
        <Text style={{ color: C.text2, fontSize: 13, marginTop: 8, textAlign: 'center' }}>{tr("screens_adminscreen_text_lmv1rx")}</Text>
      </View>);

  }

  const isAdmin = user.type === 'admin';
  const visibleTabs = TABS.filter((t) => isAdmin || !t.adminOnly);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{tr("screens_adminscreen_text_1q8f3g")}</Text>
          <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>{isAdmin ? tr("tab_admin") : tr("profile_type_staff")}</Text>
        </View>
        <TouchableOpacity onPress={() => setQuickRegVisible(true)}
        style={{ backgroundColor: C.accent + '22', borderRadius: 10, borderWidth: 1.5, borderColor: C.accent + '66', paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: C.accent, fontWeight: '800', fontSize: 13 }}>{tr("screens_adminscreen_text_dmgmbj")}</Text>
        </TouchableOpacity>
      </View>

      <QuickRegModal
        visible={quickRegVisible}
        onClose={() => setQuickRegVisible(false)}
        onSuccess={() => {}} />
      

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border, gap: 6 }}>
        {visibleTabs.map((t) =>
        <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
        style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: tab === t.key ? C.accent : C.border, backgroundColor: tab === t.key ? C.accent + '22' : C.surface, alignItems: 'center' }}>
            <Text style={{ fontSize: 18 }}>{t.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === 'analytics' && isAdmin && <AnalyticsTab />}
        {tab === 'accounts' && <AccountsTab navigation={navigation} isAdmin={isAdmin} />}
        {tab === 'requests' && <RequestsTab navigation={navigation} />}
        {tab === 'support' && <SupportTab navigation={navigation} />}
        {tab === 'staff' && <StaffTab isAdmin={isAdmin} />}
      </View>
    </View>);

}
