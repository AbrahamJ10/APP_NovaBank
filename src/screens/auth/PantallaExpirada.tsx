import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BotonPrimario } from '../../components/Botones';
import Icono from '../../components/Icono';
import { fuentes } from '../../tema/estilos';
import { ListaParametrosAuth } from '../../navigation/tipos';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaExpirada() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { t } = usarIdioma();
  const { setExpirado } = usarEstadoApp();

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(8,17,26,.75)', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 26, padding: 30, alignItems: 'center' }}>
        <View style={{ width: 60, height: 60, borderRadius: 19, backgroundColor: '#FFF9EC', alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="timer_off" size={30} color="#B07D07" />
        </View>
        <Text style={{ marginTop: 18, fontFamily: fuentes.heading, fontSize: 21, color: '#0F1A26', letterSpacing: -0.6 }}>{t('expired.title')}</Text>
        <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: '#5B6875' }}>
          {t('expired.body')}
        </Text>
        <BotonPrimario
          label={t('expired.signInAgain')}
          onPress={() => {
            setExpirado(false);
            nav.navigate('Login');
          }}
          style={{ marginTop: 22, width: '100%' }}
        />
        <Pressable
          onPress={() => {
            setExpirado(false);
            nav.navigate('Welcome' as never);
          }}
          style={{ marginTop: 14 }}
        >
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: '#5B6875' }}>{t('expired.goHome')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
