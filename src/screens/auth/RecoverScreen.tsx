import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, OtpBoxes } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { mmss } from '../../lib/format';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ApiError, authApi } from '../../lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El "Datos inválidos" (400) genérico del backend cubre cualquier falla de
// validación de Zod — esto extrae el mensaje específico del campo cuando
// existe, para que un desajuste entre las reglas de esta pantalla y las
// del backend nunca sea un callejón sin salida para quien lo encuentre.
function describeApiError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  const fieldErrors = (err.details as any)?.fieldErrors as Record<string, string[]> | undefined;
  const firstField = fieldErrors && Object.values(fieldErrors).find((msgs) => msgs?.length);
  return firstField?.[0] ?? err.message ?? fallback;
}
// Coincide con la expiración propia del OTP del backend (otp.service.ts,
// OTP_TTL_MS) — una vez que se pide un código, toda la ventana de "ingresa
// el código + pon la nueva contraseña" se cierra en el mismo momento en
// que el código deja de ser válido del lado del servidor.
const FLOW_TTL_MS = 10 * 60 * 1000;

export default function RecoverScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { startRecover, otpLeft, resendOtp } = useAppState();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [repeat, setRepeat] = useState('');
  const [passVisible, setPassVisible] = useState(false);
  const [repeatVisible, setRepeatVisible] = useState(false);
  const [flowDeadline, setFlowDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<TextInput>(null);

  const email = identifier.trim().toLowerCase();

  // Una vez que un código sale, se limita cuánto tiempo alguien puede
  // quedarse en esta pantalla con un restablecimiento pendiente activo —
  // solo avanza mientras de verdad sea relevante.
  useEffect(() => {
    if (!flowDeadline || (step !== 2 && step !== 3)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [flowDeadline, step]);

  const flowLeft = flowDeadline ? Math.max(0, Math.round((flowDeadline - now) / 1000)) : 0;

  useEffect(() => {
    if (!flowDeadline || (step !== 2 && step !== 3)) return;
    if (flowLeft > 0) return;
    setFlowDeadline(null);
    setCode('');
    setNewPass('');
    setRepeat('');
    setSendError(t('recover.timeExpired'));
    setStep(1);
  }, [flowLeft, flowDeadline, step, t]);

  const ruleLen = newPass.length >= 10;
  const ruleNum = /\d/.test(newPass);
  const ruleUp = /[A-Z]/.test(newPass);
  const ruleLow = /[a-z]/.test(newPass);
  const passOk = ruleLen && ruleNum && ruleUp && ruleLow;
  const repeatOk = repeat.length > 0 && repeat === newPass;

  const sendCode = async () => {
    if (sending) return;
    setSending(true);
    setSendError(null);
    try {
      await authApi.requestPasswordReset(email);
      startRecover(email);
      setFlowDeadline(Date.now() + FLOW_TTL_MS);
      setStep(2);
    } catch (err) {
      setSendError(describeApiError(err, t('recover.sendError')));
    } finally {
      setSending(false);
    }
  };

  const confirmReset = async () => {
    if (confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await authApi.confirmPasswordReset({ email, code, newPassword: newPass });
      setStep(4);
    } catch (err) {
      setConfirmError(describeApiError(err, t('recover.confirmError')));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Screen bg={theme.dark ? theme.bg : '#fff'}>
      <BackButton
        onPress={() => {
          if (step === 1) {
            nav.goBack();
            return;
          }
          if (step === 2) setFlowDeadline(null);
          setStep((s) => s - 1);
        }}
      />
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= step ? theme.gold : theme.line }} />
        ))}
      </View>
      {(step === 2 || step === 3) && flowDeadline ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Icon name="timer" size={14} color={flowLeft <= 60 ? '#C2352B' : theme.soft} />
          <Text style={{ fontFamily: fonts.bodyMed, fontSize: 11.5, color: flowLeft <= 60 ? '#C2352B' : theme.soft }}>
            {t('recover.timeLeft', { time: mmss(flowLeft) })}
          </Text>
        </View>
      ) : null}

      {step === 1 && (
        <View>
          <IconBadge name="lock_reset" />
          <Text style={styles(theme).title}>{t('recover.title1')}</Text>
          <Text style={styles(theme).sub}>{t('recover.sub1')}</Text>
          <View style={{ marginTop: 24 }}>
            <TextField
              label={t('recover.email')}
              icon="person"
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={(v) => {
                setIdentifier(v);
                setSendError(null);
              }}
            />
          </View>
          {sendError ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{sendError}</Text>
          ) : null}
          <PrimaryButton
            label={sending ? t('recover.sending') : t('recover.sendCode')}
            disabled={!EMAIL_RE.test(email) || sending}
            onPress={sendCode}
            style={{ marginTop: 22 }}
          />
          <View style={{ marginTop: 26, padding: 16, borderRadius: 16, backgroundColor: theme.tint, flexDirection: 'row', gap: 11 }}>
            <Icon name="shield" size={19} color={theme.gold} />
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>
              {t('recover.safetyNote')}
            </Text>
          </View>
        </View>
      )}

      {step === 2 && (
        <View>
          <IconBadge name="sms" />
          <Text style={styles(theme).title}>{t('recover.title2')}</Text>
          <Text style={styles(theme).sub}>{t('recover.sub2')}</Text>
          <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: 24 }}>
            <OtpBoxes value={code} />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => {
              const d = v.replace(/\D/g, '').slice(0, 6);
              setCode(d);
              if (d.length === 6) setStep(3);
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={{ position: 'absolute', opacity: 0, height: 0 }}
          />
          <Text style={{ marginTop: 16, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
            {otpLeft > 0 ? (
              <>
                {t('recover.resendIn')}<Text style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>{mmss(otpLeft)}</Text>
              </>
            ) : (
              <Text
                onPress={() => {
                  authApi.requestPasswordReset(email).catch(() => {});
                  resendOtp();
                  setFlowDeadline(Date.now() + FLOW_TTL_MS);
                }}
                style={{ fontFamily: fonts.bodyBold, color: theme.gold }}
              >
                {t('recover.resend')}
              </Text>
            )}
          </Text>
        </View>
      )}

      {step === 3 && (
        <View>
          <IconBadge name="key" />
          <Text style={styles(theme).title}>{t('recover.title3')}</Text>
          <Text style={styles(theme).sub}>{t('recover.sub3')}</Text>
          <View style={{ marginTop: 22, gap: 12 }}>
            <TextField
              label={t('recover.newPassword')}
              icon="lock"
              secureTextEntry={!passVisible}
              value={newPass}
              onChangeText={setNewPass}
              rightIcon={passVisible ? 'visibility_off' : 'visibility'}
              onRightIconPress={() => setPassVisible((v) => !v)}
            />
            <View style={{ gap: 6 }}>
              <RuleLine ok={ruleLen} label={t('recover.ruleLen')} />
              <RuleLine ok={ruleNum} label={t('recover.ruleNum')} />
              <RuleLine ok={ruleUp} label={t('recover.ruleUp')} />
              <RuleLine ok={ruleLow} label={t('recover.ruleLow')} />
            </View>
            <TextField
              label={t('recover.repeatPassword')}
              icon="lock"
              secureTextEntry={!repeatVisible}
              value={repeat}
              onChangeText={setRepeat}
              status={repeat.length === 0 ? 'default' : repeatOk ? 'success' : 'error'}
              rightIcon={repeatVisible ? 'visibility_off' : 'visibility'}
              onRightIconPress={() => setRepeatVisible((v) => !v)}
            />
          </View>
          {confirmError ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{confirmError}</Text>
          ) : null}
          <PrimaryButton
            label={confirming ? t('recover.confirming') : t('recover.savePassword')}
            disabled={!passOk || !repeatOk || confirming}
            onPress={confirmReset}
            style={{ marginTop: 22 }}
          />
        </View>
      )}

      {step === 4 && (
        <View style={{ alignItems: 'center', paddingTop: 44 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: '#EAF9F1', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={44} color="#21A26B" />
          </View>
          <Text style={[styles(theme).title, { marginTop: 22, textAlign: 'center' }]}>{t('recover.title4')}</Text>
          <Text style={[styles(theme).sub, { textAlign: 'center' }]}>{t('recover.sub4')}</Text>
          <PrimaryButton label={t('recover.signIn')} onPress={() => nav.replace('Login')} style={{ marginTop: 26, width: '100%' }} />
        </View>
      )}
    </Screen>
  );
}

function IconBadge({ name }: { name: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={25} color={theme.gold} />
    </View>
  );
}

function RuleLine({ ok, label }: { ok: boolean; label: string }) {
  const { theme } = useTheme();
  const color = ok ? '#21A26B' : theme.soft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icon name={ok ? 'check_circle' : 'radio_button_unchecked'} size={15} color={color} />
      <Text style={{ fontFamily: fonts.bodyMed, fontSize: 11.5, color }}>{label}</Text>
    </View>
  );
}

const styles = (theme: any) => ({
  title: { marginTop: 20, fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: theme.ink, letterSpacing: -0.9 },
  sub: { marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid },
});
