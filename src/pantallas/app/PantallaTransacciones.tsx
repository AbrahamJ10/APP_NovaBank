import React, { useMemo, useState } from 'react';
import { Share, Text, View } from 'react-native';
import Pantalla from '../../componentes/Pantalla';
import { Pastilla, Fila } from '../../componentes/Primitivas';
import FilaTransaccion from '../../componentes/FilaTransaccion';
import HojaInferior from '../../componentes/HojaInferior';
import { BotonFantasma, BotonPrimario } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import SelectorIdioma from '../../componentes/SelectorIdioma';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { dinero } from '../../libreria/formato';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { Tx } from '../../estado/tipos';
import { usarIdioma } from '../../i18n/ContextoIdioma';

const CLAVES_FILTRO = ['7d', '30d', '90d', 'all'] as const;
const LIMITES: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, all: 100000 };

function etiquetaGrupo(diasAtras: number, t: (key: string) => string) {
  if (diasAtras === 0) return t('transactions.groupToday');
  if (diasAtras === 1) return t('transactions.groupYesterday');
  if (diasAtras <= 6) return t('transactions.groupThisWeek');
  if (diasAtras <= 29) return t('transactions.groupThisMonth');
  return t('transactions.groupEarlier');
}

export default function PantallaTransacciones() {
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { transacciones, refrescarCuenta } = usarEstadoApp();
  const [filtro, setFiltro] = useState<(typeof CLAVES_FILTRO)[number]>('30d');
  const [refrescando, setRefrescando] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Tx | null>(null);

  const etiquetaFiltro: Record<(typeof CLAVES_FILTRO)[number], string> = {
    '7d': t('transactions.filter7'),
    '30d': t('transactions.filter30'),
    '90d': t('transactions.filter90'),
    all: t('transactions.filterAll'),
  };

  const filtradas = useMemo(() => transacciones.filter((tx) => tx.daysAgo <= LIMITES[filtro]), [transacciones, filtro]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Tx[]>();
    filtradas.forEach((tx) => {
      const g = etiquetaGrupo(tx.daysAgo, t);
      if (!mapa.has(g)) mapa.set(g, []);
      mapa.get(g)!.push(tx);
    });
    return Array.from(mapa.entries());
  }, [filtradas, t]);

  const compartirTx = (tx: Tx) => {
    const cuando = tx.daysAgo === 0 ? t('transactions.groupToday') : tx.daysAgo === 1 ? t('transactions.groupYesterday') : t('transactions.daysAgo', { n: tx.daysAgo });
    Share.share({
      message: [
        `NovaBank`,
        `${tx.name} — ${tx.meta}`,
        `${tx.kind === 'credit' ? '+' : '-'}${dinero(tx.amount)}`,
        `${cuando} · ${tx.time}`,
        `${t('transactions.referenceLabel')}: ${('NV-' + tx.id).toUpperCase()}`,
      ].join('\n'),
    }).catch(() => {});
  };

  const refrescar = async () => {
    if (refrescando) return;
    setRefrescando(true);
    try {
      await refrescarCuenta();
    } finally {
      setRefrescando(false);
    }
  };

  return (
    <Pantalla padded={false} bg={tema.fondo}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fuentes.heading, fontSize: 25, letterSpacing: -0.8, color: tema.tinta }}>{t('transactions.title')}</Text>
          <Text style={{ marginTop: 5, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>{t('transactions.countInPeriod', { count: filtradas.length })}</Text>
        </View>
        <SelectorIdioma />
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 22, flexDirection: 'row', gap: 8 }}>
        {CLAVES_FILTRO.map((f) => (
          <Pastilla key={f} label={etiquetaFiltro[f]} active={filtro === f} onPress={() => setFiltro(f)} />
        ))}
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 22 }}>
        {refrescando ? (
          <View style={{ borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: tema.linea }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: tema.matiz }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ width: '55%', height: 12, borderRadius: 6, backgroundColor: tema.matiz }} />
                  <View style={{ width: '35%', height: 10, borderRadius: 5, backgroundColor: tema.matiz }} />
                </View>
                <View style={{ width: 60, height: 14, borderRadius: 7, backgroundColor: tema.matiz }} />
              </View>
            ))}
          </View>
        ) : (
          grupos.map(([label, items]) => (
            <View key={label} style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 11.5, color: tema.suave, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 9 }}>{label}</Text>
              <View style={{ borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, overflow: 'hidden' }}>
                {items.map((tx) => (
                  <FilaTransaccion key={tx.id} tx={tx} showDate onPress={() => setSeleccionada(tx)} />
                ))}
              </View>
            </View>
          ))
        )}

        <BotonFantasma label={t('transactions.refresh')} icon="sync" onPress={refrescar} style={{ marginTop: 4 }} />
        <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>
          {t('transactions.showingCount', { shown: filtradas.length, total: transacciones.length })}
        </Text>
      </View>

      <HojaInferior visible={!!seleccionada} onClose={() => setSeleccionada(null)}>
        {seleccionada ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: seleccionada.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                <Icono name={seleccionada.icon} size={24} color={seleccionada.iconFg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fuentes.headingBold, fontSize: 15.5, color: tema.tinta }}>{seleccionada.name}</Text>
                <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>{seleccionada.meta}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 18, fontFamily: fuentes.heading, fontSize: 32, letterSpacing: -1.2, color: seleccionada.kind === 'credit' ? tema.verde : tema.rojo }}>
              {seleccionada.kind === 'credit' ? '+' : '−'}
              {dinero(seleccionada.amount)}
            </Text>
            <View style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, backgroundColor: tema.matiz }}>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 11, color: tema.dorado }}>{t('transactions.completed')}</Text>
            </View>
            <View style={{ marginTop: 18 }}>
              <Fila
                label={t('transactions.dateLabel')}
                value={`${seleccionada.daysAgo === 0 ? t('transactions.groupToday') : seleccionada.daysAgo === 1 ? t('transactions.groupYesterday') : t('transactions.daysAgo', { n: seleccionada.daysAgo })} · ${seleccionada.time}`}
              />
              <Fila label={t('transactions.categoryLabel')} value={seleccionada.category} />
              <Fila label={t('transactions.referenceLabel')} value={('NV-' + seleccionada.id).toUpperCase()} />
            </View>
            <View style={{ marginTop: 20, flexDirection: 'row', gap: 10 }}>
              <BotonFantasma label={t('transactions.share')} icon="share" onPress={() => compartirTx(seleccionada)} style={{ flex: 1 }} />
              <BotonPrimario label={t('transactions.done')} onPress={() => setSeleccionada(null)} style={{ width: 96 }} />
            </View>
          </View>
        ) : null}
      </HojaInferior>
    </Pantalla>
  );
}
