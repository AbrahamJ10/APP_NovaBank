import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../components/Pantalla';
import { BotonVolver } from '../../components/Primitivas';
import Icono from '../../components/Icono';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { dinero } from '../../lib/formato';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaGastos() {
  const nav = useNavigation();
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { transactions } = usarEstadoApp();

  const META_CATEGORIA: Record<string, { label: string; color: string; icon: string }> = {
    compras: { label: t('spend.catCompras'), color: '#2C6FD1', icon: 'shopping_cart' },
    transferencias: { label: t('spend.catTransferencias'), color: '#133A63', icon: 'swap_horiz' },
    qr: { label: t('spend.catQr'), color: '#D2691E', icon: 'qr_code_2' },
    retiros: { label: t('spend.catRetiros'), color: '#5F6B78', icon: 'local_atm' },
    servicios: { label: t('spend.catServicios'), color: '#B07D07', icon: 'bolt' },
    pago_tarjeta: { label: t('spend.catPagoTarjeta'), color: '#7C3AED', icon: 'credit_card' },
  };

  const txMes = transactions.filter((tx) => tx.kind === 'debit' && tx.daysAgo <= 31);
  const total = txMes.reduce((s, tx) => s + tx.amount, 0);

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    txMes.forEach((tx) => mapa.set(tx.category, (mapa.get(tx.category) ?? 0) + tx.amount));
    return Array.from(mapa.entries())
      .map(([categoria, monto]) => ({ cat: categoria, amt: monto, pct: total > 0 ? monto / total : 0 }))
      .sort((a, b) => b.amt - a.amt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txMes, total]);

  const comerciosTop = useMemo(() => {
    const mapa = new Map<string, { amt: number; n: number }>();
    txMes.forEach((tx) => {
      const actual = mapa.get(tx.name) ?? { amt: 0, n: 0 };
      mapa.set(tx.name, { amt: actual.amt + tx.amount, n: actual.n + 1 });
    });
    return Array.from(mapa.entries())
      .map(([name, valor]) => ({ name, ...valor }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txMes]);

  return (
    <Pantalla bg={theme.bg}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fuentes.body, fontSize: 10.5, color: theme.gold, letterSpacing: 1.8, textTransform: 'uppercase' }}>{t('spend.last31Days')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fuentes.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('spend.title')}</Text>

      <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 18, borderRadius: 26, padding: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(217,190,122,.16)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#0A2038', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
              <Text
                style={{ fontFamily: fuentes.heading, fontSize: 14, color: '#fff', letterSpacing: -0.3 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {dinero(total)}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: fuentes.body, fontSize: 8.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('spend.spent')}</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 9 }}>
            {porCategoria.map(({ cat, pct }) => (
              <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: META_CATEGORIA[cat]?.color ?? '#999' }} />
                <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 11.5, color: 'rgba(255,255,255,.72)' }}>{META_CATEGORIA[cat]?.label ?? cat}</Text>
                <Text style={{ fontFamily: fuentes.headingBold, fontSize: 11.5, color: '#fff' }}>{Math.round(pct * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('spend.byCategory')}</Text>
        <View style={{ marginTop: 16, gap: 14 }}>
          {porCategoria.map(({ cat, amt, pct }) => (
            <View key={cat}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ flex: 1, fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{META_CATEGORIA[cat]?.label ?? cat}</Text>
                <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: theme.ink }}>{dinero(amt)}</Text>
              </View>
              <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: theme.tint, overflow: 'hidden' }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: META_CATEGORIA[cat]?.color ?? '#999', width: `${Math.max(4, pct * 100)}%` }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('spend.topMerchants')}</Text>
        <View style={{ marginTop: 14, gap: 15 }}>
          {comerciosTop.map((comercio) => (
            <View key={comercio.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#123A63', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fuentes.displaySemi, fontSize: 15, color: '#E7CE92' }}>{comercio.name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{comercio.name}</Text>
                <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{comercio.n} {comercio.n > 1 ? t('spend.operations') : t('spend.operation')}</Text>
              </View>
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: theme.ink }}>{dinero(comercio.amt)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: '#0E2C4E', padding: 20, flexDirection: 'row', gap: 12 }}>
        <Icono name="insights" size={20} color="#E7CE92" />
        <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 19, color: 'rgba(255,255,255,.82)' }}>
          {t('spend.summary', { total: dinero(total), count: txMes.length })}
        </Text>
      </View>
    </Pantalla>
  );
}
