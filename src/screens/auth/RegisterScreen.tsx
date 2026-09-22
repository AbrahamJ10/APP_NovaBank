import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, ProgressSteps } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

function useRule(regex: RegExp, value: string) {
  return regex.test(value);
}

export default function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { beginRegister, scannedDni, setScannedDni } = useAppState();

  // Vienen del escaneo del DNI/consulta a RENIEC hecha antes en el flujo —
  // solo lectura, el usuario nunca los escribe.
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [dni, setDni] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [passVisible, setPassVisible] = useState(false);
  const [confirmPass, setConfirmPass] = useState('');
  const [confirmPassVisible, setConfirmPassVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (scannedDni) {
        if (scannedDni.dni) setDni(scannedDni.dni);
        if (scannedDni.nombres) setNombres(scannedDni.nombres);
        if (scannedDni.apellidoPaterno) setApellidoPaterno(scannedDni.apellidoPaterno);
        if (scannedDni.apellidoMaterno) setApellidoMaterno(scannedDni.apellidoMaterno);
        setScannedDni(null);
      }
    }, [scannedDni])
  );

  const emailValid = useRule(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, email);
  const phoneValid = useRule(/^\d{9}$/, phone);
  const identityReady = nombres.length > 0 && apellidoPaterno.length > 0 && /^\d{8}$/.test(dni);

  const ruleLen = pass.length >= 10;
  const ruleNum = /\d/.test(pass);
  const ruleUp = /[A-Z]/.test(pass);
  const ruleLow = /[a-z]/.test(pass);
  const score = [ruleLen, ruleNum, ruleUp, ruleLow].filter(Boolean).length;
  const strength =
    score <= 1 ? { label: score === 0 ? '' : t('register.strengthWeak'), color: '#C2352B', pct: `${score * 25}%` } :
    score === 2 ? { label: t('register.strengthMedium'), color: '#B07D07', pct: '50%' } :
    score === 3 ? { label: t('register.strengthGood'), color: '#B07D07', pct: '75%' } :
    { label: t('register.strengthStrong'), color: '#21A26B', pct: '100%' };

  const confirmPassValid = confirmPass.length > 0 && confirmPass === pass;
  const canContinue = identityReady && emailValid && phoneValid && score === 4 && confirmPassValid && accepted;

  const onContinue = () => {
    const fullName = [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
    beginRegister({ name: fullName, email, dni, phone, password: pass });
    nav.navigate('RegisterFace');
  };

  return (
    <Screen bg={theme.dark ? theme.bg : '#fff'}>
      <BackButton onPress={() => nav.goBack()} />
      <ProgressSteps total={2} current={1} />
      <View>
        <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: theme.ink, letterSpacing: -0.9 }}>{t('register.title')}</Text>
        <Text style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 13.5, color: theme.mid }}>{t('register.step')}</Text>
      </View>

      <View style={{ marginTop: 22, gap: 15 }}>
        <TextField label={t('register.names')} icon="person" value={nombres} editable={false} />
        <TextField label={t('register.firstLastName')} icon="badge" value={apellidoPaterno} editable={false} />
        <TextField label={t('register.secondLastName')} icon="badge" value={apellidoMaterno} editable={false} />
        <TextField label={t('register.dni')} icon="fingerprint" value={dni} editable={false} status="success" hint={t('register.verifiedReniec')} />

        <TextField
          label={t('register.email')}
          icon="mail"
          placeholder="tucorreo@gmail.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          status={email.length === 0 ? 'default' : emailValid ? 'success' : 'error'}
        />
        <TextField
          label={t('register.phone')}
          icon="call"
          placeholder="987 214 550"
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 9))}
          keyboardType="phone-pad"
          status={phone.length === 0 ? 'default' : phoneValid ? 'success' : 'error'}
        />
        <View>
          <TextField
            label={t('register.password')}
            icon="lock"
            placeholder={t('register.passwordPlaceholder')}
            value={pass}
            onChangeText={setPass}
            secureTextEntry={!passVisible}
            rightIcon={passVisible ? 'visibility_off' : 'visibility'}
            onRightIconPress={() => setPassVisible((v) => !v)}
          />
          <View style={{ marginTop: 10, gap: 6 }}>
            <RuleLine ok={ruleLen} label={t('register.ruleLen')} />
            <RuleLine ok={ruleNum} label={t('register.ruleNum')} />
            <RuleLine ok={ruleUp} label={t('register.ruleUp')} />
            <RuleLine ok={ruleLow} label={t('register.ruleLow')} />
          </View>
          <View style={{ marginTop: 12, height: 6, borderRadius: 3, backgroundColor: theme.line, overflow: 'hidden' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: strength.color, width: strength.pct as any }} />
          </View>
          {strength.label ? <Text style={{ marginTop: 6, fontFamily: fonts.bodyBold, fontSize: 11.5, color: strength.color }}>{strength.label}</Text> : null}
        </View>

        <TextField
          label={t('register.confirmPassword')}
          icon="lock"
          placeholder={t('register.confirmPasswordPlaceholder')}
          value={confirmPass}
          onChangeText={setConfirmPass}
          secureTextEntry={!confirmPassVisible}
          rightIcon={confirmPassVisible ? 'visibility_off' : 'visibility'}
          onRightIconPress={() => setConfirmPassVisible((v) => !v)}
          status={confirmPass.length === 0 ? 'default' : confirmPassValid ? 'success' : 'error'}
          hint={confirmPass.length > 0 && !confirmPassValid ? t('register.passwordMismatch') : undefined}
        />
      </View>

      <Pressable onPress={() => setAccepted((a) => !a)} style={{ marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            backgroundColor: accepted ? '#133A63' : 'transparent',
            borderWidth: accepted ? 0 : 1.5,
            borderColor: theme.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {accepted ? <Icon name="check" size={15} color="#fff" /> : null}
        </View>
        <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>
          {t('register.termsPrefix')}<Text style={{ color: '#C9A227' }}>{t('register.termsLink')}</Text>{t('register.termsSuffix')}
        </Text>
      </Pressable>

      <PrimaryButton label={t('register.continue')} iconRight="arrow_forward" disabled={!canContinue} onPress={onContinue} style={{ marginTop: 22 }} />
    </Screen>
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
