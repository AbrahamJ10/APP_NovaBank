import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/Logo';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { mmss } from '../../lib/format';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { clearLastAccount, getLastAccount } from '../../lib/secureTokens';

export default function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { login, blockedUntil, blockLeft, restoreSession } = useAppState();

  const [remembered, setRemembered] = useState<{ email: string; fullName: string } | null | undefined>(undefined);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioChecking, setBioChecking] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passVisible, setPassVisible] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const blocked = !!blockedUntil && blockLeft > 0;

  useEffect(() => {
    getLastAccount().then(setRemembered);
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hw, enrolled]) => setBioAvailable(hw && enrolled))
      .catch(() => setBioAvailable(false));
  }, []);

  const quick = !!remembered;
  const email = quick ? remembered!.email : identifier;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (!res.ok) {
        setError(true);
        setErrorMessage('message' in res ? res.message ?? null : null);
      } else {
        setError(false);
        setErrorMessage(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tryBiometric = async () => {
    if (bioChecking) return;
    setBioChecking(true);
    setBioMessage(null);
    try {
      if (!bioAvailable) {
        setBioMessage(t('login.bioUnavailable'));
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('login.bioPrompt'),
        cancelLabel: t('login.bioCancel'),
      });
      if (!result.success) return;
      // A successful device unlock only proves it's this phone's owner — it
      // still has to be paired with a session that's actually valid, same
      // as the silent restore on cold start.
      const restored = await restoreSession();
      if (!restored) setBioMessage(t('login.bioSessionExpired'));
    } finally {
      setBioChecking(false);
    }
  };

  return (
    <Screen bg={theme.dark ? theme.bg : '#fff'}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <LogoMark size={52} />
        <LanguageSwitch />
      </View>
      <Text style={{ marginTop: 14, fontFamily: fonts.displaySemi, fontSize: 15, letterSpacing: 3, textTransform: 'uppercase', color: theme.gold }}>
        NovaBank
      </Text>
      <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, color: theme.ink, letterSpacing: -1 }}>
        {quick ? (
          <>
            {t('login.greeting')}
            {'\n'}
            {remembered!.fullName.split(' ')[0]}.
          </>
        ) : (
          t('login.greeting')
        )}
      </Text>
      <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, color: theme.mid }}>{t('login.subtitle')}</Text>

      {blocked ? (
        <View style={{ marginTop: 20, borderRadius: 16, backgroundColor: '#FFF4F3', borderWidth: 1, borderColor: '#F6CFCA', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="lock_clock" size={18} color="#C2352B" />
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: '#C2352B' }}>{t('login.blockedTitle')}</Text>
          </View>
          <Text style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: '#8A4741' }}>
            {t('login.blockedBody')}
          </Text>
          <Text style={{ marginTop: 10, fontFamily: fonts.heading, fontSize: 28, color: '#C2352B', letterSpacing: -1 }}>{mmss(blockLeft)}</Text>
          <Pressable onPress={() => nav.navigate('Recover')}>
            <Text style={{ marginTop: 8, fontFamily: fonts.bodyBold, fontSize: 12, color: '#C2352B' }}>{t('login.recoverNow')}</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={{ marginTop: 20, borderRadius: 14, backgroundColor: '#FFF4F3', borderWidth: 1, borderColor: '#F6CFCA', padding: 14, flexDirection: 'row', gap: 10 }}>
          <Icon name="error" size={18} color="#C2352B" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 12.5, color: '#C2352B' }}>{t('login.errorTitle')}</Text>
            <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: '#8A4741' }}>{errorMessage ?? t('login.errorDefault')}</Text>
          </View>
        </View>
      ) : bioMessage ? (
        <View style={{ marginTop: 20, borderRadius: 14, backgroundColor: theme.tint, padding: 14, flexDirection: 'row', gap: 10 }}>
          <Icon name="fingerprint" size={18} color={theme.gold} />
          <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>{bioMessage}</Text>
        </View>
      ) : null}

      {!blocked && (
        <View style={{ marginTop: 22, gap: 14 }}>
          {!quick && (
            <TextField label={t('login.email')} icon="person" placeholder="tucorreo@gmail.com" autoCapitalize="none" value={identifier} onChangeText={setIdentifier} />
          )}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
              <Text style={{ fontFamily: fonts.headingSemi, fontSize: 12, color: theme.mid }}>{t('login.password')}</Text>
              <Pressable onPress={() => nav.navigate('Recover')}>
                <Text style={{ fontFamily: fonts.headingSemi, fontSize: 12, color: theme.gold }}>{t('login.forgot')}</Text>
              </Pressable>
            </View>
            <TextField
              placeholder={t('login.passwordPlaceholder')}
              icon="lock"
              secureTextEntry={!passVisible}
              value={password}
              onChangeText={setPassword}
              rightIcon={passVisible ? 'visibility_off' : 'visibility'}
              onRightIconPress={() => setPassVisible((v) => !v)}
            />
          </View>
        </View>
      )}

      {!blocked && <PrimaryButton label={submitting ? t('login.submitting') : t('login.submit')} disabled={submitting} onPress={submit} style={{ marginTop: 22 }} />}

      {quick && (
        <Pressable
          onPress={() => {
            clearLastAccount().catch(() => {});
            setRemembered(null);
            setIdentifier('');
            setPassword('');
          }}
          style={{ marginTop: 14, alignSelf: 'center' }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
            {t('login.notYou')}
            <Text style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>{t('login.useOtherAccount')}</Text>
          </Text>
        </Pressable>
      )}

      {quick && (
        <Pressable onPress={tryBiometric} disabled={bioChecking} style={{ marginTop: 26, alignSelf: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 30,
              backgroundColor: theme.dark ? theme.tint : '#EDF2F8',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {bioChecking ? <ActivityIndicator color={theme.gold} /> : <Icon name="fingerprint" size={50} color={theme.gold} />}
          </View>
          <Text style={{ marginTop: 12, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('login.faceId')}</Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{t('login.faceIdSub')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}
