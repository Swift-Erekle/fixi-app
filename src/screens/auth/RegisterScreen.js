import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../utils/theme';
import { api } from '../../utils/api';
import { CATEGORIES } from '../../utils/categories';
import { useLanguage } from '../../context/LanguageContext';
import { Btn, Card } from '../../components/UI';

function Label({ text }) {
  return <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</Text>;
}

function SInput({ value, onChange, placeholder, secure, keyboardType, multiline }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ position: 'relative', marginBottom: 14 }}>
      <TextInput
        style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, paddingRight: secure ? 48 : 13, color: C.text, fontSize: 14, ...(multiline ? { height: 80, textAlignVertical: 'top' } : {}) }}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={C.text2} secureTextEntry={secure && !show}
        keyboardType={keyboardType} autoCapitalize="none"
      />
      {secure && (
        <TouchableOpacity onPress={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: 14 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.text2} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { t, tCat } = useLanguage();
  const [type, setType] = useState('user');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [specs, setSpecs] = useState([]);
  const [desc, setDesc] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const isWorker = type === 'handyman' || type === 'company';

  const TYPES = [
    { key: 'user',     emoji: '👤', label: t('reg_type_user'),     desc: t('reg_type_user_desc') },
    { key: 'handyman', emoji: '🔧', label: t('reg_type_handyman'), desc: t('reg_type_handyman_desc') },
    { key: 'company',  emoji: '🏢', label: t('reg_type_company'),  desc: t('reg_type_company_desc') },
  ];

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) return Alert.alert(t('error'), t('reg_err_required'));
    if (password.length < 8) return Alert.alert(t('error'), t('reg_err_short_pass'));
    if (password !== pass2) return Alert.alert(t('error'), t('reg_err_pass_match'));
    if (isWorker && specs.length === 0) return Alert.alert(t('error'), t('reg_err_specialty'));
    if (isWorker && whatsappEnabled && !phone.trim()) {
      return Alert.alert(t('error'), t('reg_err_whatsapp'));
    }
    setLoading(true);
    try {
      const data = await api('/auth/register', { method: 'POST', body: {
        name: name.trim(), surname: surname.trim(),
        email: email.trim().toLowerCase(), phone: phone.trim(),
        password, type,
        specialty: isWorker ? specs[0] : undefined,
        specialties: isWorker ? specs : undefined,
        desc: isWorker ? desc : undefined,
        whatsappEnabled: isWorker ? whatsappEnabled : undefined,
      }});
      navigation.navigate('Verify', { email: email.trim().toLowerCase(), devCode: data.devCode });
    } catch (e) { Alert.alert(t('error'), e.error || t('reg_err_failed')); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 8 }}>
          <Text style={{ fontSize: 30, fontWeight: '900', color: C.text }}>
            MyFix
          </Text>
          <Text style={{ color: C.text2, fontSize: 13, marginTop: 6 }}>{t('reg_subtitle')}</Text>
        </View>

        <Card>
          <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('reg_account_type')}</Text>
          <View style={{ gap: 8 }}>
            {TYPES.map(tp => (
              <TouchableOpacity key={tp.key} onPress={() => setType(tp.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12,
                  borderWidth: 1.5, borderColor: type === tp.key ? C.accent : C.border,
                  backgroundColor: type === tp.key ? C.accent + '15' : C.surface2,
                }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: type === tp.key ? C.accent : C.border,
                  backgroundColor: type === tp.key ? C.accent : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {type === tp.key && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                </View>
                <Text style={{ fontSize: 18 }}>{tp.emoji}</Text>
                <View>
                  <Text style={{ color: type === tp.key ? C.accent : C.text, fontWeight: '700', fontSize: 14 }}>{tp.label}</Text>
                  <Text style={{ color: C.text2, fontSize: 12 }}>{tp.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <Label text={type === 'company' ? t('reg_company_name') : t('reg_name')} />
          <SInput value={name} onChange={setName} placeholder={type === 'company' ? t('reg_company_ph') : t('reg_name_ph')} />
          {type !== 'company' && (
            <><Label text={t('reg_surname')} /><SInput value={surname} onChange={setSurname} placeholder={t('reg_surname_ph')} /></>
          )}
          <Label text={t('reg_email')} /><SInput value={email} onChange={setEmail} placeholder="you@email.com" keyboardType="email-address" />
          <Label text={t('reg_phone')} /><SInput value={phone} onChange={setPhone} placeholder="+995 5XX XXX XXX" keyboardType="phone-pad" />
          <Label text={t('reg_password')} /><SInput value={password} onChange={setPass} placeholder={t('reg_pass_ph')} secure />
          <Label text={t('reg_repeat')} /><SInput value={pass2} onChange={setPass2} placeholder="••••••••" secure />

          {isWorker && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              padding: 13, borderRadius: 12,
              backgroundColor: whatsappEnabled ? '#25D36615' : C.surface2,
              borderWidth: 1.5, borderColor: whatsappEnabled ? '#25D366' : C.border,
              marginTop: 4,
            }}>
              <Switch
                value={whatsappEnabled}
                onValueChange={setWhatsappEnabled}
                trackColor={{ false: C.border, true: '#25D366' }}
                thumbColor={whatsappEnabled ? '#fff' : '#f4f3f4'}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: whatsappEnabled ? '#25D366' : C.text, fontWeight: '700', fontSize: 14 }}>
                  {t('reg_whatsapp')}
                </Text>
                <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }}>{t('reg_whatsapp_desc')}</Text>
              </View>
            </View>
          )}
        </Card>

        {isWorker && (
          <Card>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('reg_specialty')}</Text>
            {specs.length > 0 && (
              <Text style={{ color: C.accent, fontSize: 12, marginBottom: 10 }}>{t('reg_selected')} {specs.map(s => tCat(s)).join(', ')}</Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              {CATEGORIES.map(c => {
                const sel = specs.includes(c.name);
                return (
                  <TouchableOpacity key={c.name}
                    onPress={() => setSpecs(prev => sel ? prev.filter(s => s !== c.name) : [...prev, c.name])}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14,
                      borderWidth: 1.5, borderColor: sel ? C.accent : C.border,
                      backgroundColor: sel ? C.accent + '18' : C.surface2,
                      minWidth: '45%', flex: 1,
                    }}>
                    <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                    <Text style={{ color: sel ? C.accent : C.text, fontWeight: '700', fontSize: 13, flex: 1 }}>{tCat(c.name)}</Text>
                    {sel && <Ionicons name="checkmark-circle" size={16} color={C.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ color: C.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('reg_desc_label')}</Text>
            <TextInput
              style={{ backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 13, color: C.text, fontSize: 14, height: 80, textAlignVertical: 'top' }}
              placeholder={t('reg_desc_placeholder')} placeholderTextColor={C.text2}
              value={desc} onChangeText={setDesc} multiline
            />
          </Card>
        )}

        {isWorker && (
          <View style={{ backgroundColor: '#10b98115', borderRadius: 14, borderWidth: 1, borderColor: '#10b98130', padding: 14, marginBottom: 16 }}>
            <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
              {t('reg_trial')}
            </Text>
          </View>
        )}

        <Btn title={t('reg_btn')} onPress={handleRegister} loading={loading} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: C.text2, fontSize: 14 }}>
            {t('reg_has_account')}{' '}
            <Text style={{ color: C.accent, fontWeight: '800' }}>{t('reg_login')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
