import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotonDorado } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { fuentes } from '../../tema/estilos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaRegistroCompleto() {
  const { t } = usarIdioma();
  const { usuario, setSesion, tocar } = usarEstadoApp();
  const primerNombre = usuario.name.split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: '#061626' }}>
      <LinearGradient colors={['#0E2C4E', '#061626']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 26, paddingTop: 60, paddingBottom: 30, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.check}>
            <Icono name="check" size={50} color="#7BE0A8" />
          </View>
          <Text style={styles.title}>{t('registerDone.title')}</Text>
          <Text style={styles.sub}>{t('registerDone.sub', { name: primerNombre })}</Text>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>{t('registerDone.savingsAccount')}</Text>
              <Text style={styles.cardValue}>{usuario.accountNumber}</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <Text style={styles.cardLabel}>{t('registerDone.cci')}</Text>
              <Text style={styles.cardValue}>{usuario.cci}</Text>
            </View>
          </View>
        </View>

        <BotonDorado
          label={t('registerDone.goToAccount')}
          onPress={() => {
            setSesion('in');
            tocar();
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 92,
    height: 92,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,.14)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 28, fontFamily: fuentes.heading, fontSize: 32, color: '#fff', letterSpacing: -1.2, textAlign: 'center' },
  sub: { marginTop: 12, fontFamily: fuentes.body, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,.72)', textAlign: 'center' },
  card: { marginTop: 26, width: '100%', backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 18, padding: 20 },
  cardLabel: { fontFamily: fuentes.body, fontSize: 11.5, color: 'rgba(255,255,255,.55)' },
  cardValue: { marginTop: 4, fontFamily: fuentes.headingBold, fontSize: 16, color: '#fff' },
});
