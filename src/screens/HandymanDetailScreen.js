import { useLanguage } from "../context/LanguageContext"; // src/screens/HandymanDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal, Linking, FlatList, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

function PhotoViewer({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{idx + 1} / {photos.length}</Text>
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / SW))}
          renderItem={({ item }) =>
          <ScrollView
            style={{ width: SW, height: SH }}
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}>
            
              <Image source={{ uri: item.url }} style={{ width: SW, height: SW }} resizeMode="contain" />
            </ScrollView>
          } />
        
      </View>
    </Modal>);

}
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, PlanBadge, Tag, Btn, Divider, Card, StarPicker } from '../components/UI';
import { CATEGORIES } from '../utils/categories';

const CAT_COLORS = { 'ელექტრიკოსი': '#8b5cf6', 'სანტექნიკი': '#3b82f6', 'კონდიციონერი': '#10b981', 'მხატვარი': '#f59e0b', 'დურგალი': '#ef4444', 'ტექნიკოსი': '#06b6d4', 'მშენებელი': '#d97706', 'უნივერსალური': '#6b7280', 'მებაღე': '#22c55e', 'სპეციალიზებული': '#a855f7', 'სახლის': '#ec4899', 'ფილების': '#f97316', 'შემდუღებელი': '#dc2626', 'მეკარე': '#14b8a6' };
function getColor(s) {for (const [k, v] of Object.entries(CAT_COLORS)) if (s?.toLowerCase().includes(k.toLowerCase())) return v;return C.accent;}

// ✅ NEW: normalize phone → tel URI + wa.me digits
function buildContactLinks(rawPhone) {
  const phone = String(rawPhone || '').replace(/[\s()-]/g, '');
  if (!phone) return null;
  const telUri = phone.startsWith('+') ? `tel:${phone}` : `tel:+${phone}`;
  const digits = phone.replace(/^\+/, '');
  const waUri = `https://wa.me/${digits}`;
  return { telUri, waUri };
}

