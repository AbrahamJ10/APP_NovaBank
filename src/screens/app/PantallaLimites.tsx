import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import DeslizadorSimple from '../../components/DeslizadorSimple';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../components/Pantalla';
import { BotonVolver, Interruptor } from '../../components/Primitivas';
import Icono from '../../components/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { dinero } from '../../lib/formato';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

const EN_LINEA_MIN = 200;
const EN_LINEA_MAX = 5000;
const CAJERO_MIN = 100;
const CAJERO_MAX = 2000;

export default function PantallaLimites() {
  const nav = useNavigation();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { limiteEnLinea, setLimiteEnLinea, limiteCajero, setLimiteCajero, geoPeru, setGeoPeru, geoInternacional, setGeoInternacional, cargarSeguridad, guardarLimites } = usarEstadoApp();

  useEffect(() => {
    cargarSeguridad();
  }, [cargarSeguridad]);

  const persistir = (siguiente: Partial<{ limiteEnLinea: number; limiteCajero: number; geoPeru: boolean; geoInternacional: boolean }>) => {
    guardarLimites({ limiteEnLinea, limiteCajero, geoPeru, geoInternacional, ...siguiente });
  };

  return (
    <Pantalla bg={tema.fondo}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fuentes.heading, fontSize: 26, letterSpacing: -0.9, color: tema.tinta }}>{t('limits.title')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>{t('limits.subtitle')}</Text>

      <View style={{ marginTop: 18, borderRadius: 24, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>{t('limits.onlinePurchases')}</Text>
          <Text style={{ fontFamily: fuentes.heading, fontSize: 19, letterSpacing: -0.5, color: tema.tinta }}>{dinero(limiteEnLinea)}</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <DeslizadorSimple
            minimumValue={EN_LINEA_MIN}
            maximumValue={EN_LINEA_MAX}
            step={100}
            value={limiteEnLinea}
            onValueChange={setLimiteEnLinea}
            onSlidingComplete={(valor) => persistir({ limiteEnLinea: valor })}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{dinero(EN_LINEA_MIN)}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{t('limits.dailyCap')}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{dinero(EN_LINEA_MAX)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 24, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>{t('limits.atmWithdrawals')}</Text>
          <Text style={{ fontFamily: fuentes.heading, fontSize: 19, letterSpacing: -0.5, color: tema.tinta }}>{dinero(limiteCajero)}</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <DeslizadorSimple
            minimumValue={CAJERO_MIN}
            maximumValue={CAJERO_MAX}
            step={100}
            value={limiteCajero}
            onValueChange={setLimiteCajero}
            onSlidingComplete={(valor) => persistir({ limiteCajero: valor })}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{dinero(CAJERO_MIN)}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{t('limits.dailyCap')}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{dinero(CAJERO_MAX)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 24, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: tema.suave, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('limits.whereCardWorks')}</Text>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="place" size={20} color={tema.dorado} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: tema.tinta }}>{t('limits.peru')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>{t('limits.peruDesc')}</Text>
          </View>
          <Interruptor value={geoPeru} onChange={(v) => { setGeoPeru(v); persistir({ geoPeru: v }); }} />
        </View>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="flight_takeoff" size={20} color={tema.dorado} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: tema.tinta }}>{t('limits.abroad')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>{geoInternacional ? t('limits.enabledTemp') : t('limits.blockedDefault')}</Text>
          </View>
          <Interruptor value={geoInternacional} onChange={(v) => { setGeoInternacional(v); persistir({ geoInternacional: v }); }} />
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 20, backgroundColor: tema.matiz, padding: 18, flexDirection: 'row', gap: 11 }}>
        <Icono name="info" size={19} color={tema.dorado} />
        <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: tema.medio }}>
          {t('limits.travelTip')}
        </Text>
      </View>
    </Pantalla>
  );
}
