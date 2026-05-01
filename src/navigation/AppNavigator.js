import React from 'react';
import { View, Text, ActivityIndicator, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
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

const PLAN_PRICES = { handyman: { pro: 29, top: 69 }, company: { pro: 99, top: 159 } };

function PlanPickerModal({ visible, onDismiss, onPickPlan }) {
  const { user } = useAuth();
  const type = user?.type === 'company' ? 'company' : 'handyman';
  const prices = PLAN_PRICES[type];

  const plans = [
    {
      key: 'start', icon: '🆓', label: 'Start', price: '0', accent: C.text2,
      features: ['მოთხოვნებზე შეთავაზება', 'ბაზარში განთავსება', 'ჩათი კლიენტებთან'],
    },
    {
      key: 'pro', icon: '⚡', label: 'Pro', price: `${prices.pro}`, accent: '#3498db',
      features: ['ყველა Start-ის შეძლება', 'Pro ბეჯი', 'პრიორიტეტული ჩვენება', 'ვერიფიკაციის შესაძლებლობა'],
    },
    {
      key: 'top', icon: '🔝', label: 'TOP', price: `${prices.top}`, accent: '#f1c40f',
      features: ['ყველა Pro-ს შეძლება', 'TOP-ი ბეჯი', 'პირველი პოზიციები', 'ფეიჩერდ სია'],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'center' }}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>🎉 მოგესალმებით!</Text>
            <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center' }}>
              აირჩიეთ თქვენი სამუშაო ტარიფი — ნებისმიერ დროს შეგიძლიათ შეცვლა.
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
            {plans.map(p => (
              <TouchableOpacity key={p.key} onPress={() => p.key === 'start' ? onDismiss() : onPickPlan()}
                activeOpacity={0.85}
                style={{ backgroundColor: C.surface2, borderRadius: 16, borderWidth: 1.5, borderColor: p.accent + (p.key === 'start' ? '44' : '88'), padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 24 }}>{p.icon}</Text>
                    <Text style={{ color: p.key === 'start' ? C.text2 : p.accent, fontWeight: '900', fontSize: 18 }}>{p.label}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: p.accent, fontSize: p.key === 'start' ? 16 : 22, fontWeight: '900' }}>
                      {p.key === 'start' ? 'უფასო' : `${p.price}₾`}
                    </Text>
                    {p.key !== 'start' && <Text style={{ color: C.text2, fontSize: 11 }}>/თვე</Text>}
                  </View>
                </View>
                {p.features.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: '#10b981', fontSize: 13 }}>✓</Text>
                    <Text style={{ color: C.text2, fontSize: 13 }}>{f}</Text>
                  </View>
                ))}
                <View style={{ marginTop: 12, backgroundColor: p.accent + '18', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: p.accent + '33' }}>
                  <Text style={{ color: p.accent, fontWeight: '700', fontSize: 14 }}>
                    {p.key === 'start' ? 'უფასოდ გაგრძელება' : `${p.label}-ის გამოწერა →`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
            <TouchableOpacity onPress={onDismiss} style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ color: C.text2, fontSize: 14 }}>მოგვიანებით</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
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
  const { user, showPlanPicker, dismissPlanPicker } = useAuth();
  const navigation = useNavigation();
  const isStaff = user?.type === 'admin' || user?.type === 'staff';
  return (
    <>
      {isStaff ? <StaffTabs /> : <UserTabs />}
      <PlanPickerModal
        visible={showPlanPicker}
        onDismiss={dismissPlanPicker}
        onPickPlan={() => { dismissPlanPicker(); navigation.navigate('Vip'); }}
      />
    </>
  );
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
      {user ? <MainStack key={user.id} /> : <AuthStack key="auth" />}
    </NavigationContainer>
  );
}
