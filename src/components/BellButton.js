// src/components/BellButton.js
// ✅ Reusable bell button with animated unread count badge
// Usage: <BellButton navigation={navigation} />
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';

export default function BellButton({ navigation, style }) {
  const { unreadCount } = useAuth();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(unreadCount);

  // ✅ Pop animation when new notification arrives
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
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={[{
        backgroundColor: unreadCount > 0 ? C.accent + '18' : C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: unreadCount > 0 ? C.accent + '66' : C.border,
        padding: 10,
        position: 'relative',
      }, style]}
      activeOpacity={0.75}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={20}
        color={unreadCount > 0 ? C.accent : C.text2}
      />

      {/* ✅ Badge — visible only when unread > 0 */}
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
          <Text style={{
            color: '#fff',
            fontSize: 10,
            fontWeight: '900',
            lineHeight: 13,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}
