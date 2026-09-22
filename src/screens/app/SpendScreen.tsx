import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { BackButton } from '../../components/Primitives';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SpendScreen() {
  const nav = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { transactions } = useAppState();

  const CAT_META: Record<string, { label: string; color: string; icon: string }> = {
    compras: { label: t('spend.catCompras'), color: '#2C6FD1', icon: 'shopping_cart' },
    transferencias: { label: t('spend.catTransferencias'), color: '#133A63', icon: 'swap_horiz' },
    qr: { label: t('spend.catQr'), color: '#D2691E', icon: 'qr_code_2' },
    retiros: { label: t('spend.catRetiros'), color: '#5F6B78', icon: 'local_atm' },
    servicios: { label: t('spend.catServicios'), color: '#B07D07', icon: 'bolt' },
    pago_tarjeta: { label: t('spend.catPagoTarjeta'), color: '#7C3AED', icon: 'credit_card' },
  };

  const monthTx = transactions.filter((tx) => tx.kind === 'debit' && tx.daysAgo <= 31);
  const total = monthTx.reduce((s, tx) => s + tx.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.forEach((tx) => map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount));
    return Array.from(map.entries())
      .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? amt / total : 0 }))
      .sort((a, b) => b.amt - a.amt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthTx, total]);

  const topMerchants = useMemo(() => {
    const map = new Map<string, { amt: number; n: number }>();
    monthTx.forEach((tx) => {
      const cur = map.get(tx.name) ?? { amt: 0, n: 0 };
      map.set(tx.name, { amt: cur.amt + tx.amount, n: cur.n + 1 });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthTx]);

  return (
    <Screen bg={theme.bg}>
      <BackButton onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: theme.gold, letterSpacing: 1.8, textTransform: 'uppercase' }}>{t('spend.last31Days')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fonts.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('spend.title')}</Text>

      <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 18, borderRadius: 26, padding: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(217,190,122,.16)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#0A2038', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
              <Text
                style={{ fontFamily: fonts.heading, fontSize: 14, color: '#fff', letterSpacing: -0.3 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {money(total)}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 8.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('spend.spent')}</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 9 }}>
            {byCategory.map(({ cat, pct }) => (
              <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: CAT_META[cat]?.color ?? '#999' }} />
                <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,.72)' }}>{CAT_META[cat]?.label ?? cat}</Text>
                <Text style={{ fontFamily: fonts.headingBold, fontSize: 11.5, color: '#fff' }}>{Math.round(pct * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('spend.byCategory')}</Text>
        <View style={{ marginTop: 16, gap: 14 }}>
          {byCategory.map(({ cat, amt, pct }) => (
            <View key={cat}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{CAT_META[cat]?.label ?? cat}</Text>
                <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{money(amt)}</Text>
              </View>
              <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: theme.tint, overflow: 'hidden' }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: CAT_META[cat]?.color ?? '#999', width: `${Math.max(4, pct * 100)}%` }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('spend.topMerchants')}</Text>
        <View style={{ marginTop: 14, gap: 15 }}>
          {topMerchants.map((merchant) => (
            <View key={merchant.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#123A63', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15, color: '#E7CE92' }}>{merchant.name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{merchant.name}</Text>
                <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{merchant.n} {merchant.n > 1 ? t('spend.operations') : t('spend.operation')}</Text>
              </View>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{money(merchant.amt)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: '#0E2C4E', padding: 20, flexDirection: 'row', gap: 12 }}>
        <Icon name="insights" size={20} color="#E7CE92" />
        <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 19, color: 'rgba(255,255,255,.82)' }}>
          {t('spend.summary', { total: money(total), count: monthTx.length })}
        </Text>
      </View>
    </Screen>
  );
}