// ✅ NEW: Call/WhatsApp choice modal
function CallChoiceModal({ visible, onClose, telUri, waUri }) {const { t: tr } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: C.surface, borderRadius: 24, padding: 24, margin: 16 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '900', marginBottom: 6, textAlign: 'center' }}>{tr("call_modal_title")}

          </Text>
          <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>{tr("call_modal_sub")}

          </Text>

          <TouchableOpacity
            onPress={() => {onClose();Linking.openURL(telUri);}}
            style={{ backgroundColor: C.accent, borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            
            <Text style={{ fontSize: 18 }}>📞</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{tr("rd_call_phone_btn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {onClose();Linking.openURL(waUri);}}
            style={{ backgroundColor: '#25D366', borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            
            <Text style={{ fontSize: 18 }}>💬</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{tr("rd_call_whatsapp_btn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ padding: 14, alignItems: 'center' }}>
            <Text style={{ color: C.text2, fontSize: 14 }}>{tr("cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>);

}

function ProposalModal({ handyman, visible, onClose }) {const { t: tr, tCat } = useLanguage();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subcat, setSubcat] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [days, setDays] = useState('1');const [hours, setHours] = useState('');const [loading, setLoading] = useState(false);
  const selCat = CATEGORIES.find((c) => c.name === category);
  const dMins = parseInt(days || 0) * 24 * 60 + parseInt(hours || 0) * 60;
  const dLabel = [parseInt(days || 0) > 0 ? tr('duration_days_count', { count: days }) : '', parseInt(hours || 0) > 0 ? tr('duration_hours_count', { count: hours }) : ''].filter(Boolean).join(' ');
  async function send() {
    if (!title.trim()) return Alert.alert(tr("error"), tr("screens_createrequestscreen_text_j3arl4"));
    if (!category) return Alert.alert(tr("error"), tr("screens_createrequestscreen_text_qy5s7"));
    if (dMins <= 0) return Alert.alert(tr("error"), tr("screens_handymandetailscreen_text_1mj02j"));
    setLoading(true);
    try {
      await api('/proposals', { method: 'POST', body: {
          recipientId: handyman.id,
          title: title.trim(),
          category,
          subcat,
          desc,
          budget: negotiable ? 0 : budget ? parseInt(budget) : null,
          durationMinutes: dMins,
          duration: dLabel
        } });
      Alert.alert('✅', tr("offer_sent"));onClose();
    } catch (e) {
      Alert.alert(tr("error"), e.error || tr("screens_chatscreen_text_ws73p2"));
    } finally {setLoading(false);}
  }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={C.text} /></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>{tr("screens_handymandetailscreen_text_mf3z7n")}</Text>
            <Text style={{ color: C.accent, fontSize: 12 }}>→ {handyman?.name} {handyman?.surname || ''}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <Card>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>{tr("proposal_title_label")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14 }} placeholder={tr("screens_handymandetailscreen_text_4ho1nm")} placeholderTextColor={C.text2} value={title} onChangeText={setTitle} />
          </Card>

          <Card>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' }}>{tr("proposal_cat_label_text")}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: selCat && selCat.subs.length > 0 ? 16 : 0 }}>
              {CATEGORIES.map((c) => {const act = category === c.name;return (
                  <TouchableOpacity key={c.name} onPress={() => {setCategory(c.name);setSubcat('');}}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: 1.5, borderColor: act ? C.accent : C.border, backgroundColor: act ? C.accent + '18' : C.surface2, minWidth: '45%', flex: 1 }}>
                  <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                  <Text style={{ color: act ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{tCat(c.name)}</Text>
                  {act && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                </TouchableOpacity>);
              })}
            </View>
            {selCat && selCat.subs.length > 0 &&
            <>
                <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' }}>{tr("filter_subcategory")}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selCat.subs.map((s) =>
                <TouchableOpacity key={s} onPress={() => setSubcat(subcat === s ? '' : s)}
                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: subcat === s ? C.accent : C.border, backgroundColor: subcat === s ? C.accent + '22' : C.surface2 }}>
                      <Text style={{ color: subcat === s ? C.accent : C.text2, fontWeight: '600', fontSize: 13 }}>{tCat(s)}</Text>
                    </TouchableOpacity>
                )}
                </View>
              </>
            }
          </Card>

          <Card>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>{tr("edit_desc_label")}</Text>
            <TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14, height: 80, textAlignVertical: 'top', marginBottom: 14 }} placeholder={tr("screens_handymandetailscreen_text_x6v2kk")} placeholderTextColor={C.text2} value={desc} onChangeText={setDesc} multiline />
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>{tr("filter_budget")}</Text>
            <TextInput
              style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: negotiable ? C.border + '60' : C.border, padding: 13, color: negotiable ? C.text2 : C.text, fontSize: 14, marginBottom: 10, opacity: negotiable ? 0.5 : 1 }}
              placeholder={tr("screens_handymandetailscreen_text_1kb629")} placeholderTextColor={C.text2}
              value={negotiable ? '' : budget} onChangeText={setBudget} keyboardType="numeric" editable={!negotiable} />
            <TouchableOpacity onPress={() => {setNegotiable(!negotiable);if (!negotiable) setBudget('');}}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent + '12' : C.surface2 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: negotiable ? C.accent : C.border, backgroundColor: negotiable ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {negotiable && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={{ color: negotiable ? C.accent : C.text, fontWeight: '700', fontSize: 14 }}>{tr("screens_createrequestscreen_text_1vgvue")}</Text>
            </TouchableOpacity>
          </Card>

          <Card>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' }}>{tr("screens_handymandetailscreen_text_vr41xw")}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>{tr("proposal_days_label")}</Text><TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }} placeholder="0" placeholderTextColor={C.text2} value={days} onChangeText={setDays} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>{tr("proposal_hours_label")}</Text><TextInput style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }} placeholder="0" placeholderTextColor={C.text2} value={hours} onChangeText={setHours} keyboardType="numeric" /></View>
            </View>
            {dLabel ? <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700', marginTop: 10 }}>⏱ {dLabel}</Text> : null}
          </Card>
          <Btn title={tr("screens_handymandetailscreen_text_1xr4p5")} onPress={send} loading={loading} />
        </ScrollView>
      </View>
    </Modal>);

}

export default function HandymanDetailScreen({ route, navigation }) {const { t: tr, tCat, tCity } = useLanguage();
  const { id } = route.params;const { user } = useAuth();
  const [hm, setHm] = useState(null);const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);const [showProposal, setShowProposal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [stars, setStars] = useState(5);const [comment, setComment] = useState('');const [sending, setSending] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);const [showPhotos, setShowPhotos] = useState(false);
  useEffect(() => {load();}, [id]);
  async function load() {try {setHm(await api('/users/' + id));} catch (e) {console.warn(e);} finally {setLoading(false);}}
  async function submitReview() {
    setSending(true);
    try {await api('/offers/reviews', { method: 'POST', body: { handymanId: id, stars, comment } });
      Alert.alert('✅', tr("screens_handymandetailscreen_text_q0emik"));setShowReview(false);setComment('');setStars(5);await load();}
    catch (e) {Alert.alert(tr("error"), e.error || tr("screens_handymandetailscreen_text_xj0udg"));} finally {setSending(false);}
  }

  function handleCallPress() {
    if (!hm?.phone) return;
    const links = buildContactLinks(hm.phone);
    if (!links) return;
    if (hm.whatsappEnabled) {
      setShowCallModal(true);
    } else {
      Linking.openURL(links.telUri);
    }
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.accent} size="large" /></View>;
  if (!hm) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.text2 }}>{tr("screens_handymandetailscreen_text_1brpzd")}</Text></View>;
  const color = getColor(hm.specialty);
  const reviews = hm.reviewsReceived || [];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : null;
  const links = buildContactLinks(hm.phone);

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, padding: 24, alignItems: 'center' }}>
          <Avatar user={hm} size={88} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{hm.name} {hm.surname || ''}</Text>
            {hm.verified && <Text style={{ fontSize: 18 }}>✅</Text>}
          </View>
          <Text style={{ color, fontSize: 14, fontWeight: '700', marginTop: 4 }}>{tCat(hm.specialty)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <PlanBadge user={hm} />{hm.city && <Tag label={'📍 ' + tCity(hm.city)} />}{avg && <Tag label={'★ ' + avg + ' (' + reviews.length + ')'} color="#f1c40f" />}<Tag label={tr('profile_projects_count', { count: hm.jobs || 0 })} />
          </View>
          {hm.desc ? <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center', marginTop: 14, lineHeight: 20, maxWidth: 320 }}>{hm.desc}</Text> : null}
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          {hm.services?.length > 0 && <Card><Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{tr("screens_handymandetailscreen_text_d8w69g")}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{hm.services.map((s, i) => <Tag key={i} label={tCat(s)} color={color} />)}</View></Card>}
          {hm.portfolio?.length > 0 && <Card><Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{tr("prof_portfolio_section")}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>{hm.portfolio.map((p, i) => {const isVid = p.type === 'video' || p.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i);const imgIdx = hm.portfolio.slice(0, i).filter((x) => x.type !== 'video' && !x.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i)).length;return <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => {if (isVid) Linking.openURL(p.url).catch(() => {});else {setPhotoIdx(imgIdx);setShowPhotos(true);}}}><Image source={{ uri: p.url }} style={{ width: 130, height: 100, borderRadius: 12, backgroundColor: C.surface2 }} resizeMode="cover" />{isVid && <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12 }}><Text style={{ fontSize: 26 }}>▶️</Text></View>}</TouchableOpacity>;})}</View></ScrollView></Card>}
          {reviews.length > 0 && <Card><Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 14 }}>{tr("screens_handymandetailscreen_text_10k4wd")}{reviews.length})</Text>{reviews.slice(0, 5).map((r, i) => <View key={i}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{r.reviewer?.name} {r.reviewer?.surname || ''}</Text><Text style={{ color: '#f1c40f', fontSize: 13 }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</Text></View>{r.comment ? <Text style={{ color: C.text2, fontSize: 13, lineHeight: 18 }}>{r.comment}</Text> : null}{i < reviews.slice(0, 5).length - 1 && <Divider />}</View>)}</Card>}
          {user && user.type === 'user' && user.id !== hm.id && <Card><TouchableOpacity onPress={() => setShowReview(!showReview)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>{tr("screens_handymandetailscreen_text_1lngwk")}</Text><Ionicons name={showReview ? 'chevron-up' : 'chevron-down'} size={18} color={C.text2} /></TouchableOpacity>{showReview && <View style={{ marginTop: 16 }}><StarPicker value={stars} onChange={setStars} /><TextInput style={{ marginTop: 12, backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14, height: 90, textAlignVertical: 'top' }} placeholder={tr("screens_handymandetailscreen_text_16thxn")} placeholderTextColor={C.text2} value={comment} onChangeText={setComment} multiline /><Btn title={tr("send")} onPress={submitReview} loading={sending} style={{ marginTop: 12 }} /></View>}</Card>}

          {/* ✅ Call / WhatsApp button */}
          {user?.id !== hm.id && links &&
          <Btn
            title={hm.whatsappEnabled ? tr("prof_whatsapp_call_btn") : tr("prof_call_btn")}
            onPress={handleCallPress}
            style={{
              borderColor: hm.whatsappEnabled ? '#25D366' : C.accent,
              borderWidth: 1.5,
              backgroundColor: hm.whatsappEnabled ? '#25D36618' : C.accent + '15'
            }}
            textStyle={{ color: hm.whatsappEnabled ? '#25D366' : C.accent }} />

          }

          {user?.type === 'user' && user.id !== hm.id &&
          <Btn title={tr("screens_handymandetailscreen_text_1xr4p5")} onPress={() => setShowProposal(true)} style={{ borderColor: color, borderWidth: 1.5, backgroundColor: color + '18' }} textStyle={{ color }} />
          }
        </View>
      </ScrollView>
      {hm && <ProposalModal handyman={hm} visible={showProposal} onClose={() => setShowProposal(false)} />}
      {showPhotos && hm?.portfolio && <PhotoViewer photos={hm.portfolio.filter((p) => p.type !== 'video' && !p.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i))} startIndex={photoIdx} onClose={() => setShowPhotos(false)} />}
      {links &&
      <CallChoiceModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        telUri={links.telUri}
        waUri={links.waUri} />

      }
    </>);

}
