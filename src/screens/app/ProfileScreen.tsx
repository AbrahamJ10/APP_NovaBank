import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import Screen from '../../components/Screen';
import { Badge, OtpBoxes } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { DangerOutlineButton, GhostButton, PrimaryButton } from '../../components/Buttons';
import BottomSheet from '../../components/BottomSheet';
import Icon from '../../components/Icon';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLastAccount } from '../../lib/secureTokens';

type Nav = CompositeNavigationProp<NativeStackNavigationProp<RootStackParamList>, BottomTabNavigationProp<TabParamList>>;

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, logout, requestProfileOtp, confirmEmailChange, confirmPhoneChange, changePassword } = useAppState();

  // Refleja la misma verificación de LoginScreen — Face ID aquí significa
  // "el desbloqueo nativo por huella/rostro de este dispositivo de verdad
  // está registrado y puede hacer login rápido de esta cuenta", no alguna
  // configuración separada por cuenta.
  const [faceIdOn, setFaceIdOn] = useState(false);
  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(), getLastAccount()])
      .then(([hw, enrolled, remembered]) => setFaceIdOn(hw && enrolled && !!remembered))
      .catch(() => setFaceIdOn(false));
  }, []);

  const [editing, setEditing] = useState<{ field: 'email' | 'phone'; label: string } | null>(null);
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [submittingCode, setSubmittingCode] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwStep, setPwStep] = useState<'form' | 'otp' | 'done'>('form');
  const [currentPass, setCurrentPass] = useState('');
  const [currentPassError, setCurrentPassError] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [pwCode, setPwCode] = useState('');
  const [pwCodeError, setPwCodeError] = useState<string | null>(null);
  const [pwSendingOtp, setPwSendingOtp] = useState(false);
  const [pwSendError, setPwSendError] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const pwInputRef = useRef<TextInput>(null);

  const openEdit = async (field: 'email' | 'phone', label: string, current: string) => {
    setEditing({ field, label });
    setValue(current);
    setCode('');
    setCodeError(null);
    setSendError(null);
    setSendingOtp(true);
    const result = await requestProfileOtp();
    setSendingOtp(false);
    if (!result.ok) setSendError(result.message);
  };

  const submit = async (v: string) => {
    if (v.length !== 6 || !editing || submittingCode) return;
    setSubmittingCode(true);
    setCodeError(null);
    const result = editing.field === 'email' ? await confirmEmailChange(value, v) : await confirmPhoneChange(value, v);
    setSubmittingCode(false);
    if (!result.ok) {
      setCodeError(result.message);
      setCode('');
      return;
    }
    setEditing(null);
  };

  const ruleLen = newPass.length >= 10;
  const ruleNum = /\d/.test(newPass);
  const ruleUp = /[A-Z]/.test(newPass);
  const ruleLow = /[a-z]/.test(newPass);
  const newPassValid = ruleLen && ruleNum && ruleUp && ruleLow;
  const confirmValid = confirmPass.length > 0 && confirmPass === newPass;

  const closePasswordSheet = () => {
    setPwOpen(false);
    setPwStep('form');
    setCurrentPass('');
    setCurrentPassError(false);
    setNewPass('');
    setConfirmPass('');
    setPwCode('');
    setPwCodeError(null);
    setPwSendError(null);
  };

  const submitPasswordForm = async () => {
    setCurrentPassError(false);
    setPwSendError(null);
    setPwSendingOtp(true);
    const result = await requestProfileOtp();
    setPwSendingOtp(false);
    if (!result.ok) {
      setPwSendError(result.message);
      return;
    }
    setPwStep('otp');
  };

  const submitPasswordOtp = async (v: string) => {
    if (v.length !== 6 || pwSubmitting) return;
    setPwSubmitting(true);
    setPwCodeError(null);
    const result = await changePassword(currentPass, newPass, v);
    setPwSubmitting(false);
    if (!result.ok) {
      if (result.message.includes('contraseña actual')) {
        setPwStep('form');
        setCurrentPassError(true);
      } else {
        setPwCodeError(result.message);
      }
      setPwCode('');
      return;
    }
    setPwStep('done');
  };

  const fields = [
    { label: t('profile.fullName'), value: user.name },
    { label: t('profile.dni'), value: user.dni },
    { label: t('profile.email'), value: user.email, edit: () => openEdit('email', t('profile.emailField'), user.email) },
    { label: t('profile.phone'), value: '+51 ' + user.phone, edit: () => openEdit('phone', t('profile.phoneField'), user.phone) },
  ];

  return (
    <Screen bg={theme.bg}>
      <View style={{ alignItems: 'flex-end' }}>
        <LanguageSwitch />
      </View>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 86, height: 86, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B2340', borderWidth: 2, borderColor: '#C9A227' }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 30, color: '#fff' }}>{user.initials}</Text>
        </View>
        <Text style={{ marginTop: 14, fontFamily: fonts.heading, fontSize: 19, letterSpacing: -0.4, color: theme.ink }}>{user.name}</Text>
        <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{t('profile.memberSince', { date: user.memberSince })}</Text>
        <View style={{ marginTop: 12 }}>
          <Badge label={t('profile.identityVerified')} tone="green" />
        </View>
      </View>

      <View style={{ marginTop: 22, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16 }}>
        {fields.map((f, i) => (
          <View key={f.label} style={{ paddingVertical: 14, borderBottomWidth: i < fields.length - 1 ? 1 : 0, borderBottomColor: theme.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{f.label}</Text>
              <Text style={{ marginTop: 3, fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{f.value}</Text>
            </View>
            {f.edit ? (
              <Pressable onPress={f.edit} hitSlop={8}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: theme.gold }}>{t('profile.edit')}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16 }}>
        <ProfileRow icon="password" label={t('profile.changePassword')} desc={t('profile.changePasswordDesc')} onPress={() => setPwOpen(true)} />
        <ProfileRow
          icon="fingerprint"
          label={t('profile.faceId')}
          desc={faceIdOn ? t('profile.faceIdDesc') : t('profile.faceIdDescOff')}
          right={faceIdOn ? <Badge label={t('profile.active')} tone="green" /> : <Badge label={t('profile.inactive')} tone="neutral" />}
        />
        <ProfileRow icon="shield" label={t('profile.securityCenter')} desc={t('profile.securityCenterDesc')} onPress={() => nav.navigate('Security')} />
        <ProfileRow icon="description" label={t('profile.accountStatement')} desc={t('profile.accountStatementDesc')} onPress={() => nav.navigate('Reports')} last />
      </View>

      <DangerOutlineButton label={t('profile.logout')} icon="logout" onPress={logout} style={{ marginTop: 16 }} />

      <BottomSheet visible={!!editing} onShow={() => inputRef.current?.focus()} onClose={() => setEditing(null)}>
        {editing ? (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('profile.editField', { field: editing.label })}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('profile.criticalField')}
            </Text>
            <View style={{ marginTop: 18 }}>
              <TextField
                value={value}
                onChangeText={(v) => setValue(editing.field === 'phone' ? v.replace(/\D/g, '').slice(0, 9) : v)}
                autoCapitalize="none"
                keyboardType={editing.field === 'phone' ? 'number-pad' : 'email-address'}
              />
            </View>
            <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: 16 }}>
              <OtpBoxes value={code} />
            </Pressable>
            <TextInput
              ref={inputRef}
              value={code}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(v) => {
                const d = v.replace(/\D/g, '').slice(0, 6);
                setCode(d);
                setCodeError(null);
                if (d.length === 6) submit(d);
              }}
              style={{ position: 'absolute', opacity: 0, height: 0 }}
            />
            {sendError ? (
              <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{sendError}</Text>
            ) : codeError ? (
              <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{codeError}</Text>
            ) : sendingOtp ? (
              <Text style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{t('profile.sendingCode')}</Text>
            ) : null}
            <PrimaryButton
              label={submittingCode ? t('profile.verifying') : t('profile.saveChange')}
              onPress={() => submit(code)}
              disabled={code.length !== 6 || submittingCode || sendingOtp}
              style={{ marginTop: 18 }}
            />
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={pwOpen} onClose={closePasswordSheet}>
        {pwStep === 'form' && (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('profile.changePasswordTitle')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('profile.changePasswordSubtitle')}
            </Text>
            <View style={{ marginTop: 18, gap: 12 }}>
              <TextField
                label={t('profile.currentPassword')}
                icon="lock"
                secureTextEntry
                value={currentPass}
                onChangeText={(v) => {
                  setCurrentPass(v);
                  setCurrentPassError(false);
                }}
                status={currentPassError ? 'error' : 'default'}
                hint={currentPassError ? t('profile.currentPasswordMismatch') : undefined}
              />
              <TextField label={t('profile.newPassword')} icon="lock" secureTextEntry value={newPass} onChangeText={setNewPass} />
              <View style={{ gap: 6 }}>
                <RuleLine ok={ruleLen} label={t('profile.ruleLen')} />
                <RuleLine ok={ruleNum} label={t('profile.ruleNum')} />
                <RuleLine ok={ruleUp} label={t('profile.ruleUp')} />
                <RuleLine ok={ruleLow} label={t('profile.ruleLow')} />
              </View>
              <TextField
                label={t('profile.repeatNewPassword')}
                icon="lock"
                secureTextEntry
                value={confirmPass}
                onChangeText={setConfirmPass}
                status={confirmPass.length === 0 ? 'default' : confirmValid ? 'success' : 'error'}
              />
            </View>
            {pwSendError ? (
              <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{pwSendError}</Text>
            ) : null}
            <PrimaryButton
              label={pwSendingOtp ? t('profile.sendingCode') : t('profile.continue')}
              onPress={submitPasswordForm}
              disabled={currentPass.length === 0 || !newPassValid || !confirmValid || pwSendingOtp}
              style={{ marginTop: 20 }}
            />
            <GhostButton label={t('profile.cancel')} onPress={closePasswordSheet} style={{ marginTop: 10 }} />
          </View>
        )}

        {pwStep === 'otp' && (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('profile.confirmChangeTitle')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('profile.confirmChangeSubtitle')}
            </Text>
            <Pressable onPress={() => pwInputRef.current?.focus()} style={{ marginTop: 18 }}>
              <OtpBoxes value={pwCode} />
            </Pressable>
            <TextInput
              ref={pwInputRef}
              value={pwCode}
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(v) => {
                const d = v.replace(/\D/g, '').slice(0, 6);
                setPwCode(d);
                setPwCodeError(null);
                if (d.length === 6) submitPasswordOtp(d);
              }}
              style={{ position: 'absolute', opacity: 0, height: 0 }}
            />
            {pwCodeError ? <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{pwCodeError}</Text> : null}
            <PrimaryButton
              label={pwSubmitting ? t('profile.verifying') : t('profile.confirm')}
              onPress={() => submitPasswordOtp(pwCode)}
              disabled={pwCode.length !== 6 || pwSubmitting}
              style={{ marginTop: 18 }}
            />
          </View>
        )}

        {pwStep === 'done' && (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={36} color={theme.green} />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 19, color: theme.ink }}>{t('profile.passwordUpdated')}</Text>
            <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
              {t('profile.passwordUpdatedBody')}
            </Text>
            <PrimaryButton label={t('profile.done')} onPress={closePasswordSheet} style={{ marginTop: 18, width: '100%' }} />
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}

function RuleLine({ ok, label }: { ok: boolean; label: string }) {
  const { theme } = useTheme();
  const color = ok ? theme.green : theme.soft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icon name={ok ? 'check_circle' : 'radio_button_unchecked'} size={15} color={color} />
      <Text style={{ fontFamily: fonts.bodyMed, fontSize: 11.5, color }}>{label}</Text>
    </View>
  );
}

function ProfileRow({ icon, label, desc, onPress, right, last }: { icon: string; label: string; desc: string; onPress?: () => void; right?: React.ReactNode; last?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line },
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={theme.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{label}</Text>
        <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{desc}</Text>
      </View>
      {right ?? (onPress ? <Icon name="chevron_right" size={18} color="#A6B1BD" /> : null)}
    </Pressable>
  );
}
