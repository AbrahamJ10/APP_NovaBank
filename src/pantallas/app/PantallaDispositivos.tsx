import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../componentes/Pantalla';
import { BotonVolver } from '../../componentes/Primitivas';
import { BotonFantasma } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaDispositivos() {
  const nav = useNavigation();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { sesiones, cargarSeguridad, revocarSesion, revocarOtrasSesiones } = usarEstadoApp();

  useEffect(() => {
    cargarSeguridad();
  }, [cargarSeguridad]);

  const otras = sesiones.filter((sesion) => !sesion.current);

  return (
    <Pantalla bg={tema.fondo}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fuentes.heading, fontSize: 26, letterSpacing: -0.9, color: tema.tinta }}>{t('devices.title')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>
        {t('devices.subtitle', { count: String(sesiones.length) })}
      </Text>

      <View style={{ marginTop: 16, gap: 11 }}>
        {sesiones.map((sesion) => (
          <View key={sesion.id} style={{ borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
                <Icono name="smartphone" size={21} color={tema.dorado} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }} numberOfLines={1}>
                  {sesion.device}
                </Text>
                <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>
                  {t('devices.since', { date: new Date(sesion.createdAt).toLocaleDateString('es-PE') })}
                  {sesion.ip ? ` · ${sesion.ip}` : ''}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, backgroundColor: tema.matiz }}>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 9.5, letterSpacing: 0.6, color: tema.medio }}>
                  {sesion.current ? t('devices.thisDevice') : t('devices.otherSession')}
                </Text>
              </View>
            </View>
            {!sesion.current && (
              <Pressable
                onPress={() => revocarSesion(sesion.id)}
                style={{ marginTop: 14, height: 44, borderRadius: 13, backgroundColor: tema.rojo, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icono name="logout" size={18} color="#fff" />
                <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13, color: '#fff' }}>{t('devices.closeSession')}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {otras.length === 0 && sesiones.length > 0 && (
        <Text style={{ marginTop: 14, fontFamily: fuentes.body, fontSize: 12, color: tema.suave, textAlign: 'center' }}>
          {t('devices.noOthers')}
        </Text>
      )}

      {otras.length > 0 && (
        <BotonFantasma
          label={t('devices.closeAllOthers')}
          icon="phonelink_erase"
          onPress={revocarOtrasSesiones}
          style={{ marginTop: 18 }}
        />
      )}
    </Pantalla>
  );
}
