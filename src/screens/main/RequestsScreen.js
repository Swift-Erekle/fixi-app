// src/screens/main/RequestsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import RequestCard from '../../components/RequestCard';

const CATS = ['ყველა', 'სანტექნიკი', 'ელექტრიკოსი', 'მხატვარი', 'დურგალი', 'კონდიციონერი', 'სხვა'];
const CITIES = ['', 'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი'];

export default function RequestsScreen({ navigation }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cat, setCat] = useState('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      if (city) params.set('city', city);
      const data = await api('/requests?' + params.toString());
      setRequests(data);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, [cat, city]));

  const filtered = search
    ? requests.filter(r =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  const ListHeader = () => (
    <View>
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

        {/* User add button */}
        {user?.type === 'user' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRequest')}
            style={{
              marginTop: 14,
              backgroundColor: C.accent,
              borderRadius: 14,
              padding: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>+ ახალი მოთხოვნა</Text>
          </TouchableOpacity>
        )}
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
        </View>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CATS.map(c => {
                const active = (c === 'ყველა' && !cat) || c === cat;
                return (
                  <TouchableOpacity key={c} onPress={() => setCat(c === 'ყველა' ? '' : c)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
                      borderColor: active ? C.accent : C.border,
                      backgroundColor: active ? C.accent + '22' : C.surface,
                    }}>
                    <Text style={{ color: active ? C.accent : C.text2, fontSize: 12, fontWeight: '600' }}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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

      <Text style={{ color: C.text2, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 }}>
        {filtered.length} მოთხოვნა
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
    </View>
  );
}
