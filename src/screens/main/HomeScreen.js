// src/screens/main/HomeScreen.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ScrollView, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C, S } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import HandymanCard from '../../components/HandymanCard';
import { Avatar } from '../../components/UI';

const CATS = ['ყველა', 'ელექტრიკოსი', 'სანტექნიკი', 'მხატვარი', 'დურგალი', 'კონდიციონერი', 'ინტერნეტი'];
const CITIES = ['', 'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი'];

function CompanyCard({ user, onPress }) {
  const now = new Date();
  const avg = user.reviewsReceived?.length
    ? (user.reviewsReceived.reduce((s, r) => s + r.stars, 0) / user.reviewsReceived.length).toFixed(1)
    : null;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: 280,
        backgroundColor: C.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#9b59b655',
        padding: 16,
        marginRight: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <Avatar user={user} size={52} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 14, flex: 1 }} numberOfLines={1}>
              {user.name}
            </Text>
            <View style={{
              backgroundColor: '#9b59b622', borderRadius: 12,
              borderWidth: 1, borderColor: '#9b59b6',
              paddingHorizontal: 6, paddingVertical: 2,
            }}>
              <Text style={{ color: '#9b59b6', fontSize: 10, fontWeight: '800' }}>💜 VIP+</Text>
            </View>
          </View>
          {user.specialties?.length ? (
            <Text style={{ color: '#9b59b6', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              🔧 {user.specialties.slice(0, 2).join(' · ')}
            </Text>
          ) : null}
          {user.city ? (
            <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>📍 {user.city}</Text>
          ) : null}
        </View>
      </View>
      {user.verified && (
        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>✅ ვერიფიცირებული</Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {avg ? <Text style={{ color: '#f1c40f', fontWeight: '700', fontSize: 13 }}>★ {avg} ({user.reviewsReceived.length})</Text> : null}
        <Text style={{ color: C.text2, fontSize: 12 }}>💼 {user.jobs || 0} პროექტი</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [handymen, setHandymen] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ყველა');
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      const data = await api('/users/handymen?' + params.toString());
      const comps = data.filter(h =>
        h.type === 'company' &&
        (h.plan === 'top' || h.vipType === 'vipp') &&
        h.vipExpiresAt && new Date(h.vipExpiresAt) > new Date()
      );
      setCompanies(comps);
      setHandymen(data);
      applyFilters(data, search, category, city);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function applyFilters(list, q, cat, c) {
    let res = list;
    if (q) {
      const lq = q.toLowerCase();
      res = res.filter(h =>
        h.name?.toLowerCase().includes(lq) ||
        h.surname?.toLowerCase().includes(lq) ||
        h.specialty?.toLowerCase().includes(lq)
      );
    }
    if (cat && cat !== 'ყველა') {
      res = res.filter(h =>
        h.specialty?.toLowerCase().includes(cat.toLowerCase()) ||
        h.specialties?.some(s => s.toLowerCase().includes(cat.toLowerCase()))
      );
    }
    setFiltered(res);
  }

  React.useEffect(() => { applyFilters(handymen, search, category, city); }, [search, category, city]);
  useFocusEffect(useCallback(() => { load(); }, []));

  const ListHeader = () => (
    <View>
      {/* Page title */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>🔧 ხელოსნები</Text>
        <Text style={{ color: C.text2, fontSize: 13, marginTop: 2 }}>იპოვე სანდო და გამოცდილი ხელოსნები</Text>
      </View>

      {/* Search & filter bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: showFilters ? C.accent + '22' : C.surface,
              borderRadius: 12, borderWidth: 1,
              borderColor: showFilters ? C.accent : C.border,
              paddingHorizontal: 14, paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 14 }}>⚙</Text>
            <Text style={{ color: showFilters ? C.accent : C.text, fontWeight: '600', fontSize: 13 }}>ფილტრები</Text>
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
          </View>
          <TouchableOpacity style={{
            backgroundColor: C.surface, borderRadius: 12,
            borderWidth: 1, borderColor: C.border,
            width: 44, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 16 }}>↕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          {/* Category */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CATS.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
                    borderColor: category === cat ? C.accent : C.border,
                    backgroundColor: category === cat ? C.accent + '22' : C.surface,
                  }}>
                  <Text style={{ color: category === cat ? C.accent : C.text2, fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {/* City */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CITIES.map(c => (
                <TouchableOpacity key={c || 'all'} onPress={() => setCity(c)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
                    borderColor: city === c ? '#3b82f6' : C.border,
                    backgroundColor: city === c ? '#3b82f622' : C.surface,
                  }}>
                  <Text style={{ color: city === c ? '#3b82f6' : C.text2, fontSize: 12 }}>
                    {c || '📍 ყველა'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* VIP+ Companies */}
      {companies.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>👑 VIP+ კომპანიები</Text>
            <TouchableOpacity>
              <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>ყველას ნახვა →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {companies.map(c => (
              <CompanyCard
                key={c.id}
                user={c}
                onPress={() => navigation.navigate('HandymanDetail', { id: c.id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={{ color: C.text2, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 }}>
        {filtered.length} ხელოსანი
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <HandymanCard
            user={item}
            onPress={() => navigation.navigate('HandymanDetail', { id: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔧</Text>
              <Text style={{ color: C.text, fontWeight: '700' }}>ხელოსანი ვერ მოიძებნა</Text>
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 4, textAlign: 'center' }}>სცადე სხვა ფილტრი</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
