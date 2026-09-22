import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, OtpBoxes, ProgressSteps } from '../../components/Primitives';
import { PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { mmss, maskEmail } from '../../lib/format';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { verificationApi } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

const RESEND_COOLDOWN_S = 60;
// Coincide con la expiración propia del OTP del backend (otp.service.ts,
// OTP_TTL_MS) — el código se acaba de pedir justo antes de que se abriera
// esta pantalla, así que la ventana empieza ahora y se cierra exactamente
// cuando el código deja de ser válido del lado del servidor. No se debe
// dejar que alguien se quede en esta pantalla indefinidamente.
const FLOW_TTL_MS = 10 * 60 * 1000;

export default function OtpScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { completeRegister, pendingUser } = useAppState();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [flowDeadline, setFlowDeadline] = useState(() => Date.now() + FLOW_TTL_MS);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const flowLeft = Math.max(0, Math.round((flowDeadline - now) / 1000));

  useEffect(() => {
    if (flowLeft > 0) return;
    Alert.alert(t('otp.timeExpiredTitle'), t('otp.timeExpired'), [{ text: t('otp.timeExpiredOk'), onPress: () => nav.goBack() }]);
  }, [flowLeft, nav, t]);

  const submit = async (value: string) => {
    if (value.length !== 6 || submitting) return;
    setSubmitting(true);
    try {
      const result = await completeRegister(value);
      if (result.ok) {
        setError(false);
        nav.replace('RegisterDone');
      } else {
        setError(true);
        setErrorMessage(result.message);
        setCode('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!pendingUser || resending || cooldown > 0) return;
    setResending(true);
    try {
      await verificationApi.requestRegisterOtp(pendingUser.email);
      setCooldown(RESEND_COOLDOWN_S);
      setFlowDeadline(Date.now() + FLOW_TTL_MS);
      setError(false);
      setErrorMessage(null);
    } catch {
      setErrorMessage(t('otp.resendFail'));
      setError(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen bg={theme.dark ? theme.bg : '#fff'}>
      <BackButton onPress={() => nav.goBack()} />
      <ProgressSteps total={2} current={2} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Icon name="timer" size={14} color={flowLeft <= 60 ? '#C2352B' : theme.soft} />
        <Text style={{ fontFamily: fonts.bodyMed, fontSize: 11.5, color: flowLeft <= 60 ? '#C2352B' : theme.soft }}>
          {t('otp.timeLeft', { time: mmss(flowLeft) })}
        </Text>
      </View>

      <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="mail" size={25} color={theme.gold} />
      </View>
      <Text style={{ marginTop: 20, fontFamily: fonts.heading, fontSize: 26, color: theme.ink, letterSpacing: -0.9 }}>{t('otp.title')}</Text>
      <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
        {t('otp.subtitle')}
        <Text style={{ fontFamily: fonts.bodyBold, color: theme.ink }}>{maskEmail(pendingUser?.email ?? '')}</Text>.
      </Text>

      <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: 26 }}>
        <OtpBoxes value={code} />
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, '').slice(0, 6);
          setCode(digits);
          setError(false);
          if (digits.length === 6) submit(digits);
        }}
        keyboardType="number-pad"
        maxLength={6}
        style={{ position: 'absolute', opacity: 0, height: 0 }}
        autoFocus
      />
      {error ? (
        <Text style={{ marginTop: 10, fontFamily: fonts.bodyBold, fontSize: 12, color: '#C2352B' }}>
          {errorMessage ?? t('otp.errorDefault')}
        </Text>
      ) : null}

      <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
          {cooldown > 0 ? (
            <>
              {t('otp.resendIn')}<Text style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>{mmss(cooldown)}</Text>
            </>
          ) : (
            t('otp.canResend')
          )}
        </Text>
        <Pressable disabled={cooldown > 0 || resending} onPress={resend}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: cooldown > 0 || resending ? theme.soft : theme.gold }}>
            {resending ? t('otp.resending') : t('otp.resend')}
          </Text>
        </Pressable>
      </View>

      <PrimaryButton label={submitting ? t('otp.verifying') : t('otp.verify')} onPress={() => submit(code)} disabled={code.length !== 6 || submitting} style={{ marginTop: 26 }} />
    </Screen>
  );
}
