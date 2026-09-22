import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { fonts } from '../../theme/tokens';
import { GoldButton, GhostButton } from '../../components/Buttons';
import { LogoMark } from '../../components/Logo';
import Icon from '../../components/Icon';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useLanguage } from '../../i18n/LanguageContext';

export default function WelcomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { t } = useLanguage();

  const FEATURES = [
    { icon: 'qr_code_2', label: t('welcome.feature1') },
    { icon: 'swap_horiz', label: t('welcome.feature2') },
    { icon: 'shield_lock', label: t('welcome.feature3') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#061626' }}>
      <LinearGradient colors={['#0E2C4E', '#061626']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 26, justifyContent: 'space-between', paddingBottom: 24 }}>
        <View style={{ marginTop: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={styles.badge}>
              <LogoMark size={54} />
            </View>
            <LanguageSwitch dark />
          </View>
          <Text style={styles.wordmark}>NOVABANK</Text>
          <View style={styles.rule} />
          <Text style={styles.headline}>{t('welcome.headline')}</Text>
          <Text style={styles.sub}>{t('welcome.sub')}</Text>

          <View style={{ marginTop: 30, gap: 13 }}>
            {FEATURES.map((f) => (
              <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <Icon name={f.icon} size={19} color="#D9BE7A" />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 11 }}>
          <GoldButton label={t('welcome.createAccount')} onPress={() => nav.navigate('DniCapture')} />
          <GhostButton
            label={t('welcome.haveAccount')}
            onPress={() => nav.navigate('Login')}
            textColor="#fff"
            style={{ backgroundColor: 'transparent', borderColor: 'rgba(217,190,122,.5)' }}
          />
          <Text style={styles.footer}>{t('welcome.footer')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(27,78,128,.45)',
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  wordmark: { marginTop: 20, fontFamily: fonts.display, fontSize: 30, color: '#fff', letterSpacing: 3.4 },
  rule: { marginTop: 6, width: 56, height: 2, backgroundColor: '#C9A227' },
  headline: { marginTop: 26, fontFamily: fonts.heading, fontSize: 38, lineHeight: 42, color: '#fff', letterSpacing: -1.2 },
  sub: { marginTop: 16, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,.7)', maxWidth: 300 },
  featureText: { fontFamily: fonts.bodyMed, fontSize: 13.5, color: 'rgba(255,255,255,.86)' },
  footer: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.42)', marginTop: 4, letterSpacing: 0.3 },
});
