// src/screens/ProposalsScreen.js
// Proposals = user → handyman პირდაპირი შეთავაზება
// (reverse flow: user ირჩევს ხელოსანს და უგზავნის proposal-ს)
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Tag, Btn, Card, Empty } from '../components/UI';

const STATUS_MAP = {
  pending:   { label: '⏳ მოლოდინში',   color: '#f59e0b' },
  accepted:  { label: '✅ მიღებული',     color: '#10b981' },
  rejected:  { label: '❌ უარყოფილი',   color: '#ef4444' },
  completed: { label: '🏁 დასრულებული', color: '#6b7280' },
  cancelled: { label: '↩️ გაუქმებული',  color: '#6b7280' },
};

// ── Send Proposal Modal ───────────────────────────────────────
function SendProposalModal({ handyman, visible, onClose, onSent }) {
  const [title,    setTitle]    = useState('');
  const [category, setCategory] = useState('');
  const [desc,     setDesc]     = useState('');
  const [budget,   setBudget]   = useState('');
  const [days,     setDays]     = useState('');
  const [hours,    setHours]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const CATS = ['სანტექნიკი','ელექტრიკოსი','მხატვარი','დურგალი','კონდიციონერი','კარ-ფანჯარა','სხვა'];
  const dMins  = (parseInt(days||0)*24*60)+(parseInt(hours||0)*60);
  const dLabel = [parseInt(days||0)>0?`${days} დღე`:'', parseInt(hours||0)>0?`${hours} საათი`:''].filter(Boolean).join(' ');

  function reset() { setTitle(''); setCategory(''); setDesc(''); setBudget(''); setDays(''); setHours(''); }

  async function send() {
    if (!title.trim())  return Alert.alert('შეცდომა','სათაური სავალდებულოა');
    if (!category)      return Alert.alert('შეცდომა','კატეგორია სავალდებულოა');
    if (dMins <= 0)     return Alert.alert('შეცდომა','სამუშაოს ვადა სავალდებულოა');
    setLoading(true);
    try {
      await api('/proposals', {
        method: 'POST',
        body: {
          // ✅ FIXED: backend expects `recipientId`, not `handymanId` (was causing 400 error)
          recipientId:     handyman.id,
          title:           title.trim(),
          category,
          desc,
          budget:          budget ? parseInt(budget) : null,
          durationMinutes: dMins,
          duration:        dLabel,
        },
      });
      Alert.alert('✅', 'Proposal გაიგზავნა!');
      reset();
      onSent();
      onClose();
    } catch (e) {
      Alert.alert('შეცდომა', e.error || 'გაგზავნა ვერ მოხდა');
    } finally { setLoading(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:C.bg }}>
        {/* Header */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:16, backgroundColor:C.surface, borderBottomWidth:1, borderBottomColor:C.border }}>
          <TouchableOpacity onPress={onClose} style={{ padding:4 }}>
            <Ionicons name="close" size={26} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex:1 }}>
            <Text style={{ color:C.text, fontWeight:'900', fontSize:17 }}>📋 Proposal გაგზავნა</Text>
            <Text style={{ color:C.accent, fontSize:12, marginTop:1 }}>→ {handyman?.name} {handyman?.surname||''}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:30 }}>
          <Card>
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase' }}>სათაური *</Text>
            <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:14, marginBottom:0 }}
              placeholder="მაგ: სახლის რემონტი" placeholderTextColor={C.text2} value={title} onChangeText={setTitle} />
          </Card>

          <Card>
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:10, textTransform:'uppercase' }}>კატეგორია *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection:'row', gap:8 }}>
                {CATS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)}
                    style={{ paddingHorizontal:13, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor:category===c?C.accent:C.border, backgroundColor:category===c?C.accent+'22':C.surface2 }}>
                    <Text style={{ color:category===c?C.accent:C.text2, fontWeight:'600', fontSize:12 }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card>

          <Card>
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase' }}>აღწერა</Text>
            <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:14, height:90, textAlignVertical:'top', marginBottom:14 }}
              placeholder="სამუშაოს დეტალები..." placeholderTextColor={C.text2} value={desc} onChangeText={setDesc} multiline />
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:8, textTransform:'uppercase' }}>ბიუჯეტი (₾)</Text>
            <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:13, color:C.text, fontSize:14 }}
              placeholder="სავარაუდო ბიუჯეტი" placeholderTextColor={C.text2} value={budget} onChangeText={setBudget} keyboardType="numeric" />
          </Card>

          <Card>
            <Text style={{ color:C.text2, fontSize:12, fontWeight:'700', marginBottom:10, textTransform:'uppercase' }}>სამუშაოს ვადა *</Text>
            <View style={{ flexDirection:'row', gap:10 }}>
              <View style={{ flex:1 }}>
                <Text style={{ color:C.text2, fontSize:11, marginBottom:6 }}>დღეები</Text>
                <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, color:C.text, fontSize:16, fontWeight:'700', textAlign:'center' }}
                  placeholder="0" placeholderTextColor={C.text2} value={days} onChangeText={setDays} keyboardType="numeric" />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:C.text2, fontSize:11, marginBottom:6 }}>საათები</Text>
                <TextInput style={{ backgroundColor:C.surface2, borderRadius:12, borderWidth:1, borderColor:C.border, padding:12, color:C.text, fontSize:16, fontWeight:'700', textAlign:'center' }}
                  placeholder="0" placeholderTextColor={C.text2} value={hours} onChangeText={setHours} keyboardType="numeric" />
              </View>
            </View>
            {dLabel ? <Text style={{ color:C.accent, fontSize:13, fontWeight:'700', marginTop:10 }}>⏱ {dLabel}</Text> : null}
          </Card>

          <Btn title="📋 Proposal გაგზავნა" onPress={send} loading={loading} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Proposal Card ─────────────────────────────────────────────
