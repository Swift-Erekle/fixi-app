// App.js
import 'react-native-gesture-handler';
import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { addNotificationListeners, getInitialNotification } from './src/utils/notifications';
import Constants from 'expo-constants';
console.log('[CONFIG] apiBase:', Constants.expoConfig?.extra?.apiBase);
// navigationRef is used to navigate from outside React components
// (e.g. when user taps a push notification that opens the app cold)
export const navigationRef = React.createRef();
// ✅ FIX: expose navigationRef globally so AuthContext can reset on logout
global.navigationRef = navigationRef;

function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

function handleNotificationResponse(response) {
  const data = response?.notification?.request?.content?.data;
  if (!data) return;
  // Route based on notification type
  if (data.type === 'review_reminder' && data.handymanId) {
    navigate('HandymanDetail', { id: data.handymanId, focusReview: true });
  } else if (data.chatId) {
    navigate('Chat', { chatId: data.chatId, title: data.title || 'ჩათი' });
  } else if (data.requestId) {
    navigate('RequestDetail', { id: data.requestId });
  } else if (data.screen === 'Chats') {
    navigate('Tabs', { screen: 'Chats' });
  } else if (data.type === 'support') {
    navigate('Support');
  }
}

export default function App() {
  useEffect(() => {
    // Handle notification taps while app is running or in background
    const cleanup = addNotificationListeners(
      (notification) => {
        // Foreground: notification received — no extra action needed,
        // setNotificationHandler in notifications.js shows the banner
        console.log('[PUSH] Received:', notification.request.content.title);
      },
      handleNotificationResponse
    );

    // Cold start: user tapped a notification that launched the app
    getInitialNotification().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#0f0f13" />
          <AppNavigator navigationRef={navigationRef} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
