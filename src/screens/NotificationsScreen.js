import { useLanguage } from "../context/LanguageContext"; // src/screens/NotificationsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from
'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { getSocket } from '../utils/socket';
import { C } from '../utils/theme';
import { Empty } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function timeAgo(d, tr, lang) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return tr('time_just_now_app');
  if (diff < 3600) return tr('time_minutes_short', { count: Math.floor(diff / 60) });
  if (diff < 86400) return tr('time_hours_short', { count: Math.floor(diff / 3600) });
  if (diff < 604800) return tr('time_days_short', { count: Math.floor(diff / 86400) });
  return new Date(d).toLocaleDateString(lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US');
}

const NOTIF_TITLE_KEYS = {
  new_message: 'notif_new_msg',
  new_offer: 'notif_new_offer',
  new_proposal: 'notif_new_offer',
  offer_updated: 'notif_offer_updated',
  offer_accepted: 'notif_offer_accepted',
  proposal_accepted: 'notif_offer_accepted',
  offer_rejected: 'notif_offer_rejected',
  proposal_rejected: 'notif_offer_rejected',
  offer_agreed: 'notif_agreed',
  proposal_agreed: 'notif_agreed',
  offer_agree_await: 'notif_agree_await',
  proposal_agree_await: 'notif_agree_await',
  offer_disagree: 'notif_disagreed',
  proposal_disagree: 'notif_disagreed',
  disagreed: 'notif_disagreed',
  review_reminder: 'notif_review_reminder',
  renewal_notice: 'notif_renewal_notice',
  renewal_failed: 'notif_renewal_failed',
  charge_failed: 'notif_charge_failed',
  vip_activated: 'notif_vip_activated',
  subscription_activated: 'notif_subscription_activated',
};

function linkParams(link) {
  const raw = String(link || '');
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
  return new URLSearchParams(query);
}

function isReceiptLink(link) {
  return /payment-success(?:\.html)?/i.test(String(link || ''));
}

function planLabel(plan) {
  return String(plan || '').toLowerCase() === 'top' ? 'TOP' : 'Pro';
}

function vipLabel(vipType, fallbackTitle = '') {
  if (String(vipType || '').toLowerCase() === 'vipp') return 'VIP+';
  if (String(fallbackTitle || '').includes('VIP+')) return 'VIP+';
  return 'VIP';
}

function formatNotifDate(value, lang) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const locale = lang === 'ka' ? 'ka-GE' : lang === 'ru' ? 'ru-RU' : 'en-US';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function notificationTitle(n, tr) {
  const params = linkParams(n?.link);
  if (n?.type === 'vip_activated') {
    return tr('notif_vip_activated_title', {
      vip: vipLabel(params.get('vipType'), n?.title),
    });
  }
  if (n?.type === 'subscription_activated') {
    return tr('notif_subscription_activated_title', {
      plan: planLabel(params.get('plan')),
    });
  }
  const raw = String(n?.title || '');
  if (raw.includes('შევთანხმდით?')) return tr('notif_agree_await');
  if (raw.includes('ვერ შევთანხმდით')) return tr('notif_disagreed');
  if (raw.includes('შეაფასე სამუშაო')) return tr('notif_review_reminder');
  if (raw.includes('შემდეგი ავტო-გადახდა')) return tr('notif_renewal_notice');
  if (raw.includes('ავტო-განახლება ვერ მოხდა')) return tr('notif_renewal_failed');
  if (raw.includes('გადახდა ჩამოვარდა')) return tr('notif_charge_failed');
  if (raw.includes('შევთანხმდით')) return tr('notif_agreed');
  if (raw.includes('ახალი შეტყობინება')) return tr('notif_new_msg');
  if (raw.includes('ახალი შემოთავაზება') || raw.includes('ახალი შეთავაზება')) return tr('notif_new_offer');
  if (raw.includes('შეთავაზება განახლდა')) return tr('notif_offer_updated');
  if (raw.includes('მიღებულია')) return tr('notif_offer_accepted');
  if (raw.includes('უარყოფილია') || raw.includes('არ იქნა მიღებული')) return tr('notif_offer_rejected');
  const key = NOTIF_TITLE_KEYS[n?.type];
  return key ? tr(key) : raw;
}

