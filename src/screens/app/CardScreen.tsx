import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { OtpBoxes, ScreenTitle, Toggle } from '../../components/Primitives';
import { DangerButton, GhostButton, PrimaryButton } from '../../components/Buttons';
import BottomSheet from '../../components/BottomSheet';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CardScreen() {
  const nav = useNavigation<any>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, cardBlocked, requestCardBlock, requestProfileOtp, revealCvv } = useAppState();

  const CONTROLS = [
    { key: 'pin', icon: 'pin', label: t('card.controlPinLabel'), desc: t('card.controlPinDesc') },
    { key: 'cvv', icon: 'visibility', label: t('card.controlCvvLabel'), desc: t('card.controlCvvDesc') },
    { key: 'limits', icon: 'place', label: t('card.controlLimitsLabel'), desc: t('card.controlLimitsDesc'), go: 'Limits' as const },
    { key: 'report', icon: 'report', label: t('card.controlReportLabel'), desc: t('card.controlReportDesc'), go: 'Security' as const },
  ];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [cvvStep, setCvvStep] = useState<'closed' | 'otp' | 'shown'>('closed');
  const [cvvCode, setCvvCode] = useState('');
  const [cvvValue, setCvvValue] = useState('');
  const [cvvError, setCvvError] = useState<string | null>(null);
  const [cvvSending, setCvvSending] = useState(false);
  const [cvvVerifying, setCvvVerifying] = useState(false);
  const cvvInputRef = useRef<TextInput>(null);

  const openControl = async (key: string) => {
    if (key === 'pin') setPinOpen(true);
    if (key === 'cvv') {
      setCvvCode('');
      setCvvError(null);
      setCvvStep('otp');
      setCvvSending(true);
      const result = await requestProfileOtp();
      setCvvSending(false);
      if (!result.ok) setCvvError(result.message);
    }
  };

  const submitCvv = async (v: string) => {
    if (v.length !== 6 || cvvVerifying) return;
    setCvvVerifying(true);
    setCvvError(null);
    const result = await revealCvv(v);
    setCvvVerifying(false);
    if (!result.ok) {
      setCvvError(result.message);
      setCvvCode('');
      return;
    }
    setCvvValue(result.cvv);
    setCvvStep('shown');
  };

  return (
    <Screen bg={theme.bg}>
      <ScreenTitle title={t('card.title')} showLanguageSwitch />

      <LinearGradient
        colors={cardBlocked ? ['#5B6875', '#3A434C'] : ['#0E2C4E', '#061626']}
        style={{ marginTop: 18, borderRadius: 22, padding: 24, height: 216, justifyContent: 'space-between', overflow: 'hidden' }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontFamily: fonts.displaySemi, fontSize: 17, letterSpacing: 2.4, textTransform: 'uppercase', color: '#E7CE92' }}>NovaBank</Text>
            <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(255,255,255,.55)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('card.visaInfinite')}</Text>
          </View>
          <View style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 9, backgroundColor: cardBlocked ? 'rgba(255,255,255,.18)' : 'rgba(217,190,122,.2)' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: cardBlocked ? '#fff' : '#E7CE92' }}>{cardBlocked ? t('card.blocked') : t('card.active')}</Text>
          </View>
        </View>
        <View>
          <LinearGradient colors={['#E7CE92', '#B98B33', '#F0DCA8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 32, borderRadius: 6 }} />
          <Text style={{ marginTop: 12, fontFamily: fonts.bodyMed, fontSize: 18, letterSpacing: 2.6, color: '#fff' }}>{user.cardNumber}</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: 'rgba(255,255,255,.55)' }}>{t('card.holder')}</Text>
              <Text style={{ marginTop: 2, fontFamily: fonts.bodyMed, fontSize: 12.5, letterSpacing: 0.5, color: '#fff' }}>{user.name.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: 'rgba(255,255,255,.55)' }}>{t('card.expires')}</Text>
              <Text style={{ marginTop: 2, fontFamily: fonts.bodyMed, fontSize: 12.5, color: '#fff' }}>{user.cardExpiry}</Text>
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 16, fontStyle: 'italic', color: '#E7CE92' }}>VISA</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.headingBold, fontSize: 15, color: theme.ink }}>{cardBlocked ? t('card.blockedTitle') : t('card.blockTitle')}</Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>
            {cardBlocked ? t('card.blockedDesc') : t('card.unblockedDesc')}
          </Text>
        </View>
        <Toggle value={cardBlocked} onChange={(next) => (next ? setConfirmOpen(true) : requestCardBlock(false))} />
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 14 }}>
        {CONTROLS.map((c, i) => (
          <Pressable
            key={c.key}
            onPress={() => (c.go ? nav.navigate(c.go) : openControl(c.key))}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 6, marginHorizontal: -6, borderRadius: 12, borderBottomWidth: i < CONTROLS.length - 1 ? 1 : 0, borderBottomColor: theme.line },
              pressed && { backgroundColor: theme.tint },
            ]}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={c.icon} size={19} color={theme.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{c.label}</Text>
              <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{c.desc}</Text>
            </View>
            <Icon name="chevron_right" size={18} color="#A6B1BD" />
          </Pressable>
        ))}
      </View>

      <BottomSheet visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.warnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="gpp_maybe" size={26} color="#C2352B" />
        </View>
        <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 21, letterSpacing: -0.6, color: theme.ink }}>{t('card.confirmBlockTitle')}</Text>
        <Text style={{ marginTop: 9, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>
          {t('card.confirmBlockBody')}
        </Text>
        <DangerButton
          label={t('card.yesBlock')}
          onPress={() => {
            requestCardBlock(true);
            setConfirmOpen(false);
          }}
          style={{ marginTop: 22 }}
        />
        <GhostButton label={t('card.cancel')} onPress={() => setConfirmOpen(false)} style={{ marginTop: 10 }} />
      </BottomSheet>

      <BottomSheet visible={pinOpen} onClose={() => setPinOpen(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pin" size={24} color={theme.gold} />
        </View>
        <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('card.changePinTitle')}</Text>
        <Text style={{ marginTop: 9, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>
          {t('card.changePinBody')}
        </Text>
        <PrimaryButton label={t('card.understood')} onPress={() => setPinOpen(false)} style={{ marginTop: 20 }} />
      </BottomSheet>

      <BottomSheet
        visible={cvvStep !== 'closed'}
        onShow={() => cvvInputRef.current?.focus()}
        onClose={() => {
          setCvvStep('closed');
          setCvvCode('');
        }}
      >
        {cvvStep === 'otp' && (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('card.verifyIdentity')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('card.verifyIdentityBody')}
            </Text>
            <Pressable onPress={() => cvvInputRef.current?.focus()} style={{ marginTop: 18 }}>
              <OtpBoxes value={cvvCode} />
            </Pressable>
            <TextInput
              ref={cvvInputRef}
              value={cvvCode}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(v) => {
                const d = v.replace(/\D/g, '').slice(0, 6);
                setCvvCode(d);
                setCvvError(null);
                if (d.length === 6) submitCvv(d);
              }}
              style={{ position: 'absolute', opacity: 0, height: 0 }}
            />
            {cvvError ? (
              <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{cvvError}</Text>
            ) : cvvSending ? (
              <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{t('card.sendingCode')}</Text>
            ) : null}
            <PrimaryButton
              label={cvvVerifying ? t('card.verifying') : t('card.verify')}
              onPress={() => submitCvv(cvvCode)}
              disabled={cvvCode.length !== 6 || cvvVerifying || cvvSending}
              style={{ marginTop: 18 }}
            />
          </View>
        )}
        {cvvStep === 'shown' && (
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Icon name="lock_open" size={30} color={theme.green} />
            <Text style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 12, color: theme.soft, letterSpacing: 1 }}>{t('card.cvvOf', { last4: user.cardNumber.slice(-4) })}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.heading, fontSize: 34, letterSpacing: 6, color: theme.ink }}>{cvvValue}</Text>
            <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{t('card.cvvHides')}</Text>
            <PrimaryButton label={t('card.done')} onPress={() => setCvvStep('closed')} style={{ marginTop: 18, width: '100%' }} />
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
