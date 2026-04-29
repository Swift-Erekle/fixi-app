// src/screens/main/RequestsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import RequestCard from '../../components/RequestCard';
import { CATEGORIES, GEORGIA_CITIES } from '../../utils/categories';

const CITIES = ['', ...GEORGIA_CITIES];

function FilterModal({ visible, initialCat, initialSubcat, initialCity, onClose, onApply }) {
  const [cat, setCat] = useState(initialCat || '');
  const [subcat, setSubcat] = useState(initialSubcat || '');
  const [city, setCity] = useState(initialCity || '');

  useEffect(() => {
    if (visible) { setCat(initialCat || ''); setSubcat(initialSubcat || ''); setCity(initialCity || ''); }
  }, [visible]);

  const selCat = CATEGORIES.find(c => c.name === cat);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <TouchableOpacity onPress={() => { setCat(''); setSubcat(''); setCity(''); }}>
              <Text style={{ color: C.text2, fontWeight: '700', fontSize: 14 }}>გასუფთავება</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>ფილტრები</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.text2} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>კატეგორია</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {CATEGORIES.map(c => (
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
                  <Text style={{ color: cat === c.name ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{c.name}</Text>
                  {cat === c.name && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                </TouchableOpacity>
              ))}
            </View>

            {selCat && selCat.subs.length > 0 && (
              <>
                <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>ქვეკატეგორია</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {selCat.subs.map(s => (
                    <TouchableOpacity key={s}
                      onPress={() => setSubcat(subcat === s ? '' : s)}
                      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: subcat === s ? C.accent : C.border, backgroundColor: subcat === s ? C.accent + '22' : C.surface2 }}>
                      <Text style={{ color: subcat === s ? C.accent : C.text2, fontWeight: '600', fontSize: 13 }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>ქალაქი</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {CITIES.map(c => (
                <TouchableOpacity key={c || 'all'} onPress={() => setCity(c)}
                  style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: city === c ? '#3b82f6' : C.border, backgroundColor: city === c ? '#3b82f622' : C.surface2 }}>
                  <Text style={{ color: city === c ? '#3b82f6' : C.text2, fontWeight: '600', fontSize: 13 }}>
                    {c || '📍 ყველა'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
            <TouchableOpacity
              onPress={() => { onApply({ cat, subcat, city }); onClose(); }}
              style={{ backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>გამოყენება</Text>
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
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cat, setCat] = useState('');
  const [subcat, setSubcat] = useState('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      if (subcat) params.set('specialty', subcat);
      if (city) params.set('city', city);
      const data = await api('/requests?' + params.toString());
      setRequests(data);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, [cat, subcat, city]));

  const filtered = search
    ? requests.filter(r =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  const hasActiveFilters = !!(cat || subcat || city);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Static header — outside FlatList so TextInput never loses focus on re-render */}
      <View style={{ paddingTop: insets.top }}>
        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>📋 მოთხოვნები</Text>
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 2 }}>
                {user?.type === 'user'
                  ? 'აირჩიე შენთვის სასურველი სახსური და დაიქირავე შემსრულებელი!'
                  : 'იპოვე შეკვეთა და გახდი პირველი შემდეგ მომხმარებელთან!'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}
              style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 10, marginLeft: 12 }}>
              <Ionicons name="notifications-outline" size={20} color={C.text2} />
            </TouchableOpacity>
          </View>
          {user?.type === 'user' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateRequest')}
              style={{ marginTop: 14, backgroundColor: C.accent, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>+ ახალი მოთხოვნა</Text>
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
              <Text style={{ color: hasActiveFilters ? C.accent : C.text, fontWeight: '600', fontSize: 13 }}>ფილტრები</Text>
              {hasActiveFilters && (
                <View style={{ backgroundColor: C.accent, borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>
                    {[cat, subcat, city].filter(Boolean).length}
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
                placeholder="ძიება..."
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
                    <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>{cat}</Text>
                    <Ionicons name="close" size={14} color={C.accent} />
                  </TouchableOpacity>
                )}
                {subcat && (
                  <TouchableOpacity onPress={() => setSubcat('')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.accent + '18', borderWidth: 1, borderColor: C.accent + '44' }}>
                    <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600' }}>{subcat}</Text>
                    <Ionicons name="close" size={14} color={C.accent} />
                  </TouchableOpacity>
                )}
                {city && (
                  <TouchableOpacity onPress={() => setCity('')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#3b82f622', borderWidth: 1, borderColor: '#3b82f666' }}>
                    <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '700' }}>📍 {city}</Text>
                    <Ionicons name="close" size={14} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        <Text style={{ color: C.text2, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 }}>
          {filtered.length} მოთხოვნა
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
              <Text style={{ color: C.text, fontWeight: '700' }}>მოთხოვნა ვერ მოიძებნა</Text>
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 4 }}>სცადე სხვა ფილტრი</Text>
            </View>
          ) : null
        }
      />
      <FilterModal
        visible={showFilter}
        initialCat={cat}
        initialSubcat={subcat}
        initialCity={city}
        onClose={() => setShowFilter(false)}
        onApply={({ cat: c, subcat: sc, city: ci }) => { setCat(c); setSubcat(sc); setCity(ci); }}
      />
    </View>
  );
}
