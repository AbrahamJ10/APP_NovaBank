import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../components/Pantalla';
import { Fila } from '../../components/Primitivas';
import HojaInferior from '../../components/HojaInferior';
import { BotonFantasma, BotonPrimario } from '../../components/Botones';
import Icono from '../../components/Icono';
import SelectorIdioma from '../../components/SelectorIdioma';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { NotificationItem } from '../../state/tipos';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaNotificaciones() {
  const nav = useNavigation<any>();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { notificaciones, marcarTodasNotifLeidas, marcarNotifLeida, limpiarNotificaciones } = usarEstadoApp();
  const cantidadNoLeidas = notificaciones.filter((n) => n.unread).length;
  const [seleccionada, setSeleccionada] = useState<NotificationItem | null>(null);

  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof notificaciones>();
    notificaciones.forEach((notificacion) => {
      if (!mapa.has(notificacion.group)) mapa.set(notificacion.group, []);
      mapa.get(notificacion.group)!.push(notificacion);
    });
    return Array.from(mapa.entries());
  }, [notificaciones]);

  const abrirDetalle = (notificacion: NotificationItem) => {
    setSeleccionada(notificacion);
    if (notificacion.unread) marcarNotifLeida(notificacion.id);
  };

  const accionRelacionada = (notificacion: NotificationItem | null) => {
    if (!notificacion) return null;
    if (notificacion.icon === 'gpp_maybe') return { label: t('notifications.actionDevices'), go: () => nav.navigate('Devices') };
    if (notificacion.icon === 'bolt') return { label: t('notifications.actionPayService'), go: () => nav.navigate('Services') };
    if (notificacion.icon === 'swap_horiz' || notificacion.icon === 'shopping_cart' || notificacion.icon === 'arrow_downward') return { label: t('notifications.actionTransactions'), go: () => nav.navigate('Transactions') };
    return null;
  };
  const accion = accionRelacionada(seleccionada);

  return (
    <Pantalla bg={tema.fondo}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text style={{ fontFamily: fuentes.heading, fontSize: 25, letterSpacing: -0.8, color: tema.tinta }}>{t('notifications.title')}</Text>
          <Text style={{ marginTop: 5, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>
            {cantidadNoLeidas > 0 ? t('notifications.unread', { count: cantidadNoLeidas }) : t('notifications.allRead')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <SelectorIdioma />
          {notificaciones.length > 0 && (
            <Pressable onPress={marcarTodasNotifLeidas} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, backgroundColor: tema.superficie, borderWidth: 1.5, borderColor: tema.linea }}>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 11, color: tema.medio }}>{t('notifications.markRead')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {notificaciones.length === 0 ? (
        <View style={{ marginTop: 100, alignItems: 'center' }}>
          <View style={{ width: 110, height: 110, borderRadius: 34, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="notifications_off" size={56} color="#D9BE7A" />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fuentes.heading, fontSize: 20, letterSpacing: -0.5, color: tema.tinta }}>{t('notifications.emptyTitle')}</Text>
          <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: tema.medio, maxWidth: 260 }}>
            {t('notifications.emptyBody')}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 18, gap: 20 }}>
          {grupos.map(([label, items]) => (
            <View key={label}>
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 11, color: tema.suave, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
              <View style={{ marginTop: 10, borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, overflow: 'hidden' }}>
                {items.map((notificacion, i) => (
                  <Pressable
                    key={notificacion.id}
                    onPress={() => abrirDetalle(notificacion)}
                    style={({ pressed }) => [
                      { flexDirection: 'row', gap: 13, padding: 16, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: tema.linea },
                      pressed && { backgroundColor: tema.matiz },
                    ]}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: notificacion.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icono name={notificacion.icon} size={20} color={notificacion.iconFg} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13, color: tema.tinta }}>{notificacion.title}</Text>
                        {notificacion.unread ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tema.dorado }} /> : null}
                      </View>
                      <Text style={{ marginTop: 4, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: tema.medio }}>{notificacion.body}</Text>
                    </View>
                    <Icono name="chevron_right" size={18} color={tema.suave} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <Pressable onPress={limpiarNotificaciones} style={{ alignSelf: 'center', marginTop: 4 }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12, color: tema.suave }}>{t('notifications.clearAll')}</Text>
          </Pressable>
        </View>
      )}

      <HojaInferior visible={!!seleccionada} onClose={() => setSeleccionada(null)}>
        {seleccionada ? (
          <View>
            <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: seleccionada.iconBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name={seleccionada.icon} size={24} color={seleccionada.iconFg} />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fuentes.heading, fontSize: 19, letterSpacing: -0.5, color: tema.tinta }}>{seleccionada.title}</Text>
            <Text style={{ marginTop: 8, fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 20, color: tema.medio }}>{seleccionada.body}</Text>
            <View style={{ marginTop: 18 }}>
              <Fila label={t('notifications.when')} value={`${seleccionada.group} · ${seleccionada.time}`} />
            </View>
            {accion ? (
              <BotonPrimario
                label={accion.label}
                onPress={() => {
                  setSeleccionada(null);
                  accion.go();
                }}
                style={{ marginTop: 18 }}
              />
            ) : null}
            <BotonFantasma label={t('notifications.close')} onPress={() => setSeleccionada(null)} style={{ marginTop: 10 }} />
          </View>
        ) : null}
      </HojaInferior>
    </Pantalla>
  );
}
