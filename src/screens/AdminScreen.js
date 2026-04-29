// src/screens/AdminScreen.js
// Admin / Staff dashboard for mobile — analytics, accounts, requests, support, staff
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, FlatList, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Card, Btn, Tag, Empty } from '../components/UI';

const TABS = [
  { key:'analytics', label:'📊',     adminOnly:true  },
  { key:'accounts',  label:'👥',     adminOnly:false },
  { key:'requests',  label:'📋',     adminOnly:false },
  { key:'support',   label:'🎧',     adminOnly:false },
  { key:'staff',     label:'👨‍💼',  adminOnly:false },
];

// ────────── Analytics tab ──────────
function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await api('/admin/analytics')); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={{ padding:40, alignItems:'center' }}><ActivityIndicator color={C.accent}/></View>;
  if (!data)   return <Empty icon="📊" title="ანალიტიკა ვერ ჩაიტვირთა" />;

  const stat = (icon, label, val, color) => (
    <View style={{ flex:1, minWidth:150, backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, padding:14 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
        <Text style={{ fontSize:16 }}>{icon}</Text>
        <Text style={{ color:C.text2, fontSize:11, fontWeight:'600' }}>{label}</Text>
      </View>
      <Text style={{ color:color || C.text, fontSize:22, fontWeight:'900' }}>{val}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding:14 }}>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
        {stat('👤','მომხმარებლები', data.users)}
        {stat('🔧','ხელოსნები',     data.handymen)}
        {stat('🏢','კომპანიები',    data.companies)}
        {stat('👨‍💼','სტაფი',         data.staff)}
        {stat('📋','ღია მოთხ.',      data.openReqs)}
        {stat('💬','შეთავაზებები',   data.totalOffers)}
        {stat('✅','მიღებული',        data.acceptedOffers, C.ok)}
        {stat('⭐','შეფასება საშ.',    data.avgRating)}
        {stat('💜','VIP აქტ.',         data.vipActive, '#9b59b6')}
        {stat('🚫','დაბლოკილი',        data.blockedUsers, C.err)}
        {stat('🎧','სუპ. მოლოდ.',      data.supportPending, C.warn)}
        {stat('💰','შემოს. ₾',         ((data.vipRevenueTetri || 0) / 100).toFixed(0), C.ok)}
      </View>
    </ScrollView>
  );
}

