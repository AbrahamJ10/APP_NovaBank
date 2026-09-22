import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, Row, ScreenTitle } from '../../components/Primitives';
import { GhostButton, GoldButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
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
  const [selected, setSelected] = useState<ServiceBill | null>(null);
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!selected || paying) return;
    setPaying(true);
    setError(null);
    const result = await payBill(selected.id);
    setPaying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  };

  const toggleSuspend = async () => {
    if (!selected || toggling) return;
    setToggling(true);
    setError(null);
    const result = selected.suspended ? await resumeBill(selected.id) : await suspendBill(selected.id);
    setToggling(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSelected(result.bill);
  };

  if (done && selected) {
    return (
      <Screen bg={theme.bg}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('services.receiptPaid')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {t('services.receiptPaidBody', { name: selected.name, amount: money(selected.amount) })}
          </Text>
          <GhostButton
            label={t('services.payAnother')}
            onPress={() => {
              setSelected(null);
              setDone(false);
            }}
            style={{ marginTop: 24, width: 220 }}
          />
        </View>
      </Screen>
    );
  }

  if (selected && selected.suspended) {
    return (
      <Screen bg={theme.bg}>
        <BackButton onPress={() => setSelected(null)} />
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pause_circle" size={30} color={theme.gold} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 16, color: theme.ink }}>{selected.name}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {t('concierge.serviceStatusSuspended', { name: selected.name })}
          </Text>
          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          <GhostButton
            label={toggling ? t('services.paying') : t('concierge.actionResume')}
            onPress={toggleSuspend}
            disabled={toggling}
            style={{ marginTop: 18, width: 220 }}
          />
        </View>
      </Screen>
    );
  }

  if (selected && selected.paid) {
    return (
      <Screen bg={theme.bg}>
        <BackButton onPress={() => setSelected(null)} />
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check_circle" size={30} color={theme.green} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 16, color: theme.ink }}>{selected.name}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {t('serviceLookup.upToDateBody', { supply: selected.supplyNumber })}
          </Text>
        </View>
      </Screen>
    );
  }

  if (selected) {
    return (
      <Screen bg={theme.bg}>
        <BackButton onPress={() => setSelected(null)} />
        <Text style={{ fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.8, color: theme.ink }}>{selected.name}</Text>
        <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>{selected.meta}</Text>

        <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 20, borderRadius: 24, padding: 22 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('services.totalToPay')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.heading, fontSize: 38, letterSpacing: -1.5, color: '#fff' }}>{money(selected.amount)}</Text>
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(217,190,122,.22)', gap: 11 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.period')}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#fff' }}>{selected.period}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.expiry')}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#fff' }}>{selected.expiry}</Text>
            </View>
            {selected.consumption ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.consumption')}</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#fff' }}>{selected.consumption}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="account_balance_wallet" size={20} color={theme.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{t('services.savings')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{t('services.available', { amount: money(available) })}</Text>
          </View>
          <Icon name="check_circle" size={19} color={theme.gold} />
        </View>

        {error ? (
          <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
        ) : null}

        <GoldButton
          label={paying ? t('services.paying') : t('services.pay', { amount: money(selected.amount) })}
          disabled={selected.amount > available || paying}
          onPress={submit}
          style={{ marginTop: 20 }}
        />
        <GhostButton
          label={toggling ? t('services.paying') : t('concierge.actionSuspend')}
          onPress={toggleSuspend}
          disabled={toggling || paying}
          style={{ marginTop: 10 }}
        />
      </Screen>
    );
  }

  return (
    <Screen bg={theme.bg}>
      <ScreenTitle eyebrow={t('services.eyebrow')} title={t('services.title')} />
      <Pressable
        onPress={() => nav.navigate('ServiceCatalog')}
        style={{ marginTop: 14, height: 48, borderRadius: 15, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }}
      >
        <Icon name="search" size={19} color={theme.soft} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: theme.soft }}>{t('services.searchPlaceholder')}</Text>
      </Pressable>

      <Text style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('services.yourBills')}</Text>
      <View style={{ marginTop: 12, gap: 11 }}>
        {services.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => {
              setError(null);
              setSelected(s);
            }}
            style={{ borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={s.icon} size={21} color={theme.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{s.name}</Text>
              <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{s.meta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 14.5, color: theme.ink }}>{money(s.amount)}</Text>
              <Text style={{ marginTop: 3, fontFamily: fonts.bodyBold, fontSize: 10.5, color: s.suspended ? theme.gold : s.dueColor === 'warn' ? theme.red : theme.green }}>
                {s.suspended ? t('services.suspended') : s.due}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => nav.navigate('ServiceCatalog')}
        style={{ marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: theme.line, borderStyle: 'dashed', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Icon name="add" size={21} color={theme.gold} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('services.addNewService')}</Text>
      </Pressable>
    </Screen>
  );
}
