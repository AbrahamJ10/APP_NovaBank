import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import Screen from '../../components/Screen';
import { Toggle } from '../../components/Primitives';
import { DangerButton, DangerOutlineButton, GhostButton } from '../../components/Buttons';
import BottomSheet from '../../components/BottomSheet';
import Icon from '../../components/Icon';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLastAccount } from '../../lib/secureTokens';

const RADIUS = 46;
const CIRC = 2 * Math.PI * RADIUS;

export default function SecurityScreen() {
  const nav = useNavigation<any>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { alerts, toggleAlert, panicMode, openPanic, closePanic, sessions, loadSecurity } = useAppState();
  const [confirmPanic, setConfirmPanic] = useState(false);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const [faceIdOn, setFaceIdOn] = useState(false);
  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(), getLastAccount()])
      .then(([hw, enrolled, remembered]) => setFaceIdOn(hw && enrolled && !!remembered))
      .catch(() => setFaceIdOn(false));
  }, []);

  const otherSessions = Math.max(0, sessions.length - 1);
  const noSuspicious = otherSessions === 0;

  const score = useMemo(() => {
    let s = 100;
    if (!faceIdOn) s -= 10;
    if (!noSuspicious) s -= 8;
    if (!alerts.compra) s -= 4;
    if (!alerts.retiro) s -= 4;
    if (!alerts.login) s -= 6;
    return Math.max(0, Math.min(100, s));
  }, [faceIdOn, noSuspicious, alerts]);

  const tasks = [
    { icon: 'fingerprint', done: faceIdOn, label: t('security.taskFaceId'), desc: faceIdOn ? t('security.taskFaceIdDesc') : t('security.taskFaceIdDescOff') },
    // Always true, not a stub: every transfer and profile change already
    // requires a real email OTP app-wide — there's no "off" state to check.
    { icon: 'password', done: true, label: t('security.taskTwoStep'), desc: t('security.taskTwoStepDesc') },
    {
      icon: 'gpp_maybe',
      done: noSuspicious,
      label: t('security.taskSuspicious'),
      desc: noSuspicious ? t('security.taskSuspiciousOk') : t('security.taskSuspiciousBad', { count: String(otherSessions) }),
    },
    { icon: 'notifications_active', done: alerts.compra && alerts.retiro && alerts.login, label: t('security.taskAlerts'), desc: t('security.taskAlertsDesc') },
  ];

  const alertRows: { key: keyof typeof alerts; icon: string; label: string }[] = [
    { key: 'compra', icon: 'shopping_cart', label: t('security.alertPurchase') },
    { key: 'retiro', icon: 'local_atm', label: t('security.alertWithdrawal') },
    { key: 'login', icon: 'login', label: t('security.alertLogin') },
    { key: 'promo', icon: 'local_offer', label: t('security.alertPromo') },
  ];

  return (
    <Screen bg={theme.bg}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: theme.gold, letterSpacing: 1.8, textTransform: 'uppercase' }}>{t('security.yourAccount')}</Text>
          <Text style={{ marginTop: 6, fontFamily: fonts.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('security.center')}</Text>
        </View>
        <LanguageSwitch />
      </View>

      <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 18, borderRadius: 26, padding: 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={112} height={112} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={56} cy={56} r={RADIUS} stroke="rgba(255,255,255,.15)" strokeWidth={9} fill="none" />
              <Circle cx={56} cy={56} r={RADIUS} stroke="#C9A227" strokeWidth={9} fill="none" strokeDasharray={`${CIRC},${CIRC}`} strokeDashoffset={CIRC * (1 - score / 100)} strokeLinecap="round" />
            </Svg>
            <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: '#fff', letterSpacing: -1 }}>{score}</Text>
            <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 8.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('security.of100')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 17, color: '#fff' }}>{score >= 90 ? t('security.excellent') : score >= 70 ? t('security.good') : t('security.atRisk')}</Text>
            <Text style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,.66)' }}>{t('security.completeActions')}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('security.improveProtection')}</Text>
        <View style={{ marginTop: 14, gap: 16 }}>
          {tasks.map((task) => (
            <View key={task.label} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Icon name={task.done ? 'check_circle' : task.icon} size={20} color={task.done ? theme.green : theme.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{task.label}</Text>
                <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: theme.soft }}>{task.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 18 }}>
        <ModuleRow
          icon="devices"
          label={t('security.devicesSessions')}
          desc={t('devices.subtitle', { count: String(sessions.length) })}
          badge={otherSessions > 0 ? String(otherSessions) : undefined}
          onPress={() => nav.navigate('Devices')}
        />
        <ModuleRow icon="place" label={t('security.limitsGeo')} desc={t('security.limitsGeoDesc')} onPress={() => nav.navigate('Limits')} last />
      </View>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('security.alertsYouGet')}</Text>
        <View style={{ marginTop: 10 }}>
          {alertRows.map((a) => (
            <View key={a.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11 }}>
              <Icon name={a.icon} size={19} color={theme.soft} />
              <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{a.label}</Text>
              <Toggle value={alerts[a.key]} onChange={() => toggleAlert(a.key)} />
            </View>
          ))}
        </View>
      </View>

      {panicMode && (
        <View style={{ marginTop: 16, borderRadius: 22, backgroundColor: '#B02B22', padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="gpp_bad" size={21} color="#fff" />
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 15, color: '#fff' }}>{t('security.panicModeActive')}</Text>
          </View>
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,.85)' }}>
            {t('security.panicModeActiveDesc')}
          </Text>
          <Pressable onPress={closePanic} style={{ marginTop: 16, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: '#fff' }}>{t('security.deactivatePanic')}</Text>
          </Pressable>
        </View>
      )}

      {!panicMode && (
        <>
          <DangerOutlineButton label={t('security.activatePanic')} icon="emergency_home" onPress={() => setConfirmPanic(true)} style={{ marginTop: 16 }} />
          <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: theme.soft }}>
            {t('security.panicHint')}
          </Text>
        </>
      )}

      <BottomSheet visible={confirmPanic} onClose={() => setConfirmPanic(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.warnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="emergency_home" size={26} color="#C2352B" />
        </View>
        <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 21, letterSpacing: -0.6, color: theme.ink }}>{t('security.confirmPanicTitle')}</Text>
        <Text style={{ marginTop: 9, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>
          {t('security.confirmPanicBody')}
        </Text>
        <DangerButton
          label={t('security.yesBlockAll')}
          onPress={() => {
            openPanic();
            setConfirmPanic(false);
          }}
          style={{ marginTop: 22 }}
        />
        <GhostButton label={t('security.cancel')} onPress={() => setConfirmPanic(false)} style={{ marginTop: 10 }} />
      </BottomSheet>
    </Screen>
  );
}

function ModuleRow({ icon, label, desc, badge, onPress, last }: { icon: string; label: string; desc: string; badge?: string; onPress?: () => void; last?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={theme.gold} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{label}</Text>
        <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{desc}</Text>
      </View>
      {badge ? (
        <View style={{ minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: theme.warnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: theme.red }}>{badge}</Text>
        </View>
      ) : null}
      <Icon name="chevron_right" size={18} color={theme.soft} />
    </Pressable>
  );
}
