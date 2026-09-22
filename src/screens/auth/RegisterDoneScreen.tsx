import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoldButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function RegisterDoneScreen() {
  const { t } = useLanguage();
  const { user, setSession, touch } = useAppState();
  const primerNombre = user.name.split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: '#061626' }}>
      <LinearGradient colors={['#0E2C4E', '#061626']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 26, paddingTop: 60, paddingBottom: 30, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.check}>
            <Icon name="check" size={50} color="#7BE0A8" />
          </View>
          <Text style={styles.title}>{t('registerDone.title')}</Text>
          <Text style={styles.sub}>{t('registerDone.sub', { name: primerNombre })}</Text>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>{t('registerDone.savingsAccount')}</Text>
              <Text style={styles.cardValue}>{user.accountNumber}</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <Text style={styles.cardLabel}>{t('registerDone.cci')}</Text>
              <Text style={styles.cardValue}>{user.cci}</Text>
            </View>
          </View>
        </View>

        <GoldButton
          label={t('registerDone.goToAccount')}
          onPress={() => {
            setSession('in');
            touch();
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
  title: { marginTop: 28, fontFamily: fonts.heading, fontSize: 32, color: '#fff', letterSpacing: -1.2, textAlign: 'center' },
  sub: { marginTop: 12, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,.72)', textAlign: 'center' },
  card: { marginTop: 26, width: '100%', backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 18, padding: 20 },
  cardLabel: { fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,.55)' },
  cardValue: { marginTop: 4, fontFamily: fonts.headingBold, fontSize: 16, color: '#fff' },
});
