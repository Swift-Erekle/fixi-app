import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import { GEORGIA_CITIES } from '../utils/categories';
import { useLanguage } from '../context/LanguageContext';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export default function CityDropdown({ value, onChange, style }) {
  const { t, tCity } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState(value ? tCity(value) : '');
  const keepTypedQueryRef = useRef(false);
  const selectedLabel = value ? tCity(value) : '';

  useEffect(() => {
    if (keepTypedQueryRef.current) {
      keepTypedQueryRef.current = false;
      return;
    }
    setQuery(value ? tCity(value) : '');
  }, [value, tCity]);

  const filteredCities = useMemo(() => {
    const q = normalize(query);
    if (value && q === normalize(selectedLabel)) return GEORGIA_CITIES;
    if (!q) return GEORGIA_CITIES;
    return GEORGIA_CITIES.filter((city) => {
      const translated = normalize(tCity(city));
      const original = normalize(city);
      return translated.includes(q) || original.includes(q);
    });
  }, [query, selectedLabel, tCity, value]);

  function handleQueryChange(text) {
    setQuery(text);
    setExpanded(true);
    if (value && normalize(text) !== normalize(selectedLabel)) {
      keepTypedQueryRef.current = true;
      onChange('');
    }
  }

  function selectCity(city) {
    onChange(city);
    setQuery(city ? tCity(city) : '');
    setExpanded(false);
    Keyboard.dismiss();
  }

  return (
    <View style={[{ marginBottom: 24 }, style]}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface2,
        borderWidth: 1.5,
        borderColor: expanded ? '#3b82f6' : value ? '#3b82f699' : C.border,
        borderRadius: 14,
        paddingHorizontal: 12,
      }}>
        <Text style={{ fontSize: 17, marginRight: 8 }}>📍</Text>
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          onFocus={() => setExpanded(true)}
          placeholder={t('city_search_ph')}
          placeholderTextColor={C.text2}
          style={{ flex: 1, color: C.text, fontSize: 14, paddingVertical: 13, fontWeight: value ? '700' : '500' }}
          autoCorrect={false}
        />
        {(query || value) ? (
          <TouchableOpacity
            onPress={() => {
              onChange('');
              setQuery('');
              setExpanded(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={C.text2} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={() => setExpanded((open) => !open)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ padding: 4, marginLeft: 2 }}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={expanded ? '#3b82f6' : C.text2} />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={{
          marginTop: 8,
          maxHeight: 230,
          backgroundColor: C.surface2,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              onPress={() => selectCity('')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.border + '88',
                backgroundColor: value ? 'transparent' : '#3b82f61a',
              }}>
              <Text style={{ color: value ? C.text2 : '#3b82f6', fontSize: 14, fontWeight: '800' }}>
                {t('filter_all_cities')}
              </Text>
              {!value ? <Ionicons name="checkmark-circle" size={17} color="#3b82f6" /> : null}
            </TouchableOpacity>

            {filteredCities.length ? filteredCities.map((city) => {
              const active = city === value;
              return (
                <TouchableOpacity
                  key={city}
                  onPress={() => selectCity(city)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: C.border + '55',
                    backgroundColor: active ? '#3b82f61a' : 'transparent',
                  }}>
                  <Text style={{ color: active ? '#3b82f6' : C.text, fontSize: 14, fontWeight: active ? '800' : '600' }}>
                    {tCity(city)}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={17} color="#3b82f6" /> : null}
                </TouchableOpacity>
              );
            }) : (
              <View style={{ paddingHorizontal: 14, paddingVertical: 16 }}>
                <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center' }}>{t('city_no_results')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
