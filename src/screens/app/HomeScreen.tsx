import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Screen from '../../components/Screen';
import TransactionRow from '../../components/TransactionRow';
import Icon from '../../components/Icon';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

type Nav = CompositeNavigationProp<NativeStackNavigationProp<RootStackParamList>, BottomTabNavigationProp<TabParamList>>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { theme, dark, toggle } = useTheme();
  const { t } = useLanguage();
  const { user, available, held, creditLine, minPayment, cutDate, cardBlocked, transactions } = useAppState();

  const QUICK = [
    { icon: 'swap_horiz', label: t('home.quickTransfer'), go: 'TransferTab' as const },
    { icon: 'qr_code_2', label: t('home.quickQr'), go: 'Qr' as const },
    { icon: 'receipt_long', label: t('home.quickServices'), go: 'Services' as const },
    { icon: 'local_atm', label: t('home.quickWithdraw'), go: 'Withdraw' as const },
    { icon: 'credit_score', label: t('home.quickPayCard'), go: 'PayCard' as const },
    { icon: 'support_agent', label: t('home.quickConcierge'), go: 'Concierge' as const },
  ];
  const [hide, setHide] = useState(false);

  const recent = transactions.slice(0, 4);
  const mask = (v: string) => v.replace(/[0-9]/g, '•');

  return (
    <Screen scroll padded={false} bg={theme.bg}>
      <LinearGradient colors={['#0E2C4E', '#061626']} start={{ x: 0.85, y: 0 }} end={{ x: 0.2, y: 1 }} style={{ paddingTop: 14, paddingHorizontal: 22, paddingBottom: 30, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(217,190,122,.4)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 14, color: '#E7CE92' }}>{user.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(217,190,122,.85)', letterSpacing: 1.4, textTransform: 'uppercase' }}>{t('home.privateBanking')}</Text>
            <Text style={{ marginTop: 3, fontFamily: fonts.headingBold, fontSize: 16, color: '#fff' }}>{user.name}</Text>
          </View>
          <LanguageSwitch dark compact />
          <Pressable onPress={toggle} style={hstyles.iconBtn}>
            <Icon name={dark ? 'light_mode' : 'dark_mode'} size={19} color="#E7CE92" />
          </Pressable>
          <Pressable onPress={() => nav.navigate('Notifications' as never)} style={hstyles.iconBtn}>
            <Icon name="notifications" size={20} color="#fff" />
            <View style={hstyles.dot} />
          </Pressable>
        </View>

        <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>{t('home.availableBalance')}</Text>
          <Pressable onPress={() => setHide((h) => !h)} style={hstyles.eyeBtn}>
            <Icon name={hide ? 'visibility_off' : 'visibility'} size={17} color="#fff" />
          </Pressable>
        </View>
        <Text style={{ marginTop: 6, fontFamily: fonts.heading, fontSize: 42, letterSpacing: -1.8, color: '#fff' }}>
          {hide ? mask(money(available)) : money(available)}
        </Text>
        <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 22, height: 1, backgroundColor: 'rgba(217,190,122,.7)' }} />
          <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>
            {t('home.accountsSummary', { a: user.accountNumber.slice(-4), b: user.cardNumber.slice(-4) })}
          </Text>
        </View>

        <View style={{ marginTop: 22, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(217,190,122,.22)', padding: 18, flexDirection: 'row', flexWrap: 'wrap' }}>
          <MiniStat label={t('home.heldBalance')} value={money(held)} />
          <MiniStat label={t('home.creditLine')} value={money(creditLine)} />
          <MiniStat label={t('home.minPayment')} value={money(minPayment)} />
          <MiniStat label={t('home.cutDate')} value={cutDate} />
        </View>
      </LinearGradient>

      <View style={{ padding: 22, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
          {QUICK.map((q) => (
            <Pressable
              key={q.label}
              onPress={() => (q.go === 'TransferTab' ? nav.navigate('Transfer' as never) : nav.navigate(q.go as any))}
              style={{ width: '47%', borderRadius: 18, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 16, gap: 10 }}
            >
              <Icon name={q.icon} size={23} color={theme.gold} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.headingBold, fontSize: 15.5, color: theme.ink }}>{t('home.recentMovements')}</Text>
          <Pressable onPress={() => nav.navigate('Transactions' as never)}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: theme.gold }}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 8, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' }}>
          {recent.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} showDate />
          ))}
        </View>

        <Pressable
          onPress={() => nav.navigate('Card')}
          style={{ marginTop: 20, borderRadius: 20, padding: 18, backgroundColor: cardBlocked ? '#5B6875' : '#123A63', flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <Icon name={cardBlocked ? 'lock' : 'credit_card'} size={26} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 14.5, color: '#fff' }}>NovaBank Visa ···{user.cardNumber.slice(-4)}</Text>
            <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,.65)' }}>
              {t('home.cardStatus', { status: cardBlocked ? t('home.cardBlocked') : t('home.cardActive') })}
            </Text>
          </View>
          <Icon name="chevron_right" size={20} color="rgba(255,255,255,.7)" />
        </Pressable>

        <Pressable
          onPress={() => nav.navigate('Spend')}
          style={{ marginTop: 12, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.surf }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 14, color: theme.ink }}>{t('home.monthSpend')}</Text>
            <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{t('home.reviewCategories')}</Text>
          </View>
          <Icon name="chevron_right" size={20} color="#A6B1BD" />
        </Pressable>

        <Pressable
          onPress={() => nav.navigate('Concierge')}
          style={{ marginTop: 12, borderRadius: 20, padding: 18, backgroundColor: '#0E2C4E', flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(217,190,122,.16)', borderWidth: 1, borderColor: 'rgba(217,190,122,.35)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="support_agent" size={21} color="#E7CE92" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 14, color: '#fff' }}>{t('home.conciergeOnline')}</Text>
            <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>{t('home.conciergeReply')}</Text>
          </View>
          <Icon name="chevron_right" size={20} color="rgba(231,206,146,.8)" />
        </Pressable>
      </View>
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', marginBottom: 10 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.55)' }}>{label}</Text>
      <Text style={{ marginTop: 4, fontFamily: fonts.headingBold, fontSize: 15, color: '#fff' }}>{value}</Text>
    </View>
  );
}

const hstyles = {
  iconBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' as const, justifyContent: 'center' as const },
  dot: { position: 'absolute' as const, top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B5A', borderWidth: 2, borderColor: '#0B2340' },
  eyeBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center' as const, justifyContent: 'center' as const },
};
