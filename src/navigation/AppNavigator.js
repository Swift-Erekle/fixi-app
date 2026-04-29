import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyScreen from '../screens/auth/VerifyScreen';
import ForgotScreen from '../screens/auth/ForgotScreen';
import HomeScreen from '../screens/main/HomeScreen';
import RequestsScreen from '../screens/main/RequestsScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import HandymanDetailScreen from '../screens/HandymanDetailScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import SendOfferScreen from '../screens/SendOfferScreen';
import ChatScreen from '../screens/ChatScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import MyOffersScreen from '../screens/MyOffersScreen';
import MyRequestsScreen from '../screens/MyRequestsScreen';
import VipScreen from '../screens/VipScreen';
import CardScreen from '../screens/CardScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SupportScreen from '../screens/SupportScreen';
import ARIAScreen from '../screens/ARIAScreen';
import ProposalsScreen from '../screens/ProposalsScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminSupportChatScreen from '../screens/AdminSupportChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const NAV_THEME = {
  dark: true,
  colors: { background: C.bg, card: C.surface, text: C.text, border: C.border, primary: C.accent, notification: C.accent },
};

const SCREEN_OPT = {
  headerStyle: { backgroundColor: C.surface, shadowColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTintColor: C.text,
  headerTitleStyle: { fontWeight: '800', fontSize: 16 },
  cardStyle: { backgroundColor: C.bg },
};

const TAB_LABELS = {
  Home: 'ხელოსნები',
  Requests: 'მოთხოვნები',
  Chats: 'ჩათები',
  ARIA: 'ARIA',
  Admin: 'ადმინი',
  Profile: 'პროფილი',
};

const TAB_ICONS = {
  Home: ['people', 'people-outline'],
  Requests: ['document-text', 'document-text-outline'],
  Chats: ['chatbubbles', 'chatbubbles-outline'],
  Profile: ['person', 'person-outline'],
};

function tabScreenOptions({ route }) {
  return {
    tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1, height: 62, paddingBottom: 10, paddingTop: 8 },
    tabBarActiveTintColor: route.name === 'ARIA' ? '#a78bfa' : route.name === 'Admin' ? '#10b981' : C.accent,
    tabBarInactiveTintColor: C.text2,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    tabBarLabel: TAB_LABELS[route.name],
    headerShown: false,
    tabBarIcon: ({ color, focused }) => {
      if (route.name === 'ARIA') {
        return (
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: focused ? '#a78bfa22' : 'transparent', borderWidth: focused ? 1 : 0, borderColor: '#a78bfa66', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>✨</Text>
          </View>
        );
      }
      if (route.name === 'Admin') {
        return (
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: focused ? '#10b98122' : 'transparent', borderWidth: focused ? 1 : 0, borderColor: '#10b98166', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
          </View>
        );
      }
      const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
      return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
    },
  };
}

function UserTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="ARIA" component={ARIAScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function StaffTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Admin" component={AdminScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function HomeTabs() {
  const { user } = useAuth();
  const isStaff = user?.type === 'admin' || user?.type === 'staff';
  return isStaff ? <StaffTabs /> : <UserTabs />;
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...SCREEN_OPT, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'რეგისტრაცია' }} />
      <Stack.Screen name="Verify" component={VerifyScreen} options={{ headerShown: true, title: 'ვერიფიკაცია' }} />
      <Stack.Screen name="Forgot" component={ForgotScreen} options={{ headerShown: true, title: 'პაროლის აღდგენა' }} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPT}>
      <Stack.Screen name="Tabs" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="HandymanDetail" component={HandymanDetailScreen} options={{ title: 'ხელოსანი' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'მოთხოვნა' }} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'ახალი მოთხოვნა' }} />
      <Stack.Screen name="SendOffer" component={SendOfferScreen} options={{ title: 'შეთავაზება' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'ჩათი' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'პროფილი' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'პაროლი' }} />
      <Stack.Screen name="MyOffers" component={MyOffersScreen} options={{ title: 'ჩემი შეთავაზებები' }} />
      <Stack.Screen name="MyRequests" component={MyRequestsScreen} options={{ title: 'ჩემი მოთხოვნები' }} />
      <Stack.Screen name="Proposals" component={ProposalsScreen} options={{ title: 'Proposals' }} />
      <Stack.Screen name="Vip" component={VipScreen} options={{ title: 'VIP' }} />
      <Stack.Screen name="Cards" component={CardScreen} options={{ title: 'ბარათები' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'შენახული' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'სუპორტი' }} />
      <Stack.Screen name="AdminSupportChat" component={AdminSupportChatScreen} options={{ title: 'სუპორტი' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'შეტყობინებები' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'რეგისტრაცია' }} />
      <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'ვერიფიკაცია' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator({ navigationRef }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: C.text, marginBottom: 20 }}>
          Fixi<Text style={{ color: C.accent }}>.ge</Text>
        </Text>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NAV_THEME} ref={navigationRef}>
      {user ? <MainStack key="main" /> : <AuthStack key="auth" />}
    </NavigationContainer>
  );
}