// ────────── Accounts tab ──────────
function AccountsTab({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | user | handyman | company | blocked
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter === 'blocked') q.set('blocked', 'true');
      else if (filter !== 'all') q.set('type', filter);
      if (search.trim()) q.set('search', search.trim());
      setUsers(await api('/admin/users?' + q.toString()));
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, [filter, search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleBlock(u) {
    Alert.alert(u.blocked ? 'განბლოკვა?' : 'დაბლოკვა?', `${u.name} ${u.surname || ''}`, [
      { text:'გაუქმება', style:'cancel' },
      { text:'დადასტურება', onPress: async () => {
        try { await api(`/admin/users/${u.id}/block`, { method:'PATCH' }); load(); }
        catch (e) { Alert.alert('შეცდომა', e.error || 'ვერ შესრულდა'); }
      }},
    ]);
  }

  return (
    <View style={{ flex:1, padding:14 }}>
      {/* Search */}
      <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:12, borderWidth:1, borderColor:C.border, paddingHorizontal:12, marginBottom:10 }}>
        <Text style={{ fontSize:14, marginRight:6 }}>🔍</Text>
        <TextInput style={{ flex:1, color:C.text, fontSize:13, paddingVertical:9 }}
          placeholder="ძიება..." placeholderTextColor={C.text2} value={search} onChangeText={setSearch} />
      </View>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10, maxHeight:40 }}>
        <View style={{ flexDirection:'row', gap:8 }}>
          {[
            {k:'all',l:'ყველა'},{k:'user',l:'მომხ.'},{k:'handyman',l:'ხელოსანი'},
            {k:'company',l:'კომპანია'},{k:'blocked',l:'🚫 დაბლოკ.'},
          ].map(f => (
            <TouchableOpacity key={f.k} onPress={() => setFilter(f.k)}
              style={{ paddingHorizontal:13, paddingVertical:7, borderRadius:18, borderWidth:1, borderColor:filter===f.k?C.accent:C.border, backgroundColor:filter===f.k?C.accent+'22':C.surface }}>
              <Text style={{ color:filter===f.k?C.accent:C.text2, fontSize:12, fontWeight:'600' }}>{f.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? <ActivityIndicator color={C.accent} style={{ marginTop:20 }}/> : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          contentContainerStyle={{ paddingBottom:20 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.accent}/>}
          renderItem={({ item:u }) => (
            <TouchableOpacity
              onPress={() => (u.type === 'handyman' || u.type === 'company') && navigation.navigate('HandymanDetail', { id: u.id })}
              activeOpacity={u.type === 'handyman' || u.type === 'company' ? 0.7 : 1}
              style={{ backgroundColor:C.surface, borderRadius:12, borderWidth:1, borderColor:u.blocked?C.err+'66':C.border, padding:12, marginBottom:8, flexDirection:'row', gap:12 }}
            >
              <Avatar user={u} size={42}/>
              <View style={{ flex:1 }}>
                <Text style={{ color:C.text, fontWeight:'700', fontSize:14 }}>{u.name} {u.surname || ''}</Text>
                <Text style={{ color:C.text2, fontSize:11 }}>{u.email}</Text>
                <View style={{ flexDirection:'row', gap:6, marginTop:4, flexWrap:'wrap' }}>
                  <Tag label={u.type} />
                  {u.blocked && <Tag label="🚫 დაბლ." color={C.err}/>}
                  {u.verified && <Tag label="✓" color={C.ok}/>}
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleBlock(u)}
                style={{ backgroundColor:(u.blocked?C.ok:C.err)+'18', borderRadius:10, borderWidth:1, borderColor:(u.blocked?C.ok:C.err)+'66', paddingHorizontal:10, paddingVertical:6, alignSelf:'center' }}>
                <Text style={{ color:u.blocked?C.ok:C.err, fontSize:11, fontWeight:'700' }}>{u.blocked?'განბლოკვა':'დაბლოკვა'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Empty icon="👥" title="მომხმარებელი ვერ მოიძებნა"/>}
        />
      )}
    </View>
  );
}

// ────────── Requests tab ──────────
function RequestsTab({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await api('/admin/requests')); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <ActivityIndicator color={C.accent} style={{ marginTop:30 }}/>;

  return (
    <FlatList
      data={requests}
      keyExtractor={r => r.id}
      contentContainerStyle={{ padding:14, paddingBottom:20 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.accent}/>}
      renderItem={({ item:r }) => (
        <TouchableOpacity onPress={() => navigation.navigate('RequestDetail', { id:r.id })}
          style={{ backgroundColor:C.surface, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, marginBottom:8 }}>
          <Text style={{ color:C.text, fontWeight:'700', fontSize:14, marginBottom:4 }} numberOfLines={1}>{r.title}</Text>
          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            <Tag label={r.category}/>
            {r.city && <Tag label={'📍 '+r.city}/>}
            <Tag label={r.status} color={r.status==='open'?C.ok:r.status==='completed'?C.text2:C.warn}/>
            <Tag label={'💬 '+(r._count?.offers||0)}/>
          </View>
          <Text style={{ color:C.text2, fontSize:11 }}>👤 {r.user?.name} {r.user?.surname || ''}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Empty icon="📋" title="მოთხოვნა ვერ მოიძებნა"/>}
    />
  );
}

// ────────── Support tab ──────────
function SupportTab({ navigation }) {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setReqs(await api('/admin/support')); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(id, status) {
    try { await api(`/admin/support/${id}/status`, { method:'PATCH', body:{ status } }); load(); }
    catch (e) { Alert.alert('შეცდომა', e.error||'ვერ'); }
  }

  if (loading) return <ActivityIndicator color={C.accent} style={{ marginTop:30 }}/>;

  return (
    <FlatList
      data={reqs}
      keyExtractor={s => s.id}
      contentContainerStyle={{ padding:14, paddingBottom:20 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={C.accent}/>}
      renderItem={({ item:s }) => {
        const stCol = s.status==='pending' ? C.warn : s.status==='active' ? C.err : C.text2;
        return (
          <TouchableOpacity onPress={() => navigation.navigate('AdminSupportChat', { supportId:s.id, userName:`${s.user?.name||''} ${s.user?.surname||''}`.trim() })}
            style={{ backgroundColor:C.surface, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, marginBottom:8 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <Text style={{ color:C.text, fontWeight:'700', fontSize:13 }}>👤 {s.user?.name} {s.user?.surname || ''}</Text>
              <Tag label={s.status==='pending'?'⏳ მოლოდ.':s.status==='active'?'🔴 ცოცხ.':'✓ დახურ.'} color={stCol}/>
            </View>
            {s.lastMsg && <Text style={{ color:C.text2, fontSize:12, marginBottom:6 }} numberOfLines={2}>{s.lastMsg}</Text>}
            <View style={{ flexDirection:'row', gap:8 }}>
              {s.status !== 'closed' && (
                <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setStatus(s.id, 'closed'); }}
                  style={{ backgroundColor:C.err+'15', borderRadius:8, borderWidth:1, borderColor:C.err+'66', paddingHorizontal:10, paddingVertical:5 }}>
                  <Text style={{ color:C.err, fontSize:11, fontWeight:'700' }}>✓ დახურვა</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={<Empty icon="🎧" title="სუპორტის მოთხოვნა არ არის"/>}
    />
  );
}

// ────────── Staff tab (admin only) ──────────
function StaffTab({ isAdmin }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setStaff(await api('/admin/users?type=staff')); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function createStaff() {
    if (!form.name || !form.email || !form.password) return Alert.alert('', 'შეავსე ყველა ველი');
    if (form.password.length < 8) return Alert.alert('', 'პაროლი მინიმუმ 8 სიმბოლო');
    try {
      await api('/admin/staff', { method:'POST', body:form });
      Alert.alert('✅','სტაფი დამატდა');
      setShowCreate(false); setForm({ name:'', email:'', phone:'', password:'' });
      load();
    } catch (e) { Alert.alert('შეცდომა', e.error||'ვერ შესრულდა'); }
  }

  async function deleteStaff(id, name) {
    Alert.alert('წაშლა?', name, [
      { text:'გაუქმება', style:'cancel' },
      { text:'წაშლა', style:'destructive', onPress: async () => {
        try { await api(`/admin/users/${id}`, { method:'DELETE' }); load(); }
        catch (e) { Alert.alert('შეცდომა', e.error||'ვერ'); }
      }},
    ]);
  }

  return (
    <View style={{ flex:1, padding:14 }}>
      {isAdmin && (
        <Btn title="+ ახალი სტაფი" onPress={() => setShowCreate(true)} small style={{ marginBottom:10 }}/>
      )}

      {loading ? <ActivityIndicator color={C.accent}/> : (
        <FlatList
          data={staff}
          keyExtractor={s => s.id}
          contentContainerStyle={{ paddingBottom:20 }}
          renderItem={({ item:s }) => (
            <View style={{ backgroundColor:C.surface, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, marginBottom:8, flexDirection:'row', gap:12 }}>
              <Avatar user={s} size={40}/>
              <View style={{ flex:1 }}>
                <Text style={{ color:C.text, fontWeight:'700', fontSize:13 }}>{s.name} {s.surname || ''}</Text>
                <Text style={{ color:C.text2, fontSize:11 }}>{s.email}</Text>
                {s.phone && <Text style={{ color:C.text2, fontSize:11 }}>📞 {s.phone}</Text>}
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => deleteStaff(s.id, s.name)}
                  style={{ backgroundColor:C.err+'18', borderRadius:8, borderWidth:1, borderColor:C.err+'66', paddingHorizontal:10, paddingVertical:6, alignSelf:'center' }}>
                  <Text style={{ color:C.err, fontSize:11, fontWeight:'700' }}>წაშლა</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={<Empty icon="👨‍💼" title="სტაფი ჯერ არ არის"/>}
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor:C.surface, borderRadius:24, padding:22, margin:14 }}>
            <Text style={{ color:C.text, fontSize:17, fontWeight:'900', marginBottom:16 }}>+ ახალი სტაფი</Text>
            {[
              {k:'name', p:'სახელი *'},
              {k:'email', p:'ელ-ფოსტა *'},
              {k:'phone', p:'ტელეფონი'},
              {k:'password', p:'პაროლი (მინ. 8) *', secure:true},
            ].map(f => (
              <TextInput key={f.k}
                style={{ backgroundColor:C.surface2, borderRadius:10, borderWidth:1, borderColor:C.border, padding:12, color:C.text, fontSize:14, marginBottom:10 }}
                placeholder={f.p} placeholderTextColor={C.text2}
                value={form[f.k]} onChangeText={v => setForm({...form, [f.k]:v})}
                secureTextEntry={f.secure} autoCapitalize="none"
              />
            ))}
            <Btn title="შექმნა" onPress={createStaff}/>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={{ padding:12, alignItems:'center', marginTop:6 }}>
              <Text style={{ color:C.text2 }}>გაუქმება</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ────────── Main ──────────
export default function AdminScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState('accounts');

  if (!user || (user.type !== 'admin' && user.type !== 'staff')) {
    return (
      <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center', padding:24 }}>
        <Text style={{ fontSize:52, marginBottom:14 }}>🔒</Text>
        <Text style={{ color:C.text, fontWeight:'800', fontSize:16 }}>წვდომა აკრძალულია</Text>
        <Text style={{ color:C.text2, fontSize:13, marginTop:8, textAlign:'center' }}>მხოლოდ ადმინი/სტაფი</Text>
      </View>
    );
  }

  const isAdmin = user.type === 'admin';
  const visibleTabs = TABS.filter(t => isAdmin || !t.adminOnly);

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal:16, paddingTop:insets.top + 16, paddingBottom:10, borderBottomWidth:1, borderBottomColor:C.border }}>
        <Text style={{ color:C.text, fontSize:22, fontWeight:'900' }}>🛡️ ადმინ პანელი</Text>
        <Text style={{ color:C.text2, fontSize:12, marginTop:2 }}>{isAdmin ? 'ადმინი' : 'სტაფი'}</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', paddingHorizontal:10, paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.border, gap:6 }}>
        {visibleTabs.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={{ flex:1, paddingVertical:8, borderRadius:10, borderWidth:1, borderColor:tab===t.key?C.accent:C.border, backgroundColor:tab===t.key?C.accent+'22':C.surface, alignItems:'center' }}>
            <Text style={{ fontSize:18 }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex:1 }}>
        {tab === 'analytics' && isAdmin && <AnalyticsTab/>}
        {tab === 'accounts'  && <AccountsTab navigation={navigation}/>}
        {tab === 'requests'  && <RequestsTab navigation={navigation}/>}
        {tab === 'support'   && <SupportTab  navigation={navigation}/>}
        {tab === 'staff'     && <StaffTab    isAdmin={isAdmin}/>}
      </View>
    </View>
  );
}
