import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { C } from '../utils/theme';

export default function BellButton({ navigation, style }) {
  const { unreadCount } = useAuth();
  const { switchLang, currentLang } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCount.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true, speed: 40, bounciness: 18 }),
        Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 6  }),
      ]).start();
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      {/* Language switcher — left of bell */}
      <TouchableOpacity
        onPress={switchLang}
        style={{
          backgroundColor: C.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 20, lineHeight: 24 }}>{currentLang?.flag || '🇬🇪'}</Text>
      </TouchableOpacity>

      {/* Bell */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        style={{
          backgroundColor: unreadCount > 0 ? C.accent + '18' : C.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: unreadCount > 0 ? C.accent + '66' : C.border,
          padding: 10,
          position: 'relative',
        }}
        activeOpacity={0.75}
      >
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={20}
          color={unreadCount > 0 ? C.accent : C.text2}
        />
        {unreadCount > 0 && (
          <Animated.View style={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: C.err,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: C.bg,
            transform: [{ scale: scaleAnim }],
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', lineHeight: 13 }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
}