function ProposalCard({ proposal, currentUserId, onPress, onRespond }) {
  const st       = STATUS_MAP[proposal.status] || STATUS_MAP.pending;
  const isOwner  = proposal.userId === currentUserId;   // user who sent
  const other    = isOwner ? proposal.handyman : proposal.user;
  const canAccept = !isOwner && proposal.status === 'pending';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={{ backgroundColor:C.surface, borderRadius:16, borderWidth:1, borderColor:C.border, padding:16, marginBottom:12 }}>
      <View style={{ flexDirection:'row', gap:12, marginBottom:12 }}>
        <Avatar user={other} size={46} />
        <View style={{ flex:1 }}>
          <Text style={{ color:C.text, fontWeight:'800', fontSize:15, marginBottom:2 }}>{proposal.title}</Text>
          <Text style={{ color:C.accent, fontSize:12 }}>{isOwner ? '→ ' : '← '}{other?.name} {other?.surname||''}</Text>
        </View>
        <View style={{ alignItems:'flex-end', gap:4 }}>
          <View style={{ backgroundColor:st.color+'20', borderRadius:10, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:st.color+'40' }}>
            <Text style={{ color:st.color, fontSize:11, fontWeight:'700' }}>{st.label}</Text>
          </View>
          {proposal.budget && <Text style={{ color:C.ok, fontWeight:'700', fontSize:13 }}>₾{proposal.budget}</Text>}
        </View>
      </View>

      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:proposal.desc?10:0 }}>
        {proposal.category && <Tag label={proposal.category} />}
        {proposal.duration && <Tag label={'⏱ '+proposal.duration} />}
      </View>
      {proposal.desc ? <Text style={{ color:C.text2, fontSize:13, lineHeight:18, marginBottom:10 }} numberOfLines={2}>{proposal.desc}</Text> : null}

      {/* Accept/Reject for handyman */}
      {canAccept && (
        <View style={{ flexDirection:'row', gap:8, marginTop:4 }}>
          <TouchableOpacity onPress={() => onRespond(proposal.id, 'accept')}
            style={{ flex:1, backgroundColor:C.ok+'20', borderRadius:10, borderWidth:1, borderColor:C.ok+'50', padding:10, alignItems:'center' }}>
            <Text style={{ color:C.ok, fontWeight:'700' }}>✅ მიღება</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRespond(proposal.id, 'reject')}
            style={{ flex:1, backgroundColor:C.err+'15', borderRadius:10, borderWidth:1, borderColor:C.err+'40', padding:10, alignItems:'center' }}>
            <Text style={{ color:C.err, fontWeight:'700' }}>❌ უარყოფა</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Go to chat if accepted */}
      {proposal.status === 'accepted' && proposal.chat?.id && (
        <View style={{ marginTop:8, backgroundColor:'#10b98115', borderRadius:10, padding:10, borderWidth:1, borderColor:'#10b98130', alignItems:'center' }}>
          <Text style={{ color:'#10b981', fontWeight:'700', fontSize:13 }}>💬 ჩათი გახსნილია → შედი</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function ProposalsScreen() {
  const nav = useNavigation();
  const { user } = useAuth();
  const [proposals,   setProposals]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [responding,  setResponding]  = useState(null);
  const [tab,         setTab]         = useState('all'); // 'all' | 'sent' | 'received'

  const load = useCallback(async () => {
    try {
      // ✅ FIXED: backend has no `/proposals/mine` — fetch /sent + /received and merge
      // sender   → 'sent' list (always available to anyone)
      // received → only for handyman/company
      const isWorker = user?.type === 'handyman' || user?.type === 'company';
      const [sent, received] = await Promise.all([
        api('/proposals/sent').catch(() => []),
        isWorker ? api('/proposals/received').catch(() => []) : Promise.resolve([]),
      ]);
      // Normalize each row so `userId` (= sender) and `handymanId` (= recipient) work below
      const merge = [
        ...((Array.isArray(sent) ? sent : []).map(p => ({
          ...p,
          userId:     p.senderId,
          handymanId: p.recipientId,
          handyman:   p.recipient,
          user:       p.sender || { id: user?.id, name: user?.name, surname: user?.surname, emoji: user?.emoji, avatar: user?.avatar },
        }))),
        ...((Array.isArray(received) ? received : []).map(p => ({
          ...p,
          userId:     p.senderId,
          handymanId: p.recipientId,
          handyman:   p.recipient || { id: user?.id, name: user?.name, surname: user?.surname, emoji: user?.emoji, avatar: user?.avatar },
          user:       p.sender,
        }))),
      ];
      // Dedupe (a user could in theory appear in both — unlikely, but safe)
      const seen = new Set();
      const deduped = merge.filter(p => seen.has(p.id) ? false : (seen.add(p.id), true));
      // Newest first
      deduped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProposals(deduped);
    } catch (e) { console.warn('[PROPOSALS]', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function respond(proposalId, action) {
    setResponding(proposalId);
    try {
      const res = await api(`/proposals/${proposalId}/${action}`, { method: 'POST' });
      if (action === 'accept' && res.chatId) {
        await load();
        nav.navigate('Chat', { chatId: res.chatId, title: 'ჩათი' });
      } else {
        await load();
        Alert.alert(action === 'accept' ? '✅ მიღებულია' : '❌ უარყოფილია', '');
      }
    } catch (e) {
      Alert.alert('შეცდომა', e.error || 'ვერ შესრულდა');
    } finally { setResponding(null); }
  }

  const filtered = proposals.filter(p => {
    if (tab === 'sent')     return p.userId === user?.id;
    if (tab === 'received') return p.handymanId === user?.id;
    return true;
  });

  if (loading) return (
    <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal:20, paddingTop:16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border }}>
        <Text style={{ color:C.text, fontSize:22, fontWeight:'900' }}>📋 Proposals</Text>
        <Text style={{ color:C.text2, fontSize:13, marginTop:2 }}>პირდაპირი შეთავაზებები ხელოსნებთან</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:8 }}>
        {[{k:'all',l:'ყველა'},{k:'sent',l:'გაგზავნილი'},{k:'received',l:'მიღებული'}].map(t => (
          <TouchableOpacity key={t.k} onPress={() => setTab(t.k)}
            style={{ paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1, borderColor:tab===t.k?C.accent:C.border, backgroundColor:tab===t.k?C.accent+'20':C.surface }}>
            <Text style={{ color:tab===t.k?C.accent:C.text2, fontSize:12, fontWeight:'700' }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingHorizontal:16, paddingBottom:20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        renderItem={({ item }) => (
          <ProposalCard
            proposal={item}
            currentUserId={user?.id}
            onPress={() => item.chat?.id && nav.navigate('Chat', { chatId: item.chat.id, title: item.title })}
            onRespond={respond}
          />
        )}
        ListEmptyComponent={
          <Empty
            icon="📋"
            title="Proposal არ გაქვს"
            subtitle={user?.type === 'user' ? 'ხელოსნის პროფილზე გადადი და გაუგზავნე პირდაპირი შეთავაზება' : 'მომხმარებლები გამოგიგზავნიან proposals-ს'}
          />
        }
      />
    </View>
  );
}
