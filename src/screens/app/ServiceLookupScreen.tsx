import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../components/Pantalla';
import { BotonVolver } from '../../components/Primitivas';
import CampoTexto from '../../components/CampoTexto';
import { BotonFantasma, BotonDorado, BotonPrimario } from '../../components/Botones';
import Icono from '../../components/Icono';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { dinero } from '../../lib/formato';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { ListaParametrosRaiz } from '../../navigation/tipos';
import { ServiceBill } from '../../state/tipos';
import { usarIdioma } from '../../i18n/ContextoIdioma';

type Ruta = RouteProp<ListaParametrosRaiz, 'ServiceLookup'>;

export default function ServiceLookupScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosRaiz>>();
  const { params } = useRoute<Ruta>();
  const { biller } = params;
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { available, affiliateService, payBill } = usarEstadoApp();

  const [numeroSuministro, setNumeroSuministro] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recibo, setRecibo] = useState<ServiceBill | null>(null);
  const [pagando, setPagando] = useState(false);
  const [pagado, setPagado] = useState(false);

  const consultar = async () => {
    if (cargando || !numeroSuministro.trim()) return;
    setCargando(true);
    setError(null);
    const resultado = await affiliateService(biller.key, numeroSuministro.trim());
    setCargando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setRecibo(resultado.bill);
  };

  const enviarPago = async () => {
    if (!recibo || pagando) return;
    setPagando(true);
    setError(null);
    const resultado = await payBill(recibo.id);
    setPagando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setPagado(true);
  };

  if (recibo && pagado) {
    return (
      <Pantalla bg={theme.bg}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fuentes.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('services.receiptPaid')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {t('services.receiptPaidBody', { name: recibo.name, amount: dinero(recibo.amount) })}
          </Text>
          <BotonFantasma label={t('serviceLookup.backToServices')} onPress={() => nav.navigate('Services')} style={{ marginTop: 24, width: 240 }} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla bg={theme.bg}>
      <BotonVolver onPress={() => nav.goBack()} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: biller.iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name={biller.icon} size={21} color={biller.iconFg} />
        </View>
        <Text style={{ fontFamily: fuentes.heading, fontSize: 22, letterSpacing: -0.6, color: theme.ink }}>{biller.name}</Text>
      </View>

      {!recibo ? (
        <View style={{ marginTop: 22 }}>
          <CampoTexto
            label={biller.fieldLabel}
            icon="tag"
            placeholder={biller.fieldPlaceholder}
            value={numeroSuministro}
            onChangeText={setNumeroSuministro}
            autoCapitalize="none"
          />
          {error ? (
            <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          <BotonPrimario
            label={cargando ? t('serviceLookup.checking') : t('serviceLookup.check')}
            disabled={!numeroSuministro.trim() || cargando}
            onPress={consultar}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : recibo.paid ? (
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check_circle" size={30} color={theme.green} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fuentes.headingBold, fontSize: 16, color: theme.ink }}>{t('serviceLookup.upToDate')}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {t('serviceLookup.upToDateBody', { supply: recibo.supplyNumber })}
          </Text>
          <BotonFantasma label={t('serviceLookup.backToServices')} onPress={() => nav.navigate('Services')} style={{ marginTop: 18, width: 220 }} />
        </View>
      ) : (
        <View style={{ marginTop: 22 }}>
          <View style={{ borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
            <Text style={{ fontFamily: fuentes.body, fontSize: 10.5, color: theme.soft, letterSpacing: 1.4, textTransform: 'uppercase' }}>{t('serviceLookup.amountDue')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fuentes.heading, fontSize: 32, letterSpacing: -1, color: theme.ink }}>{dinero(recibo.amount)}</Text>
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.line, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fuentes.body, fontSize: 12, color: theme.soft }}>{biller.fieldLabel}</Text>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: theme.ink }}>{recibo.supplyNumber}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fuentes.body, fontSize: 12, color: theme.soft }}>{t('services.expiry')}</Text>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: theme.ink }}>{recibo.expiry}</Text>
              </View>
            </View>
          </View>

          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          {recibo.amount > available ? (
            <Text style={{ marginTop: 10, fontFamily: fuentes.bodyMed, fontSize: 11.5, color: '#C2352B' }}>{t('qr.insufficientBalance')}</Text>
          ) : null}

          <BotonDorado
            label={pagando ? t('services.paying') : t('services.pay', { amount: dinero(recibo.amount) })}
            disabled={recibo.amount > available || pagando}
            onPress={enviarPago}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </Pantalla>
  );
}
