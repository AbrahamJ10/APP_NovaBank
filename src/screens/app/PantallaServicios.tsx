import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../components/Pantalla';
import { BotonVolver, TituloPantalla } from '../../components/Primitivas';
import { BotonFantasma, BotonDorado } from '../../components/Botones';
import Icono from '../../components/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { dinero } from '../../lib/formato';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { ServiceBill } from '../../state/tipos';
import { ListaParametrosRaiz } from '../../navigation/tipos';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaServicios() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosRaiz>>();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { servicios, disponible, pagarRecibo, suspenderRecibo, reanudarRecibo } = usarEstadoApp();
  const [seleccionado, setSeleccionado] = useState<ServiceBill | null>(null);
  const [listo, setListo] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [alternando, setAlternando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!seleccionado || pagando) return;
    setPagando(true);
    setError(null);
    const resultado = await pagarRecibo(seleccionado.id);
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
    const resultado = seleccionado.suspended ? await reanudarRecibo(seleccionado.id) : await suspenderRecibo(seleccionado.id);
    setAlternando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setSeleccionado(resultado.bill);
  };

  if (listo && seleccionado) {
    return (
      <Pantalla bg={tema.fondo}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: tema.fondoOk, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check" size={44} color={tema.verde} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fuentes.heading, fontSize: 24, letterSpacing: -0.8, color: tema.tinta }}>{t('services.receiptPaid')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: tema.medio }}>
            {t('services.receiptPaidBody', { name: seleccionado.name, amount: dinero(seleccionado.amount) })}
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
      <Pantalla bg={tema.fondo}>
        <BotonVolver onPress={() => setSeleccionado(null)} />
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="pause_circle" size={30} color={tema.dorado} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fuentes.headingBold, fontSize: 16, color: tema.tinta }}>{seleccionado.name}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: tema.suave }}>
            {t('concierge.serviceStatusSuspended', { name: seleccionado.name })}
          </Text>
          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
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
      <Pantalla bg={tema.fondo}>
        <BotonVolver onPress={() => setSeleccionado(null)} />
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: tema.fondoOk, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check_circle" size={30} color={tema.verde} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fuentes.headingBold, fontSize: 16, color: tema.tinta }}>{seleccionado.name}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: tema.suave }}>
            {t('serviceLookup.upToDateBody', { supply: seleccionado.supplyNumber })}
          </Text>
        </View>
      </Pantalla>
    );
  }

  if (seleccionado) {
    return (
      <Pantalla bg={tema.fondo}>
        <BotonVolver onPress={() => setSeleccionado(null)} />
        <Text style={{ fontFamily: fuentes.heading, fontSize: 25, letterSpacing: -0.8, color: tema.tinta }}>{seleccionado.name}</Text>
        <Text style={{ marginTop: 5, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>{seleccionado.meta}</Text>

        <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 20, borderRadius: 24, padding: 22 }}>
          <Text style={{ fontFamily: fuentes.body, fontSize: 10.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('services.totalToPay')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fuentes.heading, fontSize: 38, letterSpacing: -1.5, color: '#fff' }}>{dinero(seleccionado.amount)}</Text>
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(217,190,122,.22)', gap: 11 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fuentes.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.period')}</Text>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: '#fff' }}>{seleccionado.period}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fuentes.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.expiry')}</Text>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: '#fff' }}>{seleccionado.expiry}</Text>
            </View>
            {seleccionado.consumption ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fuentes.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('services.consumption')}</Text>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: '#fff' }}>{seleccionado.consumption}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="account_balance_wallet" size={20} color={tema.dorado} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: tema.tinta }}>{t('services.savings')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{t('services.disponible', { amount: dinero(disponible) })}</Text>
          </View>
          <Icono name="check_circle" size={19} color={tema.dorado} />
        </View>

        {error ? (
          <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
        ) : null}

        <BotonDorado
          label={pagando ? t('services.paying') : t('services.pay', { amount: dinero(seleccionado.amount) })}
          disabled={seleccionado.amount > disponible || pagando}
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
    <Pantalla bg={tema.fondo}>
      <TituloPantalla eyebrow={t('services.eyebrow')} title={t('services.title')} />
      <Pressable
        onPress={() => nav.navigate('ServiceCatalog')}
        style={{ marginTop: 14, height: 48, borderRadius: 15, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }}
      >
        <Icono name="search" size={19} color={tema.suave} />
        <Text style={{ fontFamily: fuentes.body, fontSize: 13.5, color: tema.suave }}>{t('services.searchPlaceholder')}</Text>
      </Pressable>

      <Text style={{ marginTop: 20, fontFamily: fuentes.body, fontSize: 10, color: tema.suave, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('services.yourBills')}</Text>
      <View style={{ marginTop: 12, gap: 11 }}>
        {servicios.map((servicio) => (
          <Pressable
            key={servicio.id}
            onPress={() => {
              setError(null);
              setSeleccionado(servicio);
            }}
            style={{ borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name={servicio.icon} size={21} color={tema.dorado} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>{servicio.name}</Text>
              <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{servicio.meta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 14.5, color: tema.tinta }}>{dinero(servicio.amount)}</Text>
              <Text style={{ marginTop: 3, fontFamily: fuentes.bodyBold, fontSize: 10.5, color: servicio.suspended ? tema.dorado : servicio.dueColor === 'warn' ? tema.rojo : tema.verde }}>
                {servicio.suspended ? t('services.suspended') : servicio.due}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => nav.navigate('ServiceCatalog')}
        style={{ marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: tema.linea, borderStyle: 'dashed', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Icono name="add" size={21} color={tema.dorado} />
        <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>{t('services.addNewService')}</Text>
      </Pressable>
    </Pantalla>
  );
}
