# MyFix.ge — Expo Mobile App

React Native აპლიკაცია iOS და Android-ისთვის.

## სწრაფი დაყენება

### 1. Node.js & Expo CLI
```bash
npm install -g expo-cli eas-cli
```

### 2. პაკეტების ინსტალაცია
```bash
cd xelosani-app
npm install
```

### 3. API URL-ის კონფიგურაცია
`app.json`-ში შეცვალე:
```json
"extra": {
  "apiBase": "https://myfix.ge/api"
}
```
(ლოკალური ტესტისთვის: `"http://YOUR_IP:3000/api"`)

### 4. გაშვება
```bash
# Expo Go (ყველაზე სწრაფი)
npx expo start

# Android emulator
npx expo start --android

# iOS simulator (Mac only)
npx expo start --ios
```

სტელეფონზე სკანირება: QR კოდი → Expo Go აპი

---

## ფაილების სტრუქტურა

```
xelosani-app/
├── App.js                          # Root component
├── app.json                        # Expo config
├── package.json
├── babel.config.js
└── src/
    ├── utils/
    │   ├── api.js                  # API client (fetch wrapper)
    │   ├── socket.js               # Socket.io client
    │   └── theme.js                # Colors & styles
    ├── context/
    │   └── AuthContext.js          # Auth state (login/logout/user)
    ├── navigation/
    │   └── AppNavigator.js         # Stack + Tab navigation
    ├── components/
    │   ├── UI.js                   # Btn, Avatar, PlanBadge, Stars, Tag...
    │   ├── HandymanCard.js         # Ხელოსნის ბარათი სიაში
    │   └── RequestCard.js          # მოთხოვნის ბარათი
    └── screens/
        ├── auth/
        │   ├── LoginScreen.js
        │   ├── RegisterScreen.js
        │   ├── VerifyScreen.js     # Email verification (6-digit OTP)
        │   └── ForgotScreen.js     # Password reset
        ├── main/
        │   ├── HomeScreen.js       # Handymen list + filters
        │   ├── RequestsScreen.js   # Public requests
        │   ├── ChatListScreen.js   # My chats
        │   └── ProfileScreen.js    # My profile + logout
        ├── HandymanDetailScreen.js # Full handyman profile
        ├── RequestDetailScreen.js  # Request + offers
        ├── CreateRequestScreen.js  # New request form
        ├── SendOfferScreen.js      # Send offer form
        ├── ChatScreen.js           # Real-time chat (socket.io)
        ├── EditProfileScreen.js    # Edit profile
        ├── ChangePasswordScreen.js
        ├── MyOffersScreen.js
        └── MyRequestsScreen.js
```

## ფუნქციები

- ✅ შესვლა / რეგისტრაცია / ვერიფიკაცია
- ✅ ხელოსნების სია + ფილტრი (კატეგ., ქალაქი, ძიება)
- ✅ VIP / VIP+ / TOP / Pro ბეჯები
- ✅ მოთხოვნების სია + კატეგ. ფილტრი
- ✅ მოთხოვნის შექმნა + ფოტო
- ✅ შეთავაზების გაგზავნა
- ✅ შეთავაზების მიღება → ჩათი
- ✅ Real-time ჩათი (Socket.io)
- ✅ ჩათში ფოტოს გაგზავნა
- ✅ პროფილი + ავატარი
- ✅ პროფილის რედაქტირება
- ✅ პაროლის შეცვლა
- ✅ ჩემი შეთავაზებები / მოთხოვნები

## Build (EAS)

```bash
# eas.json-ის შექმნა
eas build:configure

# Android APK
eas build --platform android --profile preview

# iOS
eas build --platform ios
```

## .env / secrets

EAS-ზე secrets-ს დაამატე:
- eas secret:create — ბოლო ნაბიჯი production build-ზე

API key-ები backend-ზეა, frontend-ი მხოლოდ HTTPS-ით ეკავშირება.
"# MyFix.ge App" 
