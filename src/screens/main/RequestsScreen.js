// src/screens/main/RequestsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput, Modal, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import RequestCard from '../../components/RequestCard';
import { CATEGORIES, filterCategoriesBySearch, filterSubcategoriesBySearch } from '../../utils/categories';
import BellButton from '../../components/BellButton';
import CityDropdown from '../../components/CityDropdown';

function FilterModal({ visible, initialCat, initialSubcat, initialCity, initialMinBudget, initialMaxBudget, initialStatus, initialUrgent, onClose, onApply }) {
  const { t, tCat } = useLanguage();
  const STATUS_OPTS = [
    { key: '', label: t('status_all') },
    { key: 'open', label: t('status_open') },
    { key: 'pending', label: t('status_pending') },
    { key: 'completed', label: t('status_completed') },
  ];
  const [cat, setCat] = useState(initialCat || '');
  const [subcat, setSubcat] = useState(initialSubcat || '');
  const [city, setCity] = useState(initialCity || '');
  const [minBudget, setMinBudget] = useState(initialMinBudget || '');
  const [maxBudget, setMaxBudget] = useState(initialMaxBudget || '');
  const [status, setStatus] = useState(initialStatus || '');
  const [urgent, setUrgent] = useState(initialUrgent || false);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcatSearch, setSubcatSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setCat(initialCat || ''); setSubcat(initialSubcat || ''); setCity(initialCity || '');
      setMinBudget(initialMinBudget || ''); setMaxBudget(initialMaxBudget || '');
      setStatus(initialStatus || ''); setUrgent(initialUrgent || false);
      setCategorySearch(''); setSubcatSearch('');
    }
  }, [visible]);

  const selCat = CATEGORIES.find(c => c.name === cat);
  const visibleCategories = filterCategoriesBySearch(categorySearch, tCat);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <TouchableOpacity onPress={() => { setCat(''); setSubcat(''); setCity(''); setMinBudget(''); setMaxBudget(''); setStatus(''); setUrgent(false); }}>
              <Text style={{ color: C.text2, fontWeight: '700', fontSize: 14 }}>{t('filter_clear')}</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>{t('filter_title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.text2} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 10 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_category')}</Text>
            <TextInput
              value={categorySearch}
              onChangeText={setCategorySearch}
              placeholder={t('cat_search_ph')}
              placeholderTextColor={C.text2}
              style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.text, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {visibleCategories.length === 0 ? (
                <Text style={{ color: C.text2, paddingVertical: 8 }}>{t('cat_search_empty')}</Text>
              ) : visibleCategories.map(c => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => { setCat(cat === c.name ? '' : c.name); setSubcat(''); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14,
                    borderWidth: 1.5, borderColor: cat === c.name ? C.accent : C.border,
                    backgroundColor: cat === c.name ? C.accent + '18' : C.surface2,
                    minWidth: '45%', flex: 1,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                  <Text style={{ color: cat === c.name ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{tCat(c.name)}</Text>
                  {cat === c.name && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                </TouchableOpacity>
              ))}
            </View>

            {selCat && selCat.subs.length > 0 && (
              <>
                <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_subcategory')}</Text>
                <TextInput
                  value={subcatSearch}
                  onChangeText={setSubcatSearch}
                  placeholder={t('cat_search_ph')}
                  placeholderTextColor={C.text2}
                  style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: C.text, marginBottom: 12 }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {filterSubcategoriesBySearch(selCat.subs, subcatSearch, tCat).map(s => (
                    <TouchableOpacity key={s}
                      onPress={() => setSubcat(subcat === s ? '' : s)}
                      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: subcat === s ? C.accent : C.border, backgroundColor: subcat === s ? C.accent + '22' : C.surface2 }}>
                      <Text style={{ color: subcat === s ? C.accent : C.text2, fontWeight: '600', fontSize: 13 }}>{tCat(s)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_city')}</Text>
            <CityDropdown value={city} onChange={setCity} style={{ marginBottom: 20 }} />

            {/* Price range */}
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_budget')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>{t('filter_budget_min')}</Text>
                <TextInput
                  style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'center' }}
                  placeholder="0" placeholderTextColor={C.text2} value={minBudget} onChangeText={setMinBudget} keyboardType="numeric"
                />
              </View>
              <View style={{ alignSelf: 'flex-end', paddingBottom: 12 }}>
                <Text style={{ color: C.text2, fontSize: 18 }}>–</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>{t('filter_budget_max')}</Text>
                <TextInput
                  style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'center' }}
                  placeholder="∞" placeholderTextColor={C.text2} value={maxBudget} onChangeText={setMaxBudget} keyboardType="numeric"
                />
              </View>
            </View>

            {/* Status */}
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>{t('filter_status')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {STATUS_OPTS.map(opt => (
                <TouchableOpacity key={opt.key} onPress={() => setStatus(opt.key)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: status === opt.key ? C.accent : C.border, backgroundColor: status === opt.key ? C.accent + '22' : C.surface2, alignItems: 'center' }}>
                  <Text style={{ color: status === opt.key ? C.accent : C.text2, fontWeight: '700', fontSize: 13 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Urgent */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: urgent ? C.err + '60' : C.border, backgroundColor: urgent ? C.err + '12' : C.surface2, marginBottom: 10 }}>
              <View>
                <Text style={{ color: urgent ? C.err : C.text, fontWeight: '700', fontSize: 14 }}>{t('filter_urgent')}</Text>
                <Text style={{ color: C.text2, fontSize: 12 }}></Text>
              </View>
              <Switch value={urgent} onValueChange={setUrgent} trackColor={{ false: C.border, true: C.err }} thumbColor="#fff" />
            </View>
          </ScrollView>

          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
            <TouchableOpacity
              onPress={() => { onApply({ cat, subcat, city, minBudget, maxBudget, status, urgent }); onClose(); }}
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

export default function RequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, tCat, tCity } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cat, setCat] = useState('');
  const [subcat, setSubcat] = useState('');
  const [city, setCity] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [status, setStatus] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (subcat || cat) params.set('category', subcat || cat);
      if (city) params.set('city', city);
      if (status) params.set('status', status);
      if (urgent) params.set('urgency', 'urgent');
      const data = await api('/requests?' + params.toString());
      setRequests(data);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, [cat, subcat, city, status, urgent]));

  const filtered = requests.filter(r => {
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase()) && !r.category?.toLowerCase().includes(search.toLowerCase())) return false;
    if (minBudget && r.budget != null && r.budget < parseInt(minBudget)) return false;
    if (maxBudget && r.budget != null && r.budget > parseInt(maxBudget)) return false;
    return true;
  });

  const hasActiveFilters = !!(cat || subcat || city || minBudget || maxBudget || status || urgent);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Static header — outside FlatList so TextInput never loses focus on re-render */}
      <View style={{ paddingTop: insets.top }}>
        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>{t('req_title')}</Text>
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 2 }}>{t('req_subtitle')}</Text>
            </View>
            <BellButton navigation={navigation} style={{ marginLeft: 12 }} />
          </View>
          {user?.type === 'user' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateRequest')}
              style={{ marginTop: 14, backgroundColor: C.accent, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('req_cta_btn')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search & filter bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
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
                    {[cat, subcat, city, minBudget || maxBudget, status, urgent].filter(Boolean).length}
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
                placeholder={t('req_search')}
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

          {hasActiveFilters && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {cat && (
                  <TouchableOpacity onPress={() => { setCat(''); setSubcat(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.accent + '22', borderWidth: 1, borderColor: C.accent + '66' }}>
                    <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>{tCat(cat)}</Text>
                    <Ionicons name="close" size={14} color={C.accent} />
                  </TouchableOpacity>
                )}
                {subcat && (
                  <TouchableOpacity onPress={() => setSubcat('')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.accent + '18', borderWidth: 1, borderColor: C.accent + '44' }}>
                    <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600' }}>{tCat(subcat)}</Text>
                    <Ionicons name="close" size={14} color={C.accent} />
                  </TouchableOpacity>
                )}
                {city && (
                  <TouchableOpacity onPress={() => setCity('')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#3b82f622', borderWidth: 1, borderColor: '#3b82f666' }}>
                    <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '700' }}>📍 {tCity(city)}</Text>
                    <Ionicons name="close" size={14} color="#3b82f6" />
                  </TouchableOpacity>
                )}
                {(minBudget || maxBudget) && (
                  <TouchableOpacity onPress={() => { setMinBudget(''); setMaxBudget(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.ok + '22', borderWidth: 1, borderColor: C.ok + '66' }}>
                    <Text style={{ color: C.ok, fontSize: 12, fontWeight: '700' }}>₾{minBudget||'0'}–{maxBudget||'∞'}</Text>
                    <Ionicons name="close" size={14} color={C.ok} />
                  </TouchableOpacity>
                )}
                {status && (
                  <TouchableOpacity onPress={() => setStatus('')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.warn + '22', borderWidth: 1, borderColor: C.warn + '66' }}>
                    <Text style={{ color: C.warn, fontSize: 12, fontWeight: '700' }}>{STATUS_OPTS.find(o => o.key === status)?.label}</Text>
                    <Ionicons name="close" size={14} color={C.warn} />
                  </TouchableOpacity>
                )}
                {urgent && (
                  <TouchableOpacity onPress={() => setUrgent(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.err + '22', borderWidth: 1, borderColor: C.err + '66' }}>
                    <Text style={{ color: C.err, fontSize: 12, fontWeight: '700' }}>{t('filter_urgent')}</Text>
                    <Ionicons name="close" size={14} color={C.err} />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        <Text style={{ color: C.text2, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 }}>
          {filtered.length} {t('req_title').replace('📋 ', '')}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPress={() => navigation.navigate('RequestDetail', { id: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: C.text, fontWeight: '700' }}>{t('req_not_found')}</Text>
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 4 }}>{t('home_try_filter')}</Text>
            </View>
          ) : null
        }
      />
      <FilterModal
        visible={showFilter}
        initialCat={cat}
        initialSubcat={subcat}
        initialCity={city}
        initialMinBudget={minBudget}
        initialMaxBudget={maxBudget}
        initialStatus={status}
        initialUrgent={urgent}
        onClose={() => setShowFilter(false)}
        onApply={({ cat: c, subcat: sc, city: ci, minBudget: mn, maxBudget: mx, status: st, urgent: ug }) => {
          setCat(c); setSubcat(sc); setCity(ci);
          setMinBudget(mn); setMaxBudget(mx); setStatus(st); setUrgent(ug);
        }}
      />
    </View>
  );
}
