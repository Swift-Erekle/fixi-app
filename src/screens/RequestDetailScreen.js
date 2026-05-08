import { useLanguage } from "../context/LanguageContext"; // src/screens/RequestDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Image, ActivityIndicator, TouchableOpacity, Modal, FlatList, Dimensions, Share, Linking } from 'react-native';

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
import { Avatar, Tag, Btn, Divider, Card } from '../components/UI';
import { getCategoryTheme } from '../utils/categoryTheme';

function getColor(s) {
  return getCategoryTheme(s).fg;
}

export default function RequestDetailScreen({ route, navigation }) {const { t: tr, tCat, tCity } = useLanguage();
  const { id } = route.params;
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [ownerReqs, setOwnerReqs] = useState([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showPhotos, setShowPhotos] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  useEffect(() => {load();}, [id]);

  async function load() {
    try {
      const data = await api('/requests/' + id);
      setReq(data);
      setFavorited(!!data.favorited);
      // ✅ Load owner's other open requests (max 4, exclude current)
      if (data?.user?.id) {
        api('/requests?userId=' + data.user.id + '&status=open&limit=5').
        then((list) => setOwnerReqs((list || []).filter((r) => r.id !== id).slice(0, 4))).
        catch(() => {});
      }
    } catch (e) {console.warn(e);} finally
    {setLoading(false);}
  }

  async function toggleFavorite() {
    setFavLoading(true);
    try {
      if (favorited) {
        await api('/requests/' + id + '/favorite', { method: 'DELETE' });
      } else {
        await api('/requests/' + id + '/favorite', { method: 'POST' });
      }
      setFavorited((v) => !v);
    } catch (e) {Alert.alert(tr("error"), e.error || tr("screens_adminscreen_text_1vf9mb"));} finally
    {setFavLoading(false);}
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `${req.title}\nhttps://myworker-production.up.railway.app/?req=${id}`,
        url: `https://myworker-production.up.railway.app/?req=${id}`
      });
    } catch (_) {}
  }

  async function handleDelete() {
    Alert.alert(tr("screens_requestdetailscreen_text_1c2sgj"), tr("screens_requestdetailscreen_text_ymhkh7"), [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("screens_adminscreen_text_2slm56"), style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await api('/requests/' + id, { method: 'DELETE' });
          navigation.goBack();
        } catch (e) {
          Alert.alert(tr("error"), e.error || tr("screens_requestdetailscreen_text_1emu5x"));
        } finally {setDeleting(false);}
      } }]
    );
  }

  async function handleStatusChange(newStatus) {
    const labels = { completed: tr('request_status_completed'), closed: tr('request_status_closed') };
    const label = labels[newStatus] || newStatus;
    Alert.alert(
      tr('request_status_change_title', { status: label }),
      newStatus === 'completed' ? tr("screens_requestdetailscreen_text_9md783") : tr("screens_requestdetailscreen_text_1qo4hn"),


      [
      { text: tr("cancel"), style: 'cancel' },
      { text: `✅ ${label}`, onPress: async () => {
          setStatusChanging(true);
          try {
            const updated = await api('/requests/' + id + '/status', { method: 'PATCH', body: { status: newStatus } });
            setReq((prev) => ({ ...prev, status: updated.status }));
          } catch (e) {
            Alert.alert(tr("error"), e.error || tr("screens_requestdetailscreen_text_lqgc8w"));
          } finally {setStatusChanging(false);}
        } }]

    );
  }

  async function rejectOffer(offerId) {
    Alert.alert(tr("screens_requestdetailscreen_text_nkyyni"), tr("rd_reject_confirm"), [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("proposal_reject_btn"), style: 'destructive', onPress: async () => {
        setRejecting(offerId);
        try {
          await api('/offers/' + offerId + '/reject', { method: 'POST' });
          await load();
        } catch (e) {
          Alert.alert(tr("error"), e.error || tr("screens_requestdetailscreen_text_1pm8hr"));
        } finally {setRejecting(null);}
      } }]
    );
  }

  async function acceptOffer(offerId) {
    Alert.alert(tr("screens_requestdetailscreen_text_12c5v2"), tr("screens_requestdetailscreen_text_rreax0"), [
    { text: tr("cancel"), style: 'cancel' },
    { text: tr("screens_proposalsscreen_text_14i4bu"), onPress: async () => {
        setAccepting(offerId);
        try {
          const data = await api('/offers/' + offerId + '/accept', { method: 'POST' });
          navigation.replace('Chat', { chatId: data.chatId, title: tr("dash_chats") });
        } catch (e) {
          Alert.alert(tr("error"), e.error || tr("screens_requestdetailscreen_text_18v1ff"));
        } finally {setAccepting(null);}
      } }]
    );
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>);

  if (!req) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: C.text2 }}>{tr("screens_handymandetailscreen_text_1brpzd")}</Text>
    </View>);


  const color = getColor(req.category);
  const isOwner = user?.id === req.user?.id;
  const isWorker = user?.type === 'handyman' || user?.type === 'company';
  const hasActive = req.offers?.some((o) => o.handymanId === user?.id && !['rejected', 'disagreed'].includes(o.status));
  const hasRejected = req.offers?.some((o) => o.handymanId === user?.id && ['rejected', 'disagreed'].includes(o.status));

  const statusColor = req.status === 'open' ? C.ok : req.status === 'in_progress' || req.status === 'pending' ? C.warn : C.text2;
  const statusLabel = req.status === 'open' ? tr("req_status_open") : req.status === 'in_progress' || req.status === 'pending' ? tr("status_active_short") : tr("req_status_completed");

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      {/* Main card */}
      <Card>
        {/* Category + status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <View style={{
              backgroundColor: color + '20', borderRadius: 20,
              borderWidth: 1, borderColor: color + '50',
              paddingHorizontal: 12, paddingVertical: 5,
              flex: 1, flexShrink: 1
            }}>
            <Text style={{ color, fontSize: 13, fontWeight: '700' }} numberOfLines={2}>{tCat(req.category)}</Text>
          </View>
          <View style={{
              backgroundColor: statusColor + '20', borderRadius: 20,
              borderWidth: 1, borderColor: statusColor + '50',
              paddingHorizontal: 12, paddingVertical: 5,
              flexShrink: 0
            }}>
            <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700' }}>{statusLabel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', lineHeight: 28, flex: 1 }}>
            {req.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Favorite toggle — visible to workers */}
            {isWorker &&
              <TouchableOpacity onPress={toggleFavorite} disabled={favLoading}
              style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: favorited ? '#ef4444' : C.border, backgroundColor: favorited ? '#ef444415' : C.surface2 }}>
                <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={20} color={favorited ? '#ef4444' : C.text2} />
              </TouchableOpacity>
              }
            {/* Share — always visible */}
            <TouchableOpacity onPress={handleShare}
              style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 }}>
              <Ionicons name="share-outline" size={20} color={C.text2} />
            </TouchableOpacity>
            {/* Delete — owner only */}
            {isOwner &&
              <TouchableOpacity onPress={handleDelete} disabled={deleting}
              style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: C.err + '60', backgroundColor: C.err + '12' }}>
                {deleting ? <ActivityIndicator size="small" color={C.err} /> : <Ionicons name="trash-outline" size={20} color={C.err} />}
              </TouchableOpacity>
              }
          </View>
        </View>

        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {req.city && <Tag label={'📍 ' + tCity(req.city)} />}
          {req.budget === 0 ?
            <Tag label={tr("screens_requestdetailscreen_text_zbbljz")} color={C.accent} /> :
            req.budget > 0 ?
            <Tag label={'💰 ' + req.budget + '₾'} color={C.ok} /> :
            null}
          {req.urgency === 'urgent' && <Tag label={tr("screens_requestdetailscreen_text_14lplq")} color={C.err} />}
        </View>

        {req.desc ?
          <Text style={{ color: C.text2, fontSize: 14, lineHeight: 22 }}>{req.desc}</Text> :
          null}

        <Divider />
        <Text style={{ color: C.text2, fontSize: 12, marginBottom: 6 }} numberOfLines={1}>
          👤 {req.user?.name} {req.user?.surname || ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Text style={{ color: C.text2, fontSize: 12 }}>
            💬 {req.offers?.length || 0}{tr("components_requestcard_text_1xkkuo")}
            </Text>
          <Text style={{ color: C.text2, fontSize: 12 }}>
            🗓 {new Date(req.createdAt).toLocaleDateString('ka-GE')}
          </Text>
        </View>
      </Card>

      {/* Media */}
      {req.media?.length > 0 &&
        <Card>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{tr("screens_requestdetailscreen_text_1blk7t")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {req.media.map((m, i) => {
                const isVideo = m.type === 'video' || m.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i);
                const imgIdx = req.media.slice(0, i).filter((x) => x.type !== 'video' && !x.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i)).length;
                return (
                  <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => {
                    if (isVideo) {Linking.openURL(m.url).catch(() => {});} else
                    {setPhotoIdx(imgIdx);setShowPhotos(true);}
                  }}>
                    <Image source={{ uri: m.url }}
                    style={{ width: 130, height: 100, borderRadius: 12, backgroundColor: C.surface2 }}
                    resizeMode="cover" />
                    
                    {isVideo &&
                    <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12 }}>
                        <Text style={{ fontSize: 28 }}>▶️</Text>
                      </View>
                    }
                  </TouchableOpacity>);

              })}
            </View>
          </ScrollView>
        </Card>
        }

      {/* Offers (owner only) */}
      {isOwner && req.offers?.length > 0 &&
        <View>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 17, marginBottom: 12 }}>{tr("screens_requestdetailscreen_text_1g910o")}
            {req.offers.length})
          </Text>
          {req.offers.map((offer) => {
            const hm = offer.handyman;
            const avg = hm?.reviewsReceived?.length ?
            (hm.reviewsReceived.reduce((s, r) => s + r.stars, 0) / hm.reviewsReceived.length).toFixed(1) :
            null;
            return (
              <Card key={offer.id}>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => navigation.navigate('HandymanDetail', { id: hm?.id })}>
                    <Avatar user={hm} size={48} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: '800', fontSize: 14 }}>{hm?.name} {hm?.surname || ''}</Text>
                    <Text style={{ color: C.accent, fontSize: 12 }}>{hm?.specialty}</Text>
                    {avg && <Text style={{ color: '#f1c40f', fontSize: 12 }}>★ {avg}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {offer.price === 0 ?
                    <Text style={{ color: C.accent, fontWeight: '800', fontSize: 14 }}>{tr("req_offers_badge")}</Text> :
                    <Text style={{ color: C.accent, fontWeight: '900', fontSize: 22 }}>₾{offer.price}</Text>
                    }
                    {offer.duration && <Text style={{ color: C.text2, fontSize: 12 }}>{offer.duration}</Text>}
                  </View>
                </View>
                {offer.comment &&
                <Text style={{ color: C.text2, fontSize: 13, lineHeight: 18, marginBottom: 12 }}>{offer.comment}</Text>
                }
                {/* Offer status badge */}
                {offer.status === 'agreed' &&
                <View style={{ backgroundColor: C.ok + '20', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: C.ok, fontWeight: '700' }}>{tr("screens_requestdetailscreen_text_p42zel")}</Text>
                  </View>
                }
                {['rejected', 'disagreed'].includes(offer.status) &&
                <View style={{ backgroundColor: C.err + '15', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: C.err, fontWeight: '700' }}>{tr("screens_requestdetailscreen_text_p7949w")}</Text>
                  </View>
                }
                {/* Accept + Reject buttons — visible while offer is pending and request still open/pending */}
                {['open', 'pending'].includes(req.status) && offer.status === 'pending' &&
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Btn
                    title={tr("screens_proposalsscreen_text_14i4bu")}
                    onPress={() => acceptOffer(offer.id)}
                    loading={accepting === offer.id}
                    small
                    style={{ flex: 1 }} />
                  
                    <Btn
                    title={tr("proposal_reject_btn")}
                    onPress={() => rejectOffer(offer.id)}
                    loading={rejecting === offer.id}
                    danger
                    small
                    style={{ flex: 1 }} />
                  
                  </View>
                }
                {/* Accepted: show badge + chat button */}
                {offer.status === 'accepted' &&
                <View>
                    <View style={{ backgroundColor: C.ok + '20', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: offer.chat?.id ? 8 : 0 }}>
                      <Text style={{ color: C.ok, fontWeight: '700' }}>{tr("screens_requestdetailscreen_text_tc06rv")}</Text>
                    </View>
                    {offer.chat?.id &&
                  <Btn
                    title={tr("dash_chat_btn")}
                    onPress={() => navigation.navigate('Chat', { chatId: offer.chat.id, title: tr("dash_chats") })}
                    small
                    outline />

                  }
                  </View>
                }
              </Card>);

          })}
        </View>
        }

      {/* ✅ Owner's other requests */}
      {ownerReqs.length > 0 &&
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
            👤 {req.user?.name}{tr("screens_requestdetailscreen_text_1m66rr")}
          </Text>
          {ownerReqs.map((r) => {
            const col = getColor(r.category);
            return (
              <TouchableOpacity key={r.id}
              onPress={() => navigation.push('RequestDetail', { id: r.id })}
              style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 }}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={2}>{r.title}</Text>
                  {r.budget > 0 && <Text style={{ color: C.ok, fontWeight: '700', fontSize: 13 }}>₾{r.budget}</Text>}
                  {r.budget === 0 && <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>{tr("req_offers_badge")}</Text>}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: col + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: col + '40', maxWidth: '60%' }}>
                    <Text style={{ color: col, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>{tCat(r.category)}</Text>
                  </View>
                  {r.city && <Text style={{ color: C.text2, fontSize: 12 }}>📍 {r.city}</Text>}
                  <Text style={{ color: C.text2, fontSize: 12 }}>💬 {r._count?.offers || 0}</Text>
                </View>
              </TouchableOpacity>);

          })}
        </View>
        }

      {/* Owner status management */}
      {isOwner && ['open', 'pending', 'in_progress'].includes(req.status) &&
        <View style={{ marginTop: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 }}>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>{tr("screens_requestdetailscreen_text_p3wav")}</Text>
          <Text style={{ color: C.text2, fontSize: 12, marginBottom: 14 }}>{tr("screens_requestdetailscreen_text_1jjx8s")}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => handleStatusChange('completed')}
              disabled={statusChanging}
              style={{ flex: 1, backgroundColor: C.ok + '18', borderRadius: 12, borderWidth: 1.5, borderColor: C.ok + '60', padding: 13, alignItems: 'center' }}>
              
              {statusChanging ?
              <ActivityIndicator size="small" color={C.ok} /> :
              <Text style={{ color: C.ok, fontWeight: '800', fontSize: 13 }}>{tr("screens_requestdetailscreen_text_gj23rb")}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusChange('closed')}
              disabled={statusChanging}
              style={{ flex: 1, backgroundColor: C.text2 + '15', borderRadius: 12, borderWidth: 1.5, borderColor: C.text2 + '40', padding: 13, alignItems: 'center' }}>
              
              <Text style={{ color: C.text2, fontWeight: '800', fontSize: 13 }}>{tr("screens_requestdetailscreen_text_1etbm2")}</Text>
            </TouchableOpacity>
          </View>
        </View>
        }

      {/* Owner — completed/closed status banner */}
      {isOwner && ['completed', 'closed'].includes(req.status) &&
        <View style={{ marginTop: 12, backgroundColor: req.status === 'completed' ? C.ok + '15' : C.text2 + '15', borderRadius: 14, borderWidth: 1, borderColor: req.status === 'completed' ? C.ok + '40' : C.text2 + '40', padding: 14, alignItems: 'center' }}>
          <Text style={{ color: req.status === 'completed' ? C.ok : C.text2, fontWeight: '700', fontSize: 14 }}>
            {req.status === 'completed' ? tr("screens_requestdetailscreen_text_1paw5t") : tr("screens_requestdetailscreen_text_1txnf4")}
          </Text>
        </View>
        }
      {isWorker && ['open', 'pending'].includes(req.status) && !hasActive &&
        <Btn
          title={tr("screens_requestdetailscreen_text_nwtmj4")}
          onPress={() => navigation.navigate('SendOffer', { requestId: id, requestTitle: req?.title })}
          style={{ marginTop: 8 }} />

        }
      {isWorker && hasActive &&
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ color: C.ok, fontWeight: '700' }}>{tr("screens_requestdetailscreen_text_nmkhgc")}</Text>
        </Card>
        }
      {isWorker && hasRejected && !hasActive &&
        <View style={{
          backgroundColor: C.err + '15', borderRadius: 14, borderWidth: 1, borderColor: C.err + '40',
          padding: 14, alignItems: 'center', marginTop: 8
        }}>
          <Text style={{ color: C.err, fontSize: 13 }}>{tr("screens_requestdetailscreen_text_1wrgvb")}</Text>
        </View>
        }
    </ScrollView>
    {showPhotos && req.media &&
      <PhotoViewer
        photos={req.media.filter((m) => m.type !== 'video' && !m.url?.match(/\.(mp4|mov|avi|mkv)(\?|$)/i))}
        startIndex={photoIdx}
        onClose={() => setShowPhotos(false)} />

      }
    </>);

}
