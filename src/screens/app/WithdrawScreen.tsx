import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { ScreenTitle } from '../../components/Primitives';
import { DangerOutlineButton, GoldButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { mmss } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

const PRESETS = [100, 200, 400, 700];
const RADIUS = 46;
const CIRC = 2 * Math.PI * RADIUS;

export default function WithdrawScreen() {
  const nav = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { withdraw, withdrawLeft, withdrawExpired, generateWithdraw, cancelWithdraw, renewWithdraw } = useAppState();
  const [amount, setAmount] = useState(200);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pct = withdraw ? withdrawLeft / (30 * 60) : 0;

  const submit = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    const result = await generateWithdraw(amount);
    setGenerating(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <Screen bg={theme.bg}>
      <ScreenTitle title={t('withdraw.title')} showLanguageSwitch />

      {!withdraw ? (
        <View>
          <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
            {t('withdraw.subtitle')}
          </Text>
          <View style={{ marginTop: 20, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('withdraw.amountToWithdraw')}</Text>
            <View style={{ marginTop: 12, height: 74, borderRadius: 16, borderWidth: 1.5, borderColor: theme.gold, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 9 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: theme.soft }}>S/</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 30, letterSpacing: -1, color: theme.ink }}>{amount.toFixed(2)}</Text>
            </View>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setAmount(p)}
                  style={{ width: '47%', height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: amount === p ? theme.selBg : theme.bg, borderWidth: amount === p ? 1.5 : 0, borderColor: theme.gold }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>S/ {p}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ marginTop: 16, fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: theme.soft }}>
              {t('withdraw.rules')}
            </Text>
          </View>
          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          <PrimaryButton
            label={generating ? t('withdraw.generating') : t('withdraw.generateKey')}
            icon="key"
            disabled={generating}
            onPress={submit}
            style={{ marginTop: 18 }}
          />
        </View>
      ) : (
        <View style={{ marginTop: 18, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 26, alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, color: theme.mid, textTransform: 'uppercase', letterSpacing: 1 }}>{t('withdraw.withdrawKey')}</Text>
          <Text style={{ marginTop: 12, fontFamily: fonts.heading, fontSize: 36, letterSpacing: 5, color: withdrawExpired ? theme.soft : theme.ink }}>{withdraw.code}</Text>

          <View style={{ marginTop: 22, padding: 12, backgroundColor: '#fff', borderRadius: 18, opacity: withdrawExpired ? 0.35 : 1 }}>
            <QRCode value={withdraw.qr} size={114} color="#0F1A26" backgroundColor="#fff" />
          </View>

          <View style={{ marginTop: 22, width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={110} height={110} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={55} cy={55} r={RADIUS} stroke={theme.line} strokeWidth={8} fill="none" />
              <Circle
                cx={55}
                cy={55}
                r={RADIUS}
                stroke={withdrawExpired ? theme.soft : '#C9A227'}
                strokeWidth={8}
                fill="none"
                strokeDasharray={`${CIRC}, ${CIRC}`}
                strokeDashoffset={CIRC * (1 - pct)}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={{ fontFamily: fonts.heading, fontSize: 19, color: theme.ink }}>{mmss(withdrawLeft)}</Text>
            <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 10, color: theme.soft }}>{t('withdraw.remaining')}</Text>
          </View>

          <Text style={{ marginTop: 18, fontFamily: fonts.headingBold, fontSize: 14, color: theme.ink }}>
            {withdrawExpired ? t('withdraw.keyExpired') : t('withdraw.presentKey')}
          </Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {withdrawExpired ? t('withdraw.generateNewToContinue') : t('withdraw.withdrawWithoutCard', { amount: withdraw.amount.toFixed(2) })}
          </Text>

          {withdrawExpired ? (
            <PrimaryButton label={t('withdraw.generateNewKey')} icon="refresh" onPress={renewWithdraw} style={{ marginTop: 20, width: '100%' }} />
          ) : (
            <DangerOutlineButton label={t('withdraw.cancelKey')} icon="close" onPress={cancelWithdraw} style={{ marginTop: 20, width: '100%' }} />
          )}
        </View>
      )}
    </Screen>
  );
}
