import auth from '@react-native-firebase/auth';

function phoneAuthErrorMessage(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-verification-code') {
    return 'SMS კოდი არასწორია. თუ ხელახლა გამოაგზავნე, ბოლო მოსული SMS კოდი შეიყვანე.';
  }
  if (code === 'auth/code-expired' || code === 'auth/session-expired') {
    return 'SMS კოდს ვადა გაუვიდა. ხელახლა გაგზავნე და ახალი კოდი შეიყვანე.';
  }
  if (code === 'auth/too-many-requests') {
    return 'ძალიან ბევრი SMS მოთხოვნაა. ცოტა ხანში ისევ სცადე.';
  }
  return err?.message || 'SMS ვერიფიკაცია ვერ შესრულდა';
}

export async function sendPhoneCode(phone) {
  try {
    return await auth().signInWithPhoneNumber(phone);
  } catch (err) {
    throw new Error(phoneAuthErrorMessage(err));
  }
}

export async function confirmPhoneCode(confirmation, code) {
  if (!confirmation) throw new Error('SMS confirmation was not started');
  try {
    const credential = await confirmation.confirm(code);
    return await credential.user.getIdToken(true);
  } catch (err) {
    throw new Error(phoneAuthErrorMessage(err));
  }
}
