import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ScrollView, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { CATEGORIES, getCategorySearchTerms } from '../../utils/categories';
import HandymanCard from '../../components/HandymanCard';
import { Avatar } from '../../components/UI';
import BellButton from '../../components/BellButton';
import { useLanguage } from '../../context/LanguageContext';
import CityDropdown from '../../components/CityDropdown';

function FilterModal({ visible, initialCat, initialSubcat, initialCity, initialMinRating, onClose, onApply }) {
  const { t, tCat } = useLanguage();
  const [cat, setCat] = useState(initialCat || '');
  const [subcat, setSubcat] = useState(initialSubcat || '');
  const [city, setCity] = useState(initialCity || '');
  const [minRating, setMinRating] = useState(initialMinRating || '');

  const RATING_OPTS = [
    { key: '', label: t('rating_all') },
    { key: '3.5', label: '⭐ 3.5+' },
    { key: '4.0', label: '⭐ 4.0+' },
    { key: '4.5', label: '⭐ 4.5+' },
  ];

  useEffect(() => {
    if (visible) { setCat(initialCat || ''); setSubcat(initialSubcat || ''); setCity(initialCity || ''); setMinRating(initialMinRating || ''); }
  }, [visible]);

  const selCat = CATEGORIES.find(c => c.name === cat);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <TouchableOpacity onPress={() => { setCat(''); setSubcat(''); setCity(''); setMinRating(''); }}>
              <Text style={{ color: C.text2, fontWeight: '700', fontSize: 14 }}>{t('filter_clear')}</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>{t('filter_title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.text2} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 10 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_category')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => { setCat(cat === c.name ? '' : c.name); setSubcat(''); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
                    borderWidth: 1.5, borderColor: cat === c.name ? C.accent : C.border,
                    backgroundColor: cat === c.name ? C.accent + '18' : C.surface2,
                    minWidth: '45%', flex: 1,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                  <Text style={{ color: cat === c.name ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{tCat(c.name)}</Text>
                  {cat === c.name && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                </TouchableOpacity>
              ))}
            </View>

            {selCat && (
              <>
                <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_subcategory')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {selCat.subs.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSubcat(subcat === s ? '' : s)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                        borderWidth: 1.5, borderColor: subcat === s ? C.accent : C.border,
                        backgroundColor: subcat === s ? C.accent + '22' : C.surface2,
                      }}
                    >
                      <Text style={{ color: subcat === s ? C.accent : C.text2, fontWeight: '600', fontSize: 13 }}>{tCat(s)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_city')}</Text>
            <CityDropdown value={city} onChange={setCity} />

            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_rating')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {RATING_OPTS.map(opt => (
                <TouchableOpacity key={opt.key} onPress={() => setMinRating(opt.key)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: minRating === opt.key ? '#f1c40f' : C.border, backgroundColor: minRating === opt.key ? '#f1c40f22' : C.surface2, alignItems: 'center' }}>
                  <Text style={{ color: minRating === opt.key ? '#f1c40f' : C.text2, fontWeight: '700', fontSize: 12 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
            <TouchableOpacity
              onPress={() => { onApply({ cat, subcat, city, minRating }); onClose(); }}
              style={{ backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('filter_apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CompanyCard({ user, onPress }) {
  const { t } = useLanguage();
  const avg = user.reviewsReceived?.length
    ? (user.reviewsReceived.reduce((s, r) => s + r.stars, 0) / user.reviewsReceived.length).toFixed(1)
    : null;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{
      width: 280, backgroundColor: C.surface, borderRadius: 18,
      borderWidth: 1, borderColor: '#9b59b655', padding: 16, marginRight: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <Avatar user={user} size={52} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 14, flex: 1 }} numberOfLines={1}>{user.name}</Text>
            <View style={{ backgroundColor: '#9b59b622', borderRadius: 12, borderWidth: 1, borderColor: '#9b59b6', paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#9b59b6', fontSize: 10, fontWeight: '800' }}>💜 VIP+</Text>
            </View>
          </View>
          {user.specialties?.length ? <Text style={{ color: '#9b59b6', fontSize: 12, marginTop: 2 }} numberOfLines={1}>🔧 {user.specialties.slice(0, 2).join(' · ')}</Text> : null}
          {user.city ? <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>📍 {user.city}</Text> : null}
        </View>
      </View>
      {user.verified && <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('home_verified')}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {avg ? <Text style={{ color: '#f1c40f', fontWeight: '700', fontSize: 13 }}>★ {avg} ({user.reviewsReceived.length})</Text> : null}
        <Text style={{ color: C.text2, fontSize: 12 }}>💼 {user.jobs || 0} {t('home_projects')}</Text>
      </View>
    </TouchableOpacity>
  );
}

function normalizeFilterText(value) {
  return String(value || '').trim().toLowerCase();
}

function getHandymanCategoryValues(handyman) {
  return [
    handyman.specialty,
    ...(Array.isArray(handyman.specialties) ? handyman.specialties : []),
    ...(Array.isArray(handyman.services) ? handyman.services : []),
  ].filter(Boolean);
}

function handymanMatchesTerm(handyman, term) {
  const needle = normalizeFilterText(term);
  if (!needle) return false;
  return getHandymanCategoryValues(handyman).some((value) => {
    const hay = normalizeFilterText(value);
    return hay && (hay.includes(needle) || needle.includes(hay));
  });
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, tCat, tCity } = useLanguage();
  const [handymen, setHandymen] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [city, setCity] = useState('');
  const [minRating, setMinRating] = useState('');
  const [companiesOnly, setCompaniesOnly] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const data = await api('/users/handymen');
      const comps = data.filter(h =>
        h.type === 'company' &&
        (h.plan === 'top' || h.vipType === 'vipp') &&
        h.vipExpiresAt && new Date(h.vipExpiresAt) > new Date()
      );
      setCompanies(comps);
      setHandymen(data);
      applyFilters(data, search, category, subCategory, city, companiesOnly, minRating);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  function applyFilters(list, q, cat, subcat, c, compsOnly, minRat) {
    let res = list;
    if (compsOnly) res = res.filter(h => h.type === 'company');
    if (q) {
      const lq = q.toLowerCase();
      res = res.filter(h =>
        h.name?.toLowerCase().includes(lq) ||
        h.surname?.toLowerCase().includes(lq) ||
        getHandymanCategoryValues(h).some((value) => normalizeFilterText(value).includes(lq))
      );
    }
    if (cat) {
      const terms = getCategorySearchTerms(cat);
      res = res.filter(h => terms.some((term) => handymanMatchesTerm(h, term)));
    }
    if (subcat) {
      res = res.filter(h => handymanMatchesTerm(h, subcat));
    }
    if (c) res = res.filter(h => h.city?.toLowerCase() === c.toLowerCase());
    if (minRat) {
      const minVal = parseFloat(minRat);
      res = res.filter(h => {
        const reviews = h.reviewsReceived;
        if (!reviews?.length) return false;
        const avg = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
        return avg >= minVal;
      });
    }
    setFiltered(res);
  }

  useEffect(() => { applyFilters(handymen, search, category, subCategory, city, companiesOnly, minRating); },
    [search, category, subCategory, city, companiesOnly, minRating, handymen]);

  useFocusEffect(useCallback(() => { load(); }, []));

  const hasActiveFilters = category || subCategory || city || minRating || companiesOnly;

  const Chip = ({ label, onRemove, color = C.accent }) => (
    <TouchableOpacity onPress={onRemove} style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
      backgroundColor: color + '22', borderWidth: 1, borderColor: color + '66',
    }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <Ionicons name="close" size={14} color={color} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>{t('home_title')}</Text>
            <Text style={{ color: C.text2, fontSize: 13, marginTop: 2 }}>{t('home_subtitle')}</Text>
          </View>
          <BellButton navigation={navigation} />
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setShowFilter(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: hasActiveFilters ? C.accent + '22' : C.surface,
                borderRadius: 12, borderWidth: 1,
                borderColor: hasActiveFilters ? C.accent : C.border,
                paddingHorizontal: 14, paddingVertical: 10,
              }}
            >
              <Ionicons name="options-outline" size={16} color={hasActiveFilters ? C.accent : C.text2} />
              <Text style={{ color: hasActiveFilters ? C.accent : C.text, fontWeight: '600', fontSize: 13 }}>{t('home_filters')}</Text>
              {hasActiveFilters && (
                <View style={{ backgroundColor: C.accent, borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>
                    {[category, subCategory, city, minRating, companiesOnly].filter(Boolean).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              backgroundColor: C.surface, borderRadius: 12,
              borderWidth: 1, borderColor: C.border, paddingHorizontal: 12,
            }}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
              <TextInput
                style={{ flex: 1, color: C.text, fontSize: 13, paddingVertical: 10 }}
                placeholder={t('home_search')}
                placeholderTextColor={C.text2}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={C.text2} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {hasActiveFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {companiesOnly && <Chip label={t('home_companies')} onRemove={() => setCompaniesOnly(false)} />}
              {category && <Chip label={tCat(category)} onRemove={() => { setCategory(''); setSubCategory(''); }} />}
              {subCategory && <Chip label={tCat(subCategory)} onRemove={() => setSubCategory('')} />}
              {city && <Chip label={tCity(city)} onRemove={() => setCity('')} color="#3b82f6" />}
              {minRating && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating('')} color="#f1c40f" />}
            </View>
          </ScrollView>
        )}

        {companies.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>{t('home_vip_companies')}</Text>
              <TouchableOpacity onPress={() => { setCompaniesOnly(true); setCategory(''); setSubCategory(''); setCity(''); }}>
                <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>{t('home_view_all')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {companies.map(c => (
                <CompanyCard key={c.id} user={c} onPress={() => navigation.navigate('HandymanDetail', { id: c.id })} />
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={{ color: C.text2, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 }}>
          {filtered.length} {t('home_count')}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <HandymanCard user={item} onPress={() => navigation.navigate('HandymanDetail', { id: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔧</Text>
              <Text style={{ color: C.text, fontWeight: '700' }}>{t('home_not_found')}</Text>
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 4, textAlign: 'center' }}>{t('home_try_filter')}</Text>
            </View>
          ) : null
        }
      />

      <FilterModal
        visible={showFilter}
        initialCat={category}
        initialSubcat={subCategory}
        initialCity={city}
        initialMinRating={minRating}
        onClose={() => setShowFilter(false)}
        onApply={({ cat, subcat, city: c, minRating: mr }) => {
          setCategory(cat);
          setSubCategory(subcat);
          setCity(c);
          setMinRating(mr);
          setCompaniesOnly(false);
        }}
      />
    </View>
  );
}
