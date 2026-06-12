const rnFirebaseAppPlugin = require('@react-native-firebase/app/app.plugin.js').default;
const rnFirebaseAuthPlugin = require('@react-native-firebase/auth/app.plugin.js').default;

module.exports = function withReactNativeFirebase(config) {
  return rnFirebaseAuthPlugin(rnFirebaseAppPlugin(config));
};
