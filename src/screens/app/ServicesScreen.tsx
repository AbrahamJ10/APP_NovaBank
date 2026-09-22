import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../components/Pantalla';
import { BotonVolver, TituloPantalla } from '../../components/Primitivas';
import { BotonFantasma, BotonDorado } from '../../components/Botones';
import Icono from '../../components/Icono';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { ServiceBill } from '../../state/types';
import { RootStackParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ServicesScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { services, available, payBill, suspendBill, resumeBill } = useAppState();
  const [seleccionado, setSeleccionado] = useState<ServiceBill | null>(null);
  const [listo, setListo] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [alternando, setAlternando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!seleccionado || pagando) return;
    setPagando(true);
    setError(null);
    const resultado = await payBill(seleccionado.id);
    setPagando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setListo(true);
  };

  const alternarSuspension = async () => {
    if (!seleccionado || alternando) return;
    setAlternando(true);
    setError(null);
    const resultado = seleccionado.suspended ? await resumeBill(seleccionado.id) : await suspendBill(seleccionado.id);
    setAlternando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setSeleccionado(resultado.bill);
  };

  if (listo && seleccionado) {
    return (
      <Pantalla bg={theme.bg}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('services.receiptPaid')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {t('services.receiptPaidBody', { name: seleccionado.name, amount: money(seleccionado.amount) })}
          </Text>
          <BotonFantasma
            label={t('services.payAnother')}
            onPress={() => {
              setSeleccionado(null);
              setListo(false);
            }}
            style={{ marginTop: 24, width: 220 }}
          />
        </View>
      </Pantalla>
    );
  }

  if (seleccionado && seleccionado.suspended) {
    return (
      <Pantalla bg={theme.bg}>
        <BotonVolver onPress={() => setSeleccionado(null)} />
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="pause_circle" size={30} color={theme.gold} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 16, color: theme.ink }}>{seleccionado.name}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {t('concierge.serviceStatusSuspended', { name: seleccionado.name })}
          </Text>
          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          <BotonFantasma
            label={alternando ? t('services.paying') : t('concierge.actionResume')}
            onPress={alternarSuspension}
            disabled={alternando}
            style={{ marginTop: 18, width: 220 }}
          />
        </View>
      </Pantalla>
    );
  }

  if (seleccionado && seleccionado.paid) {
    return (
      <Pantalla bg={theme.bg}>
        <BotonVolver onPress={() => setSeleccionado(null)} />
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check_circle" size={30} color={theme.green} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 16, color: theme.ink }}>{seleccionado.name}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {t('serviceLookup.upToDateBody', { supply: seleccionado.supplyNumber })}
          </Text>
        </View>
      </Pantalla>
    );
  }

  if (seleccionado) {
    return (
      <Pantalla bg={theme.bg}>
        <BotonVolver onPress={() => setSeleccionado(null)} />
        <Text style={{ fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.8, color: theme.ink }}>{seleccionado.name}</Text>
        <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>{seleccionado.meta}</Text>

        <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 20, borderRadius: 24, padding: 22 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('services.totalToPay')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.heading, fontSize: 38, letterSpacing: -1.5, color: '#fff' }}>{money(seleccionado.amount)}</Text>
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(217,190,122,.22)', gap: 11 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.period')}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#fff' }}>{seleccionado.period}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.expiry')}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#fff' }}>{seleccionado.expiry}</Text>
            </View>
            {seleccionado.consumption ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.consumption')}</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#fff' }}>{seleccionado.consumption}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="account_balance_wallet" size={20} color={theme.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{t('services.savings')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{t('services.available', { amount: money(available) })}</Text>
          </View>
          <Icono name="check_circle" size={19} color={theme.gold} />
        </View>

        {error ? (
          <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
        ) : null}

        <BotonDorado
          label={pagando ? t('services.paying') : t('services.pay', { amount: money(seleccionado.amount) })}
          disabled={seleccionado.amount > available || pagando}
          onPress={enviar}
          style={{ marginTop: 20 }}
        />
        <BotonFantasma
          label={alternando ? t('services.paying') : t('concierge.actionSuspend')}
          onPress={alternarSuspension}
          disabled={alternando || pagando}
          style={{ marginTop: 10 }}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla bg={theme.bg}>
      <TituloPantalla eyebrow={t('services.eyebrow')} title={t('services.title')} />
      <Pressable
        onPress={() => nav.navigate('ServiceCatalog')}
        style={{ marginTop: 14, height: 48, borderRadius: 15, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }}
      >
        <Icono name="search" size={19} color={theme.soft} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: theme.soft }}>{t('services.searchPlaceholder')}</Text>
      </Pressable>

      <Text style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('services.yourBills')}</Text>
      <View style={{ marginTop: 12, gap: 11 }}>
        {services.map((servicio) => (
          <Pressable
            key={servicio.id}
            onPress={() => {
              setError(null);
              setSeleccionado(servicio);
            }}
            style={{ borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name={servicio.icon} size={21} color={theme.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{servicio.name}</Text>
              <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{servicio.meta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 14.5, color: theme.ink }}>{money(servicio.amount)}</Text>
              <Text style={{ marginTop: 3, fontFamily: fonts.bodyBold, fontSize: 10.5, color: servicio.suspended ? theme.gold : servicio.dueColor === 'warn' ? theme.red : theme.green }}>
                {servicio.suspended ? t('services.suspended') : servicio.due}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => nav.navigate('ServiceCatalog')}
        style={{ marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: theme.line, borderStyle: 'dashed', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Icono name="add" size={21} color={theme.gold} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('services.addNewService')}</Text>
      </Pressable>
    </Pantalla>
  );
}
