import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BotonVolver } from '../../componentes/Primitivas';
import { MarcaLogo } from '../../componentes/Logo';
import Icono from '../../componentes/Icono';
import { fuentes } from '../../tema/estilos';
import { dinero } from '../../libreria/formato';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { ListaParametrosRaiz } from '../../navegacion/tipos';
import { ServiceBill } from '../../estado/tipos';
import { usarIdioma } from '../../i18n/ContextoIdioma';

type Accion = { id: string; label: string; run: () => void | Promise<void> };
type Mensaje = { id: string; from: 'agent' | 'usuario'; text: string; actions?: Accion[] };

let secuencia = 0;
function siguienteId(prefijo: string) {
  secuencia += 1;
  return `${prefijo}${secuencia}`;
}

export default function PantallaAsistente() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosRaiz>>();
  const { t } = usarIdioma();
  const {
    usuario,
    tarjetaBloqueada,
    solicitarBloqueoTarjeta,
    servicios,
    disponible,
    lineaCredito,
    deudaTarjeta,
    pagoMinimo,
    transacciones,
    sesiones,
    limiteEnLinea,
    limiteCajero,
    cargarSeguridad,
    pagarRecibo,
    suspenderRecibo,
    reanudarRecibo,
  } = usarEstadoApp();

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: siguienteId('a'), from: 'agent', text: t('concierge.greeting', { name: usuario.name.split(' ')[0] }), actions: menuPrincipal() },
  ]);
  const [borrador, setBorrador] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const refScroll = useRef<ScrollView>(null);

  function enviarAgente(text: string, actions?: Accion[]) {
    setMensajes((m) => [...m, { id: siguienteId('a'), from: 'agent', text, actions }]);
    setTimeout(() => refScroll.current?.scrollToEnd({ animated: true }), 50);
  }

  function enviarUsuario(text: string) {
    setMensajes((m) => [...m, { id: siguienteId('u'), from: 'usuario', text }]);
  }

  function menuPrincipal(): Accion[] {
    return [
      { id: 'card', label: t('concierge.menuCard'), run: mostrarMenuTarjeta },
      { id: 'servicios', label: t('concierge.menuServices'), run: mostrarMenuServicios },
      { id: 'balance', label: t('concierge.menuBalance'), run: mostrarSaldo },
      { id: 'security', label: t('concierge.menuSecurity'), run: mostrarInfoSeguridad },
    ];
  }

  function accionVolver(): Accion {
    return { id: 'back', label: t('concierge.back'), run: () => enviarAgente(t('concierge.menuTitle'), menuPrincipal()) };
  }

  // --- Bloqueo de tarjeta ---
  function mostrarMenuTarjeta() {
    enviarAgente(tarjetaBloqueada ? t('concierge.cardStatusBlocked') : t('concierge.cardStatusActive'), [
      tarjetaBloqueada
        ? { id: 'unblock', label: t('concierge.actionUnblockCard'), run: () => alternarTarjeta(false) }
        : { id: 'block', label: t('concierge.actionBlockCard'), run: () => alternarTarjeta(true) },
      accionVolver(),
    ]);
  }

  async function alternarTarjeta(bloquear: boolean) {
    enviarUsuario(bloquear ? t('concierge.actionBlockCard') : t('concierge.actionUnblockCard'));
    setOcupado(true);
    const resultado = await solicitarBloqueoTarjeta(bloquear);
    setOcupado(false);
    if (!resultado.ok) {
      enviarAgente(t('concierge.actionFailed', { message: resultado.message }), [accionVolver()]);
      return;
    }
    enviarAgente(bloquear ? t('concierge.cardBlockedDone') : t('concierge.cardUnblockedDone'), [accionVolver()]);
  }

  // --- Servicios y deudas ---
  function mostrarMenuServicios() {
    if (servicios.length === 0) {
      enviarAgente(t('concierge.servicesEmpty'), [accionVolver()]);
      return;
    }
    enviarAgente(
      t('concierge.servicesIntro'),
      servicios.map((servicio) => ({ id: servicio.id, label: `${servicio.name} · ${servicio.paid ? t('concierge.upToDateShort') : dinero(servicio.amount)}`, run: () => mostrarDetalleServicio(servicio) }))
        .concat([accionVolver()])
    );
  }

  function mostrarDetalleServicio(servicio: ServiceBill) {
    enviarUsuario(servicio.name);
    if (servicio.suspended) {
      enviarAgente(t('concierge.serviceStatusSuspended', { name: servicio.name }), [
        { id: 'resume', label: t('concierge.actionResume'), run: () => realizarReanudacion(servicio) },
        accionVolver(),
      ]);
      return;
    }
    if (servicio.paid) {
      enviarAgente(t('concierge.serviceStatusPaid', { name: servicio.name }), [
        { id: 'suspend', label: t('concierge.actionSuspend'), run: () => realizarSuspension(servicio) },
        accionVolver(),
      ]);
      return;
    }
    enviarAgente(t('concierge.serviceStatusDue', { name: servicio.name, amount: dinero(servicio.amount), date: servicio.expiry }), [
      { id: 'pay', label: t('concierge.actionPayNow'), run: () => confirmarPago(servicio) },
      { id: 'suspend', label: t('concierge.actionSuspend'), run: () => realizarSuspension(servicio) },
      accionVolver(),
    ]);
  }

  function confirmarPago(servicio: ServiceBill) {
    enviarUsuario(t('concierge.actionPayNow'));
    if (servicio.amount > disponible) {
      enviarAgente(t('concierge.cannotAffordService', { name: servicio.name }), [accionVolver()]);
      return;
    }
    enviarAgente(t('concierge.payConfirm', { amount: dinero(servicio.amount), name: servicio.name }), [
      { id: 'yes', label: t('concierge.yes'), run: () => realizarPago(servicio) },
      { id: 'no', label: t('concierge.no'), run: () => enviarAgente(t('concierge.menuTitle'), menuPrincipal()) },
    ]);
  }

  async function realizarPago(servicio: ServiceBill) {
    enviarUsuario(t('concierge.yes'));
    setOcupado(true);
    const resultado = await pagarRecibo(servicio.id);
    setOcupado(false);
    if (!resultado.ok) {
      enviarAgente(t('concierge.actionFailed', { message: resultado.message }), [accionVolver()]);
      return;
    }
    enviarAgente(t('concierge.paidDone', { amount: dinero(servicio.amount), name: servicio.name }), [accionVolver()]);
  }

  async function realizarSuspension(servicio: ServiceBill) {
    enviarUsuario(t('concierge.actionSuspend'));
    setOcupado(true);
    const resultado = await suspenderRecibo(servicio.id);
    setOcupado(false);
    if (!resultado.ok) {
      enviarAgente(t('concierge.actionFailed', { message: resultado.message }), [accionVolver()]);
      return;
    }
    enviarAgente(t('concierge.suspendedDone', { name: servicio.name }), [accionVolver()]);
  }

  async function realizarReanudacion(servicio: ServiceBill) {
    enviarUsuario(t('concierge.actionResume'));
    setOcupado(true);
    const resultado = await reanudarRecibo(servicio.id);
    setOcupado(false);
    if (!resultado.ok) {
      enviarAgente(t('concierge.actionFailed', { message: resultado.message }), [accionVolver()]);
      return;
    }
    enviarAgente(t('concierge.resumedDone', { name: servicio.name }), [accionVolver()]);
  }

  // --- Saldo y movimientos ---
  function mostrarSaldo() {
    enviarAgente(t('concierge.balanceInfo', { disponible: dinero(disponible), debt: dinero(deudaTarjeta), min: dinero(pagoMinimo), line: dinero(lineaCredito) }), [
      { id: 'movements', label: t('concierge.actionShowMovements'), run: mostrarMovimientos },
      accionVolver(),
    ]);
  }

  function mostrarMovimientos() {
    enviarUsuario(t('concierge.actionShowMovements'));
    if (transacciones.length === 0) {
      enviarAgente(t('concierge.noMovements'), [accionVolver()]);
      return;
    }
    const lineas = transacciones.slice(0, 3).map((tx) => `${tx.kind === 'credit' ? '+' : '−'}${dinero(tx.amount)} · ${tx.name}`).join('\n');
    enviarAgente(`${t('concierge.recentMovements')}\n${lineas}`, [accionVolver()]);
  }

  // --- Seguridad ---
  async function mostrarInfoSeguridad() {
    enviarAgente(t('concierge.securityLoading'));
    await cargarSeguridad();
    enviarAgente(t('concierge.securityInfo', { count: String(sesiones.length), online: dinero(limiteEnLinea), atm: dinero(limiteCajero) }), [
      { id: 'goSecurity', label: t('concierge.actionGoSecurity'), run: () => nav.navigate('Security') },
      accionVolver(),
    ]);
  }

  // --- Texto libre ---
  function manejarTextoLibre(texto: string) {
    const consulta = texto.toLowerCase();
    if (/blo(que|c)|tarjeta|card/.test(consulta)) return mostrarMenuTarjeta();
    if (/servici|deuda|factura|pagar|suspend|pausar|bill/.test(consulta)) return mostrarMenuServicios();
    if (/saldo|dinero|movimiento|balance/.test(consulta)) return mostrarSaldo();
    if (/segur|dispositivo|sesion|limite|security|device/.test(consulta)) return mostrarInfoSeguridad();
    enviarAgente(t('concierge.notUnderstood'), menuPrincipal());
  }

  const enviar = () => {
    const texto = borrador.trim();
    if (!texto || ocupado) return;
    enviarUsuario(texto);
    setBorrador('');
    setTimeout(() => manejarTextoLibre(texto), 350);
  };

  const ejecutarAccion = (accion: Accion) => {
    if (ocupado) return;
    accion.run();
  };

  return (
    <LinearGradient colors={['#0E2C4E', '#061626', '#08131F']} locations={[0, 0.42, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ paddingHorizontal: 22 }}>
            <BotonVolver oscuro onPress={() => nav.goBack()} />
          </View>
          <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center' }}>
              <MarcaLogo size={34} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#21A26B', borderWidth: 2.5, borderColor: '#0E2C4E' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fuentes.displaySemi, fontSize: 16, letterSpacing: 2.2, textTransform: 'uppercase', color: '#E7CE92' }}>{t('concierge.label')}</Text>
              <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>{t('concierge.online')}</Text>
            </View>
          </View>

          <ScrollView ref={refScroll} style={{ flex: 1, marginTop: 20 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 10, paddingBottom: 10 }}>
            {mensajes.map((mensaje) => (
              <View key={mensaje.id} style={{ alignSelf: mensaje.from === 'usuario' ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
                <View
                  style={{
                    backgroundColor: mensaje.from === 'usuario' ? '#C9A227' : 'rgba(255,255,255,.09)',
                    borderWidth: mensaje.from === 'usuario' ? 0 : 1,
                    borderColor: 'rgba(217,190,122,.16)',
                    borderRadius: 20,
                    borderBottomRightRadius: mensaje.from === 'usuario' ? 6 : 20,
                    borderBottomLeftRadius: mensaje.from === 'agent' ? 6 : 20,
                    padding: 15,
                  }}
                >
                  <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 13.5, lineHeight: 20, color: mensaje.from === 'usuario' ? '#071B31' : 'rgba(255,255,255,.88)' }}>{mensaje.text}</Text>
                </View>
                {mensaje.actions && mensaje.actions.length > 0 ? (
                  <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {mensaje.actions.map((accion) => (
                      <Pressable
                        key={accion.id}
                        onPress={() => ejecutarAccion(accion)}
                        style={({ pressed }) => [
                          { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(217,190,122,.35)', alignItems: 'center', justifyContent: 'center' },
                          pressed && { backgroundColor: 'rgba(217,190,122,.16)' },
                        ]}
                      >
                        <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 12, color: '#E7CE92' }}>{accion.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 16 }}>
            <View style={{ height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 8 }}>
              <TextInput
                value={borrador}
                onChangeText={setBorrador}
                placeholder={t('concierge.inputPlaceholder')}
                placeholderTextColor="rgba(255,255,255,.45)"
                style={{ flex: 1, fontSize: 13.5, color: '#fff' }}
                onSubmitEditing={enviar}
                editable={!ocupado}
              />
              <Pressable onPress={enviar} disabled={ocupado} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center', opacity: ocupado ? 0.6 : 1 }}>
                <Icono name="send" size={19} color="#071B31" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
