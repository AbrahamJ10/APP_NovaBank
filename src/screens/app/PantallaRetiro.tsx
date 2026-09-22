import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import Pantalla from '../../components/Pantalla';
import { TituloPantalla } from '../../components/Primitivas';
import { BotonPeligroContorno, BotonPrimario } from '../../components/Botones';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { mmss } from '../../lib/formato';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

const PREDEFINIDOS = [100, 200, 400, 700];
const RADIO = 46;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export default function PantallaRetiro() {
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { retiro, retiroRestante, retiroExpirado, generarRetiro, cancelarRetiro, renovarRetiro } = usarEstadoApp();
  const [monto, setMonto] = useState(200);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porcentaje = retiro ? retiroRestante / (30 * 60) : 0;

  const enviar = async () => {
    if (generando) return;
    setGenerando(true);
    setError(null);
    const resultado = await generarRetiro(monto);
    setGenerando(false);
    if (!resultado.ok) setError(resultado.message);
  };

  return (
    <Pantalla bg={tema.fondo}>
      <TituloPantalla title={t('withdraw.title')} showLanguageSwitch />

      {!retiro ? (
        <View>
          <Text style={{ marginTop: 5, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>
            {t('withdraw.subtitle')}
          </Text>
          <View style={{ marginTop: 20, borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22 }}>
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: tema.tinta }}>{t('withdraw.amountToWithdraw')}</Text>
            <View style={{ marginTop: 12, height: 74, borderRadius: 16, borderWidth: 1.5, borderColor: tema.dorado, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 9 }}>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 17, color: tema.suave }}>S/</Text>
              <Text style={{ fontFamily: fuentes.heading, fontSize: 30, letterSpacing: -1, color: tema.tinta }}>{monto.toFixed(2)}</Text>
            </View>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {PREDEFINIDOS.map((valor) => (
                <Pressable
                  key={valor}
                  onPress={() => setMonto(valor)}
                  style={{ width: '47%', height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: monto === valor ? tema.fondoSel : tema.fondo, borderWidth: monto === valor ? 1.5 : 0, borderColor: tema.dorado }}
                >
                  <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>S/ {valor}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ marginTop: 16, fontFamily: fuentes.body, fontSize: 11.5, lineHeight: 16, color: tema.suave }}>
              {t('withdraw.rules')}
            </Text>
          </View>
          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          <BotonPrimario
            label={generando ? t('withdraw.generating') : t('withdraw.generateKey')}
            icon="key"
            disabled={generando}
            onPress={enviar}
            style={{ marginTop: 18 }}
          />
        </View>
      ) : (
        <View style={{ marginTop: 18, borderRadius: 24, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 26, alignItems: 'center' }}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 11.5, color: tema.medio, textTransform: 'uppercase', letterSpacing: 1 }}>{t('withdraw.withdrawKey')}</Text>
          <Text style={{ marginTop: 12, fontFamily: fuentes.heading, fontSize: 36, letterSpacing: 5, color: retiroExpirado ? tema.suave : tema.tinta }}>{retiro.code}</Text>

          <View style={{ marginTop: 22, padding: 12, backgroundColor: '#fff', borderRadius: 18, opacity: retiroExpirado ? 0.35 : 1 }}>
            <QRCode value={retiro.qr} size={114} color="#0F1A26" backgroundColor="#fff" />
          </View>

          <View style={{ marginTop: 22, width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={110} height={110} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={55} cy={55} r={RADIO} stroke={tema.linea} strokeWidth={8} fill="none" />
              <Circle
                cx={55}
                cy={55}
                r={RADIO}
                stroke={retiroExpirado ? tema.suave : '#C9A227'}
                strokeWidth={8}
                fill="none"
                strokeDasharray={`${CIRCUNFERENCIA}, ${CIRCUNFERENCIA}`}
                strokeDashoffset={CIRCUNFERENCIA * (1 - porcentaje)}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={{ fontFamily: fuentes.heading, fontSize: 19, color: tema.tinta }}>{mmss(retiroRestante)}</Text>
            <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 10, color: tema.suave }}>{t('withdraw.remaining')}</Text>
          </View>

          <Text style={{ marginTop: 18, fontFamily: fuentes.headingBold, fontSize: 14, color: tema.tinta }}>
            {retiroExpirado ? t('withdraw.keyExpired') : t('withdraw.presentKey')}
          </Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: tema.suave }}>
            {retiroExpirado ? t('withdraw.generateNewToContinue') : t('withdraw.withdrawWithoutCard', { amount: retiro.amount.toFixed(2) })}
          </Text>

          {retiroExpirado ? (
            <BotonPrimario label={t('withdraw.generateNewKey')} icon="refresh" onPress={renovarRetiro} style={{ marginTop: 20, width: '100%' }} />
          ) : (
            <BotonPeligroContorno label={t('withdraw.cancelKey')} icon="close" onPress={cancelarRetiro} style={{ marginTop: 20, width: '100%' }} />
          )}
        </View>
      )}
    </Pantalla>
  );
}
