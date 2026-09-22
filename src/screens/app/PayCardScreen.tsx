import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import { ScreenTitle } from '../../components/Primitives';
import { GhostButton, GoldButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PayCardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, cardDebt, minPayment, creditLine, cutDate, payCard } = useAppState();
  const [plan, setPlan] = useState<'full' | 'min' | 'installments'>('installments');
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linePct = creditLine > 0 ? Math.min(100, Math.round((cardDebt / creditLine) * 100)) : 0;
  const installment = cardDebt / 3;
  const plans = [
    { id: 'full' as const, label: t('payCard.planFull'), note: t('payCard.planFullNote'), amt: cardDebt, icon: 'check_circle' },
    { id: 'installments' as const, label: t('payCard.planInstallments'), note: t('payCard.planInstallmentsNote', { amount: money(installment) }), amt: installment, icon: 'calendar_month' },
    { id: 'min' as const, label: t('payCard.planMin'), note: t('payCard.planMinNote'), amt: minPayment, icon: 'trending_down' },
  ];

  const months = [t('payCard.month1'), t('payCard.month2'), t('payCard.month3')];
  const cutDay = cutDate.split(' ')[0];

  const submit = async () => {
    if (paying) return;
    const amt = plans.find((p) => p.id === plan)!.amt;
    setPaying(true);
    setError(null);
    const result = await payCard(amt);
    setPaying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <Screen bg={theme.bg}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('payCard.scheduled')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {plan === 'installments'
              ? t('payCard.scheduledInstallments', { amount: money(cardDebt) })
              : t('payCard.scheduledOther', { planLabel: plan === 'full' ? t('payCard.fullPayment') : t('payCard.minPayment'), amount: money(plans.find((p) => p.id === plan)!.amt) })}
          </Text>
          <GhostButton label={t('payCard.backToCard')} onPress={() => setDone(false)} style={{ marginTop: 24, width: 220 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={theme.bg}>
      <ScreenTitle eyebrow={`Visa Infinite ···${user.cardNumber.slice(-4)}`} title={t('payCard.title')} showLanguageSwitch />

      <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 18, borderRadius: 24, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.4, textTransform: 'uppercase' }}>{t('payCard.periodDebt')}</Text>
            <Text style={{ marginTop: 7, fontFamily: fonts.heading, fontSize: 34, letterSpacing: -1.3, color: '#fff' }}>{money(cardDebt)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(255,255,255,.5)' }}>{t('payCard.minimumPayment')}</Text>
            <Text style={{ marginTop: 6, fontFamily: fonts.headingBold, fontSize: 15, color: '#fff' }}>{money(minPayment)}</Text>
          </View>
        </View>
        <View style={{ marginTop: 18, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
          <LinearGradient colors={['#B98B33', '#E7CE92']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${linePct}%`, height: 6, borderRadius: 3 }} />
        </View>
        <View style={{ marginTop: 9, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{t('payCard.percentOfLine', { pct: linePct, line: money(creditLine) })}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{t('payCard.dueDate', { date: cutDate })}</Text>
        </View>
      </LinearGradient>

      <Text style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('payCard.howToPay')}</Text>
      <View style={{ marginTop: 12, gap: 10 }}>
        {plans.map((p) => {
          const active = plan === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPlan(p.id)}
              style={{ borderRadius: 18, borderWidth: 1.5, borderColor: active ? theme.gold : theme.line, backgroundColor: active ? theme.selBg : theme.surf, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}
            >
              <Icon name={p.icon} size={21} color={active ? theme.gold : theme.soft} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{p.label}</Text>
                <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{p.note}</Text>
              </View>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 15, color: theme.ink }}>{money(p.amt)}</Text>
            </Pressable>
          );
        })}
      </View>

      {plan === 'installments' && (
        <View style={{ marginTop: 18, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 20 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('payCard.schedule')}</Text>
          {[1, 2, 3].map((n) => (
            <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, borderBottomWidth: n < 3 ? 1 : 0, borderBottomColor: theme.line }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9A227' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: theme.ink }}>{t('payCard.installmentOf', { n })}</Text>
                <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{n === 1 ? t('payCard.confirmPayment') : `${cutDay} de ${months[n - 1]}`}</Text>
              </View>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{money(installment)}</Text>
            </View>
          ))}
          <Text style={{ marginTop: 12, fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: theme.soft }}>{t('payCard.scheduleNote')}</Text>
        </View>
      )}

      {error ? (
        <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
      ) : null}

      <GoldButton label={paying ? t('payCard.paying') : t('payCard.confirmPayment')} disabled={paying} onPress={submit} style={{ marginTop: 20 }} />
    </Screen>
  );
}
