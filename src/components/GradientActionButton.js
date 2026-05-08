import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientActionButton({ title, icon, colors, shadowColor, onPress, style }) {
  const gradientColors = colors?.length >= 2 ? colors : ['#ff6b2b', '#ff8c55'];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.86}
      style={[
        styles.button,
        shadowColor ? { shadowColor } : null,
        style,
      ]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    backgroundColor: '#ff6b2b',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  gradient: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  icon: {
    color: '#fff',
    fontSize: 15,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
