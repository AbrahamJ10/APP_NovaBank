import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import SimpleSlider from '../../components/SimpleSlider';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { BackButton, Toggle } from '../../components/Primitives';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

const ONLINE_MIN = 200;
const ONLINE_MAX = 5000;
const ATM_MIN = 100;
const ATM_MAX = 2000;

export default function LimitsScreen() {
  const nav = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { limitOnline, setLimitOnline, limitAtm, setLimitAtm, geoPeru, setGeoPeru, geoIntl, setGeoIntl, loadSecurity, saveLimits } = useAppState();

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const persist = (next: Partial<{ limitOnline: number; limitAtm: number; geoPeru: boolean; geoIntl: boolean }>) => {
    saveLimits({ limitOnline, limitAtm, geoPeru, geoIntl, ...next });
  };

  return (
    <Screen bg={theme.bg}>
      <BackButton onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fonts.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('limits.title')}</Text>
      <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>{t('limits.subtitle')}</Text>

      <View style={{ marginTop: 18, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('limits.onlinePurchases')}</Text>
          <Text style={{ fontFamily: fonts.heading, fontSize: 19, letterSpacing: -0.5, color: theme.ink }}>{money(limitOnline)}</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <SimpleSlider
            minimumValue={ONLINE_MIN}
            maximumValue={ONLINE_MAX}
            step={100}
            value={limitOnline}
            onValueChange={setLimitOnline}
            onSlidingComplete={(v) => persist({ limitOnline: v })}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{money(ONLINE_MIN)}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{t('limits.dailyCap')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{money(ONLINE_MAX)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('limits.atmWithdrawals')}</Text>
          <Text style={{ fontFamily: fonts.heading, fontSize: 19, letterSpacing: -0.5, color: theme.ink }}>{money(limitAtm)}</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <SimpleSlider
            minimumValue={ATM_MIN}
            maximumValue={ATM_MAX}
            step={100}
            value={limitAtm}
            onValueChange={setLimitAtm}
            onSlidingComplete={(v) => persist({ limitAtm: v })}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{money(ATM_MIN)}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{t('limits.dailyCap')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{money(ATM_MAX)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('limits.whereCardWorks')}</Text>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="place" size={20} color={theme.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{t('limits.peru')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{t('limits.peruDesc')}</Text>
          </View>
          <Toggle value={geoPeru} onChange={(v) => { setGeoPeru(v); persist({ geoPeru: v }); }} />
        </View>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flight_takeoff" size={20} color={theme.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{t('limits.abroad')}</Text>
            <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{geoIntl ? t('limits.enabledTemp') : t('limits.blockedDefault')}</Text>
          </View>
          <Toggle value={geoIntl} onChange={(v) => { setGeoIntl(v); persist({ geoIntl: v }); }} />
        </View>
      </View>

      <View style={{ marginTop: 14, borderRadius: 20, backgroundColor: theme.tint, padding: 18, flexDirection: 'row', gap: 11 }}>
        <Icon name="info" size={19} color={theme.gold} />
        <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
          {t('limits.travelTip')}
        </Text>
      </View>
    </Screen>
  );
}
