import { useLanguage } from "../context/LanguageContext";import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { C } from '../utils/theme';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import GradientActionButton from './GradientActionButton';
import { getCategoryTheme } from '../utils/categoryTheme';
import { getCategoryByValue } from '../utils/categories';

function getCatIcon(value) {
  const category = getCategoryByValue(value);
  return category?.icon || '📋';
}

// Returns an image-displayable URL for any media item.
// For Cloudinary videos: swap to the auto-generated JPEG thumbnail (first frame).
function mediaThumbnailUrl(item) {
  if (!item) return null;
  const url = typeof item === 'string' ? item : item.url;
  const type = typeof item === 'string' ?
  /\.(mp4|webm|mov|avi|mkv)/i.test(url) ? 'video' : 'image' :
  item.type || 'image';
  if (!url || type === 'voice') return null;
  if (type === 'video') {
    return url.
    replace('/video/upload/', '/video/upload/f_jpg,so_auto/').
    replace(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i, '.jpg');
  }
  return url;
}

function Badge({ color, label }) {
  return (
    <View style={{ backgroundColor: color + '25', borderRadius: 10, borderWidth: 1, borderColor: color + '60', paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{label}</Text>
    </View>);

}

export default function RequestCard({ request, onPress }) {const { t: tr, tCat, tCity } = useLanguage();
  const { user } = useAuth();
  const [fav, setFav] = useState(request.isFavorite || false);
  const [toggling, setToggling] = useState(false);
  const [imgError, setImgError] = useState(false);
  const categoryTheme = getCategoryTheme(request.category);
  const color = categoryTheme.fg;
  const catIcon = getCatIcon(request.category);
  const ageMs = request.createdAt ? Date.now() - new Date(request.createdAt).getTime() : Infinity;
  const isNew = ageMs < 24 * 3600000;
  const isWaiting = ageMs > 48 * 3600000 && !(request._count?.offers > 0) && !(request.offers?.length > 0);
  const isUrgent = request.urgency === 'urgent';
  const isWorker = user?.type === 'handyman' || user?.type === 'company';
  const offerCount = request._count?.offers || 0;

  const mediaArr = Array.isArray(request.media) ?
  request.media :
  request.media ? (() => {try {return JSON.parse(request.media);} catch {return [];}})() : [];
  // Skip voice items — find first image or video and get its thumbnail URL
  const firstVisual = mediaArr.find((m) => (typeof m === 'string' ? 'image' : m.type || 'image') !== 'voice');
  const thumbUrl = imgError ? null : mediaThumbnailUrl(firstVisual);

  async function toggleFav() {
    if (!user) {Alert.alert('', tr("req_login_title"));return;}
    if (!isWorker || toggling) return;
    setToggling(true);
    const next = !fav;
    setFav(next);
    try {await api(`/requests/${request.id}/favorite`, { method: 'POST' });}
    catch {setFav(!next);} finally
    {setToggling(false);}
  }

  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: 'hidden', width: '100%' }}>

      {/* ── Body: image left + content right ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={{ flexDirection: 'row', padding: 12, gap: 12 }}>

        {/* Left: image or emoji placeholder */}
        <View style={{ width: 105, height: 105, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
          {thumbUrl ?
          <Image source={{ uri: thumbUrl }} style={{ width: 105, height: 105 }} resizeMode="cover" onError={() => setImgError(true)} /> :

          <View style={{ width: 105, height: 105, backgroundColor: categoryTheme.soft, borderWidth: 1.5, borderColor: categoryTheme.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 42 }}>{catIcon}</Text>
            </View>
          }
          {/* Category label overlaid on image */}
          <View style={{ position: 'absolute', top: 6, left: 6, maxWidth: 93, backgroundColor: 'rgba(0,0,0,0.62)', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6, overflow: 'hidden' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>{tCat(request.category) || ''}</Text>
          </View>
        </View>

        {/* Right: content */}
        <View style={{ flex: 1, minWidth: 0 }}>

          {/* Badges row + heart */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 5, flexWrap: 'wrap' }}>
            {isNew && <Badge color="#10b981" label={tr("status_new")} />}
            {isUrgent && <Badge color={C.err} label={tr("components_requestcard_text_srooje")} />}
            {!isNew && !isUrgent && isWaiting && <Badge color="#f59e0b" label={tr("components_requestcard_text_gxbodo")} />}
            <View style={{ flex: 1 }} />
            {isWorker &&
            <TouchableOpacity onPress={toggleFav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={toggling}>
                <Text style={{ fontSize: 19, color: fav ? C.err : C.text2 }}>{fav ? '♥' : '♡'}</Text>
              </TouchableOpacity>
            }
          </View>

          {/* Title */}
          <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', lineHeight: 20, minHeight: 40, marginBottom: 6 }} numberOfLines={2}>{request.title}</Text>

          {/* Meta: city + price + offers */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {request.city ? <Text style={{ color: C.text2, fontSize: 12, maxWidth: 120 }} numberOfLines={1}>📍 {tCity(request.city)}</Text> : null}
            {request.budget === 0 ?
            <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>{tr("req_offers_badge")}</Text> :
            request.budget > 0 ?
            <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '900' }}>₾{request.budget}</Text> :
            null
            }
            <Text style={{ color: C.text2, fontSize: 12 }} numberOfLines={1}>💬 {offerCount}{tr("components_requestcard_text_1xkkuo")}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Full-width action button ── */}
      <GradientActionButton
        onPress={onPress}
        title={tr("req_view_detail")}
        colors={categoryTheme.gradient}
        shadowColor={categoryTheme.shadow}
      />
    </View>);

}
