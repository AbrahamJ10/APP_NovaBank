import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import DeslizadorSimple from '../../components/DeslizadorSimple';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../components/Pantalla';
import { BotonVolver, Interruptor } from '../../components/Primitivas';
import Icono from '../../components/Icono';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { dinero } from '../../lib/formato';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

const EN_LINEA_MIN = 200;
const EN_LINEA_MAX = 5000;
const CAJERO_MIN = 100;
const CAJERO_MAX = 2000;

export default function PantallaLimites() {
  const nav = useNavigation();
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { limitOnline, setLimitOnline, limitAtm, setLimitAtm, geoPeru, setGeoPeru, geoIntl, setGeoIntl, loadSecurity, saveLimits } = usarEstadoApp();

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const persistir = (siguiente: Partial<{ limitOnline: number; limitAtm: number; geoPeru: boolean; geoIntl: boolean }>) => {
    saveLimits({ limitOnline, limitAtm, geoPeru, geoIntl, ...siguiente });
  };

  return (
    <Pantalla bg={theme.bg}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fuentes.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('limits.title')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fuentes.body, fontSize: 12.5, color: theme.mid }}>{t('limits.subtitle')}</Text>

      <View style={{ marginTop: 18, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('limits.onlinePurchases')}</Text>
          <Text style={{ fontFamily: fuentes.heading, fontSize: 19, letterSpacing: -0.5, color: theme.ink }}>{dinero(limitOnline)}</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <DeslizadorSimple
            minimumValue={EN_LINEA_MIN}
            maximumValue={EN_LINEA_MAX}
            step={100}
            value={limitOnline}
            onValueChange={setLimitOnline}
            onSlidingComplete={(valor) => persistir({ limitOnline: valor })}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{dinero(EN_LINEA_MIN)}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{t('limits.dailyCap')}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{dinero(EN_LINEA_MAX)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('limits.atmWithdrawals')}</Text>
          <Text style={{ fontFamily: fuentes.heading, fontSize: 19, letterSpacing: -0.5, color: theme.ink }}>{dinero(limitAtm)}</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <DeslizadorSimple
            minimumValue={CAJERO_MIN}
            maximumValue={CAJERO_MAX}
            step={100}
            value={limitAtm}
            onValueChange={setLimitAtm}
            onSlidingComplete={(valor) => persistir({ limitAtm: valor })}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{dinero(CAJERO_MIN)}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{t('limits.dailyCap')}</Text>
          <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{dinero(CAJERO_MAX)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('limits.whereCardWorks')}</Text>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="place" size={20} color={theme.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{t('limits.peru')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11.5, color: theme.soft }}>{t('limits.peruDesc')}</Text>
          </View>
          <Interruptor value={geoPeru} onChange={(v) => { setGeoPeru(v); persistir({ geoPeru: v }); }} />
        </View>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="flight_takeoff" size={20} color={theme.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{t('limits.abroad')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11.5, color: theme.soft }}>{geoIntl ? t('limits.enabledTemp') : t('limits.blockedDefault')}</Text>
          </View>
          <Interruptor value={geoIntl} onChange={(v) => { setGeoIntl(v); persistir({ geoIntl: v }); }} />
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 20, backgroundColor: theme.tint, padding: 18, flexDirection: 'row', gap: 11 }}>
        <Icono name="info" size={19} color={theme.gold} />
        <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
          {t('limits.travelTip')}
        </Text>
      </View>
    </Pantalla>
  );
}
