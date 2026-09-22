import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../components/Pantalla';
import { BotonVolver } from '../../components/Primitivas';
import { BotonFantasma } from '../../components/Botones';
import Icono from '../../components/Icono';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function DevicesScreen() {
  const nav = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { sessions, loadSecurity, revokeSession, revokeOtherSessions } = useAppState();

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const otras = sessions.filter((sesion) => !sesion.current);

  return (
    <Pantalla bg={theme.bg}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fonts.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('devices.title')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
        {t('devices.subtitle', { count: String(sessions.length) })}
      </Text>

      <View style={{ marginTop: 16, gap: 11 }}>
        {sessions.map((sesion) => (
          <View key={sesion.id} style={{ borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
                <Icono name="smartphone" size={21} color={theme.gold} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }} numberOfLines={1}>
                  {sesion.device}
                </Text>
                <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>
                  {t('devices.since', { date: new Date(sesion.createdAt).toLocaleDateString('es-PE') })}
                  {sesion.ip ? ` · ${sesion.ip}` : ''}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, backgroundColor: theme.tint }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 0.6, color: theme.mid }}>
                  {sesion.current ? t('devices.thisDevice') : t('devices.otherSession')}
                </Text>
              </View>
            </View>
            {!sesion.current && (
              <Pressable
                onPress={() => revokeSession(sesion.id)}
                style={{ marginTop: 14, height: 44, borderRadius: 13, backgroundColor: theme.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icono name="logout" size={18} color="#fff" />
                <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: '#fff' }}>{t('devices.closeSession')}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {otras.length === 0 && sessions.length > 0 && (
        <Text style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 12, color: theme.soft, textAlign: 'center' }}>
          {t('devices.noOthers')}
        </Text>
      )}

      {otras.length > 0 && (
        <BotonFantasma
          label={t('devices.closeAllOthers')}
          icon="phonelink_erase"
          onPress={revokeOtherSessions}
          style={{ marginTop: 18 }}
        />
      )}
    </Pantalla>
  );
}
