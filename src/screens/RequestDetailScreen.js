// src/screens/RequestDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Image, ActivityIndicator, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';

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
          onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / SW))}
          renderItem={({ item }) => (
            <ScrollView
              style={{ width: SW, height: SH }}
              contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image source={{ uri: item.url }} style={{ width: SW, height: SW }} resizeMode="contain" />
            </ScrollView>
          )}
        />
      </View>
    </Modal>
  );
}
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Tag, Btn, Divider, Card } from '../components/UI';

const CAT_COLORS = {
  'ელექტრიკოსი': '#8b5cf6', 'სანტექნიკი': '#3b82f6',
  'კონდიციონერი': '#10b981', 'მხატვარი': '#f59e0b',
  'დურგალი': '#ef4444', 'ინტერნეტი': '#06b6d4',
};
function getColor(s) {
  for (const [k, v] of Object.entries(CAT_COLORS)) {
    if (s?.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return C.accent;
}

export default function RequestDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [req, setReq]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [ownerReqs, setOwnerReqs] = useState([]);
  const [photoIdx, setPhotoIdx]   = useState(0);
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const data = await api('/requests/' + id);
      setReq(data);
      // ✅ Load owner's other open requests (max 4, exclude current)
      if (data?.user?.id) {
        api('/requests?userId=' + data.user.id + '&status=open&limit=5')
          .then(list => setOwnerReqs((list||[]).filter(r => r.id !== id).slice(0,4)))
          .catch(() => {});
      }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }

  async function acceptOffer(offerId) {
    Alert.alert('შეთავაზების მიღება', 'ნამდვილად გინდა ამ შეთავაზების მიღება?', [
      { text: 'გაუქმება', style: 'cancel' },
      { text: '✅ მიღება', onPress: async () => {
        setAccepting(offerId);
        try {
          const data = await api('/offers/' + offerId + '/accept', { method: 'POST' });
          navigation.replace('Chat', { chatId: data.chatId, title: 'ჩათი' });
        } catch (e) {
          Alert.alert('შეცდომა', e.error || 'მიღება ვერ მოხდა');
        } finally { setAccepting(null); }
      }},
    ]);
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );
  if (!req) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: C.text2 }}>⚠️ ვერ ჩაიტვირთა</Text>
    </View>
  );

  const color = getColor(req.category);
  const isOwner   = user?.id === req.user?.id;
  const isWorker  = user?.type === 'handyman' || user?.type === 'company';
  const hasActive = req.offers?.some(o => o.handymanId === user?.id && !['rejected','disagreed'].includes(o.status));
  const hasRejected = req.offers?.some(o => o.handymanId === user?.id && ['rejected','disagreed'].includes(o.status));

  const statusColor = req.status === 'open' ? C.ok : req.status === 'in_progress' ? C.warn : C.text2;
  const statusLabel = req.status === 'open' ? 'ღია' : req.status === 'in_progress' ? 'მიმდინარე' : 'დასრულებული';

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      {/* Main card */}
      <Card>
        {/* Category + status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{
            backgroundColor: color + '20', borderRadius: 20,
            borderWidth: 1, borderColor: color + '50',
            paddingHorizontal: 12, paddingVertical: 5,
          }}>
            <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{req.category}</Text>
          </View>
          <View style={{
            backgroundColor: statusColor + '20', borderRadius: 20,
            borderWidth: 1, borderColor: statusColor + '50',
            paddingHorizontal: 12, paddingVertical: 5,
          }}>
            <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700' }}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', marginBottom: 12, lineHeight: 28 }}>
          {req.title}
        </Text>

        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {req.city && <Tag label={'📍 ' + req.city} />}
          {req.budget === 0
            ? <Tag label="💬 შეთანხმებით" color={C.accent} />
            : req.budget > 0
              ? <Tag label={'💰 ' + req.budget + '₾'} color={C.ok} />
              : null}
          {req.urgency === 'urgent' && <Tag label="🚨 გადაუდებელი" color={C.err} />}
        </View>

        {req.desc ? (
          <Text style={{ color: C.text2, fontSize: 14, lineHeight: 22 }}>{req.desc}</Text>
        ) : null}

        <Divider />
        <Text style={{ color: C.text2, fontSize: 12, marginBottom: 6 }} numberOfLines={1}>
          👤 {req.user?.name} {req.user?.surname || ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Text style={{ color: C.text2, fontSize: 12 }}>
            💬 {req.offers?.length || 0} შეთ.
          </Text>
          <Text style={{ color: C.text2, fontSize: 12 }}>
            🗓 {new Date(req.createdAt).toLocaleDateString('ka-GE')}
          </Text>
        </View>
      </Card>

      {/* Media */}
      {req.media?.filter(m => m.type === 'image').length > 0 && (
        <Card>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>📷 ფოტოები</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {req.media.filter(m => m.type === 'image').map((m, i) => (
                <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => { setPhotoIdx(i); setShowPhotos(true); }}>
                  <Image source={{ uri: m.url }}
                    style={{ width: 130, height: 100, borderRadius: 12, backgroundColor: C.surface2 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>
      )}

      {/* Offers (owner only) */}
      {isOwner && req.offers?.length > 0 && (
        <View>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 17, marginBottom: 12 }}>
            📬 შეთავაზებები ({req.offers.length})
          </Text>
          {req.offers.map(offer => {
            const hm = offer.handyman;
            const avg = hm?.reviewsReceived?.length
              ? (hm.reviewsReceived.reduce((s, r) => s + r.stars, 0) / hm.reviewsReceived.length).toFixed(1)
              : null;
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
                    <Text style={{ color: C.accent, fontWeight: '900', fontSize: 22 }}>₾{offer.price}</Text>
                    {offer.duration && <Text style={{ color: C.text2, fontSize: 12 }}>{offer.duration}</Text>}
                  </View>
                </View>
                {offer.comment && (
                  <Text style={{ color: C.text2, fontSize: 13, lineHeight: 18, marginBottom: 12 }}>{offer.comment}</Text>
                )}
                {offer.status === 'pending' && req.status === 'open' && (
                  <Btn
                    title="✅ შეთავაზების მიღება"
                    onPress={() => acceptOffer(offer.id)}
                    loading={accepting === offer.id}
                    small
                  />
                )}
                {offer.status === 'accepted' && (
                  <View style={{ backgroundColor: C.ok + '20', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: C.ok, fontWeight: '700' }}>✅ მიღებული</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* ✅ Owner's other requests */}
      {ownerReqs.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
            👤 {req.user?.name}-ის სხვა მოთხოვნები
          </Text>
          {ownerReqs.map(r => {
            const col = getColor(r.category);
            return (
              <TouchableOpacity key={r.id}
                onPress={() => navigation.push('RequestDetail', { id: r.id })}
                style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={2}>{r.title}</Text>
                  {r.budget > 0 && <Text style={{ color: C.ok, fontWeight: '700', fontSize: 13 }}>₾{r.budget}</Text>}
                  {r.budget === 0 && <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>💬 შეთ.</Text>}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: col + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: col + '40', maxWidth: '60%' }}>
                    <Text style={{ color: col, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>{r.category}</Text>
                  </View>
                  {r.city && <Text style={{ color: C.text2, fontSize: 12 }}>📍 {r.city}</Text>}
                  <Text style={{ color: C.text2, fontSize: 12 }}>💬 {r._count?.offers || 0}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Worker CTA */}
      {isWorker && ['open', 'pending'].includes(req.status) && !hasActive && (
        <Btn
          title="📤 შეთავაზების გაგზავნა"
          onPress={() => navigation.navigate('SendOffer', { requestId: id, requestTitle: req?.title })}
          style={{ marginTop: 8 }}
        />
      )}
      {isWorker && hasActive && (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ color: C.ok, fontWeight: '700' }}>✅ შეთავაზება გაგზავნილია</Text>
        </Card>
      )}
      {isWorker && hasRejected && !hasActive && (
        <View style={{
          backgroundColor: C.err + '15', borderRadius: 14, borderWidth: 1, borderColor: C.err + '40',
          padding: 14, alignItems: 'center', marginTop: 8,
        }}>
          <Text style={{ color: C.err, fontSize: 13 }}>❌ შენი შეთავაზება უარყოფილია — შეგიძლია ახლის გაგზავნა</Text>
        </View>
      )}
    </ScrollView>
    {showPhotos && req.media && (
      <PhotoViewer
        photos={req.media.filter(m => m.type === 'image')}
        startIndex={photoIdx}
        onClose={() => setShowPhotos(false)}
      />
    )}
    </>
  );
}