function replaceAllText(value, search, replacement) {
  return value.split(search).join(replacement);
}

function notificationBody(n, tr, lang) {
  const params = linkParams(n?.link);
  if (n?.type === 'vip_activated' && (params.get('days') || params.get('expiresAt'))) {
    return tr('notif_vip_activated_body', {
      vip: vipLabel(params.get('vipType'), n?.title),
      days: params.get('days') || '—',
      date: formatNotifDate(params.get('expiresAt'), lang),
    });
  }
  if (n?.type === 'subscription_activated' && (params.get('plan') || params.get('expiresAt'))) {
    return tr('notif_subscription_activated_body', {
      plan: planLabel(params.get('plan')),
      date: formatNotifDate(params.get('expiresAt'), lang),
    });
  }
  if (n?.type === 'renewal_notice' && (params.get('chargeAt') || params.get('amountGel'))) {
    return tr('notif_renewal_notice_body', {
      plan: planLabel(params.get('plan')),
      amount: params.get('amountGel') || '—',
      date: formatNotifDate(params.get('chargeAt') || params.get('renewalFor'), lang),
    });
  }
  if (n?.type === 'renewal_notice') {
    const match = String(n?.body || '').match(/(TOP|Pro)\s*[—-]\s*([\d.]+)₾.*?(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
    if (match) {
      return tr('notif_renewal_notice_body', {
        plan: planLabel(match[1]),
        amount: match[2],
        date: match[3],
      });
    }
  }
  let body = String(n?.body || '');
  if (!body) return '';
  [
    ['თანამშრომლობა დაიწყო', tr('notif_body_work_started')],
    ['შეხვედი ჩათში', tr('notif_body_chat_opened')],
    ['მომხმარებელი ელოდება შენს დადასტურებას', tr('notif_body_user_awaiting_confirmation')],
    ['მომხმარებელი ელოდება დადასტურებას', tr('notif_body_user_awaiting_confirmation')],
    ['ხელოსანი ელოდება შენს დადასტურებას', tr('notif_body_handyman_awaiting_confirmation')],
    ['ხელოსანი ელოდება დადასტურებას', tr('notif_body_handyman_awaiting_confirmation')],
    ['მომხმარებელმა უარი თქვა', tr('notif_body_user_declined')],
    ['შეთავაზება გაუქმდა', tr('notif_body_offer_canceled')],
    ['დაეთანხმა შენს შეთავაზებას', tr('notif_body_accepted_your_proposal')],
    ['ბარათი არ არის მიბმული — დაამატე ბარათი ტარიფის გასაგრძელებლად', tr('notif_body_card_missing')],
    ['ბარათი არ არის მიბმული — პარამეტრები → ბარათი', tr('notif_body_card_missing')],
    ['ბარათი არ არის მიბმული', tr('notif_body_card_missing')],
    ['ბარათის ინფო განაახლე — ტარიფი ვადაგასულია', tr('notif_body_card_update')],
    ['ბარათის ინფო განაახლე — პარამეტრები → ბარათი', tr('notif_body_card_update')],
    ['ბარათის ინფო განაახლე', tr('notif_body_card_update')],
    ['ბარათის ინფო შეამოწმე — პარამეტრები → ბარათი', tr('notif_body_card_check')],
    ['ბარათის ინფო შეამოწმე', tr('notif_body_card_check')],
    ['შეთ.', tr('notif_price_negotiable')],
  ].forEach(([search, replacement]) => {
    body = replaceAllText(body, search, replacement);
  });
  return body;
}

export default function NotificationsScreen({ navigation }) {const { t: tr, lang } = useLanguage();
  // ✅ clearUnread — optional (null-safe), works with both old and new AuthContext
  const { clearUnread } = useAuth() || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api('/notifications');
      setItems(res.notifications || []);
    } catch (e) {console.warn(e);} finally
    {setLoading(false);setRefreshing(false);}
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Mark all as read on open + clear bell badge (null-safe)
    api('/notifications/read', { method: 'POST', body: {} }).catch(() => {});
    if (typeof clearUnread === 'function') clearUnread();
  }, [load, clearUnread]));

  // Live notifications
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const handler = (notif) => setItems((prev) => [notif, ...prev]);
    sock.on('notification', handler);
    return () => sock.off('notification', handler);
  }, []);

  function handleTap(n) {
    if (!n.read) {
      api('/notifications/read', { method: 'POST', body: { id: n.id } }).catch(() => {});
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }

    // Try structured data field first
    const data = typeof n.data === 'string' ? (() => {try {return JSON.parse(n.data);} catch {return null;}})() : n.data || null;
    if (data) {
      if (data.chatId) return navigation.navigate('Chat', { chatId: data.chatId, title: data.title || tr("dash_chats") });
      if (data.requestId) return navigation.navigate('RequestDetail', { id: data.requestId });
      if (data.handymanId) return navigation.navigate('HandymanDetail', { id: data.handymanId });
      if (data.screen === 'Chats') return navigation.navigate('Tabs', { screen: 'Chats' });
      if (data.screen === 'Cards' || data.type === 'renewal_failed' || data.type === 'charge_failed') return navigation.navigate('Cards');
      if (data.screen === 'PaymentReceipt' || isReceiptLink(data.url || data.link)) {
        return navigation.navigate('PaymentReceipt', { url: data.url || data.link });
      }
      if (data.screen === 'Vip' || data.type === 'vip_activated') return navigation.navigate('Vip');
      if (data.type === 'support') return navigation.navigate('Support');
    }

    // Fall back to link string
    if (n.link) {
      if (isReceiptLink(n.link)) return navigation.navigate('PaymentReceipt', { url: n.link });
      // matches: ?chat=x, &chatId=x, ?req=x, ?requestId=x, ?user=x, ?handymanId=x
      const chatM = n.link.match(/[?&](?:chat(?:Id)?)=([^&]+)/);
      const reqM = n.link.match(/[?&](?:req(?:uest(?:Id)?)?)=([^&]+)/);
      const userM = n.link.match(/[?&](?:user(?:Id)?|handyman(?:Id)?)=([^&]+)/);
      const cardM = n.link.match(/[?&]card=/);
      const vipM = /[?&](?:vip=1|nav=vip-info)(?:&|$)/.test(n.link);
      if (chatM) return navigation.navigate('Chat', { chatId: chatM[1], title: tr("dash_chats") });
      if (reqM) return navigation.navigate('RequestDetail', { id: reqM[1] });
      if (userM) return navigation.navigate('HandymanDetail', { id: userM[1] });
      if (cardM) return navigation.navigate('Cards');
      if (vipM) return navigation.navigate('Vip');
      // path-style: /chat/xxx  /request/xxx
      const pathM = n.link.match(/\/(chat|request|handyman|req)\/([a-z0-9-]+)/i);
      if (pathM) {
        const [, seg, id] = pathM;
        if (seg === 'chat') return navigation.navigate('Chat', { chatId: id, title: tr("dash_chats") });
        if (seg === 'request' || seg === 'req') return navigation.navigate('RequestDetail', { id });
        if (seg === 'handyman') return navigation.navigate('HandymanDetail', { id });
      }
    }
  }

  async function deleteNotif(id) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    api(`/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true);load();}} tintColor={C.accent} />}
        renderItem={({ item: n }) => {
          const title = notificationTitle(n, tr);
          const body = notificationBody(n, tr, lang);
          return (
        <TouchableOpacity onPress={() => handleTap(n)} activeOpacity={0.85}
        style={{
          backgroundColor: n.read ? C.surface : C.accent + '12',
          borderRadius: 12, borderWidth: 1,
          borderColor: n.read ? C.border : C.accent + '55',
          padding: 13, marginBottom: 8
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <Text style={{ color: C.text, fontWeight: n.read ? '600' : '800', fontSize: 14, flex: 1, marginRight: 8 }}>
                {title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: C.text2, fontSize: 11 }}>{timeAgo(n.createdAt, tr, lang)}</Text>
                <TouchableOpacity onPress={() => deleteNotif(n.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={16} color={C.text2} />
                </TouchableOpacity>
              </View>
            </View>
            {body && <Text style={{ color: C.text2, fontSize: 13, lineHeight: 18 }}>{body}</Text>}
            {!n.read &&
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.accent, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />
          }
          </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Empty icon="🔔" title={tr("screens_adminsupportchatscreen_text_1vh2nb")} subtitle={tr("screens_notificationsscreen_text_p86nsh")} />} />
      
    </View>);

}
