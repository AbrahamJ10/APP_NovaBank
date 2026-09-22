import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Pantalla from '../../components/Pantalla';
import { TituloPantalla } from '../../components/Primitivas';
import { BotonFantasma, BotonDorado } from '../../components/Botones';
import Icono from '../../components/Icono';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { dinero } from '../../lib/formato';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PayCardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, cardDebt, minPayment, creditLine, cutDate, payCard } = useAppState();
  const [plan, setPlan] = useState<'full' | 'min' | 'installments'>('installments');
  const [listo, setListo] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pctLinea = creditLine > 0 ? Math.min(100, Math.round((cardDebt / creditLine) * 100)) : 0;
  const cuota = cardDebt / 3;
  const planes = [
    { id: 'full' as const, label: t('payCard.planFull'), note: t('payCard.planFullNote'), amt: cardDebt, icon: 'check_circle' },
    { id: 'installments' as const, label: t('payCard.planInstallments'), note: t('payCard.planInstallmentsNote', { amount: dinero(cuota) }), amt: cuota, icon: 'calendar_month' },
    { id: 'min' as const, label: t('payCard.planMin'), note: t('payCard.planMinNote'), amt: minPayment, icon: 'trending_down' },
  ];

  const meses = [t('payCard.month1'), t('payCard.month2'), t('payCard.month3')];
  const diaCorte = cutDate.split(' ')[0];

  const enviar = async () => {
    if (pagando) return;
    const monto = planes.find((opcion) => opcion.id === plan)!.amt;
    setPagando(true);
    setError(null);
    const resultado = await payCard(monto);
    setPagando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setListo(true);
  };

  if (listo) {
    return (
      <Pantalla bg={theme.bg}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('payCard.scheduled')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {plan === 'installments'
              ? t('payCard.scheduledInstallments', { amount: dinero(cardDebt) })
              : t('payCard.scheduledOther', { planLabel: plan === 'full' ? t('payCard.fullPayment') : t('payCard.minPayment'), amount: dinero(planes.find((opcion) => opcion.id === plan)!.amt) })}
          </Text>
          <BotonFantasma label={t('payCard.backToCard')} onPress={() => setListo(false)} style={{ marginTop: 24, width: 220 }} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla bg={theme.bg}>
      <TituloPantalla eyebrow={`Visa Infinite ···${user.cardNumber.slice(-4)}`} title={t('payCard.title')} showLanguageSwitch />

      <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 18, borderRadius: 24, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.4, textTransform: 'uppercase' }}>{t('payCard.periodDebt')}</Text>
            <Text style={{ marginTop: 7, fontFamily: fonts.heading, fontSize: 34, letterSpacing: -1.3, color: '#fff' }}>{dinero(cardDebt)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(255,255,255,.5)' }}>{t('payCard.minimumPayment')}</Text>
            <Text style={{ marginTop: 6, fontFamily: fonts.headingBold, fontSize: 15, color: '#fff' }}>{dinero(minPayment)}</Text>
          </View>
        </View>
        <View style={{ marginTop: 18, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
          <LinearGradient colors={['#B98B33', '#E7CE92']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pctLinea}%`, height: 6, borderRadius: 3 }} />
        </View>
        <View style={{ marginTop: 9, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{t('payCard.percentOfLine', { pct: pctLinea, line: dinero(creditLine) })}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{t('payCard.dueDate', { date: cutDate })}</Text>
        </View>
      </LinearGradient>

      <Text style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('payCard.howToPay')}</Text>
      <View style={{ marginTop: 12, gap: 10 }}>
        {planes.map((opcion) => {
          const activo = plan === opcion.id;
          return (
            <Pressable
              key={opcion.id}
              onPress={() => setPlan(opcion.id)}
              style={{ borderRadius: 18, borderWidth: 1.5, borderColor: activo ? theme.gold : theme.line, backgroundColor: activo ? theme.selBg : theme.surf, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}
            >
              <Icono name={opcion.icon} size={21} color={activo ? theme.gold : theme.soft} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{opcion.label}</Text>
                <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{opcion.note}</Text>
              </View>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 15, color: theme.ink }}>{dinero(opcion.amt)}</Text>
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
                <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{n === 1 ? t('payCard.confirmPayment') : `${diaCorte} de ${meses[n - 1]}`}</Text>
              </View>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{dinero(cuota)}</Text>
            </View>
          ))}
          <Text style={{ marginTop: 12, fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: theme.soft }}>{t('payCard.scheduleNote')}</Text>
        </View>
      )}

      {error ? (
        <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
      ) : null}

      <BotonDorado label={pagando ? t('payCard.paying') : t('payCard.confirmPayment')} disabled={pagando} onPress={enviar} style={{ marginTop: 20 }} />
    </Pantalla>
  );
}
