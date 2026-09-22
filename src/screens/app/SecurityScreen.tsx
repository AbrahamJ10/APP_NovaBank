import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import Pantalla from '../../components/Pantalla';
import { Interruptor } from '../../components/Primitivas';
import { BotonPeligro, BotonPeligroContorno, BotonFantasma } from '../../components/Botones';
import HojaInferior from '../../components/HojaInferior';
import Icono from '../../components/Icono';
import SelectorIdioma from '../../components/SelectorIdioma';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';
import { obtenerUltimaCuenta } from '../../lib/tokensSeguros';

const RADIO = 46;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export default function SecurityScreen() {
  const nav = useNavigation<any>();
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { alerts, toggleAlert, panicMode, openPanic, closePanic, sessions, loadSecurity } = usarEstadoApp();
  const [confirmarPanico, setConfirmarPanico] = useState(false);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const [faceIdActivo, setFaceIdActivo] = useState(false);
  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(), obtenerUltimaCuenta()])
      .then(([hw, enrolled, remembered]) => setFaceIdActivo(hw && enrolled && !!remembered))
      .catch(() => setFaceIdActivo(false));
  }, []);

  const otrasSesiones = Math.max(0, sessions.length - 1);
  const sinSospechosas = otrasSesiones === 0;

  const puntaje = useMemo(() => {
    let puntos = 100;
    if (!faceIdActivo) puntos -= 10;
    if (!sinSospechosas) puntos -= 8;
    if (!alerts.compra) puntos -= 4;
    if (!alerts.retiro) puntos -= 4;
    if (!alerts.login) puntos -= 6;
    return Math.max(0, Math.min(100, puntos));
  }, [faceIdActivo, sinSospechosas, alerts]);

  const tareas = [
    { icon: 'fingerprint', done: faceIdActivo, label: t('security.taskFaceId'), desc: faceIdActivo ? t('security.taskFaceIdDesc') : t('security.taskFaceIdDescOff') },
    // Siempre true, no es un relleno: toda transferencia y cambio de perfil
    // ya exige un OTP real por correo en toda la app — no hay un estado
    // "apagado" que verificar.
    { icon: 'password', done: true, label: t('security.taskTwoStep'), desc: t('security.taskTwoStepDesc') },
    {
      icon: 'gpp_maybe',
      done: sinSospechosas,
      label: t('security.taskSuspicious'),
      desc: sinSospechosas ? t('security.taskSuspiciousOk') : t('security.taskSuspiciousBad', { count: String(otrasSesiones) }),
    },
    { icon: 'notifications_active', done: alerts.compra && alerts.retiro && alerts.login, label: t('security.taskAlerts'), desc: t('security.taskAlertsDesc') },
  ];

  const filasAlerta: { key: keyof typeof alerts; icon: string; label: string }[] = [
    { key: 'compra', icon: 'shopping_cart', label: t('security.alertPurchase') },
    { key: 'retiro', icon: 'local_atm', label: t('security.alertWithdrawal') },
    { key: 'login', icon: 'login', label: t('security.alertLogin') },
    { key: 'promo', icon: 'local_offer', label: t('security.alertPromo') },
  ];

  return (
    <Pantalla bg={theme.bg}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fuentes.body, fontSize: 10.5, color: theme.gold, letterSpacing: 1.8, textTransform: 'uppercase' }}>{t('security.yourAccount')}</Text>
          <Text style={{ marginTop: 6, fontFamily: fuentes.heading, fontSize: 26, letterSpacing: -0.9, color: theme.ink }}>{t('security.center')}</Text>
        </View>
        <SelectorIdioma />
      </View>

      <LinearGradient colors={['#0E2C4E', '#061626']} style={{ marginTop: 18, borderRadius: 26, padding: 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={112} height={112} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={56} cy={56} r={RADIO} stroke="rgba(255,255,255,.15)" strokeWidth={9} fill="none" />
              <Circle cx={56} cy={56} r={RADIO} stroke="#C9A227" strokeWidth={9} fill="none" strokeDasharray={`${CIRCUNFERENCIA},${CIRCUNFERENCIA}`} strokeDashoffset={CIRCUNFERENCIA * (1 - puntaje / 100)} strokeLinecap="round" />
            </Svg>
            <Text style={{ fontFamily: fuentes.heading, fontSize: 28, color: '#fff', letterSpacing: -1 }}>{puntaje}</Text>
            <Text style={{ marginTop: 4, fontFamily: fuentes.body, fontSize: 8.5, color: 'rgba(217,190,122,.9)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('security.of100')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 17, color: '#fff' }}>{puntaje >= 90 ? t('security.excellent') : puntaje >= 70 ? t('security.good') : t('security.atRisk')}</Text>
            <Text style={{ marginTop: 7, fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,.66)' }}>{t('security.completeActions')}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('security.improveProtection')}</Text>
        <View style={{ marginTop: 14, gap: 16 }}>
          {tareas.map((tarea) => (
            <View key={tarea.label} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Icono name={tarea.done ? 'check_circle' : tarea.icon} size={20} color={tarea.done ? theme.green : theme.red} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{tarea.label}</Text>
                <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11.5, lineHeight: 16, color: theme.soft }}>{tarea.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 18 }}>
        <FilaModulo
          icono="devices"
          etiqueta={t('security.devicesSessions')}
          descripcion={t('devices.subtitle', { count: String(sessions.length) })}
          insignia={otrasSesiones > 0 ? String(otrasSesiones) : undefined}
          alPresionar={() => nav.navigate('Devices')}
        />
        <FilaModulo icono="place" etiqueta={t('security.limitsGeo')} descripcion={t('security.limitsGeoDesc')} alPresionar={() => nav.navigate('Limits')} ultimo />
      </View>

      <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('security.alertsYouGet')}</Text>
        <View style={{ marginTop: 10 }}>
          {filasAlerta.map((fila) => (
            <View key={fila.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11 }}>
              <Icono name={fila.icon} size={19} color={theme.soft} />
              <Text style={{ flex: 1, fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{fila.label}</Text>
              <Interruptor value={alerts[fila.key]} onChange={() => toggleAlert(fila.key)} />
            </View>
          ))}
        </View>
      </View>

      {panicMode && (
        <View style={{ marginTop: 16, borderRadius: 22, backgroundColor: '#B02B22', padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icono name="gpp_bad" size={21} color="#fff" />
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 15, color: '#fff' }}>{t('security.panicModeActive')}</Text>
          </View>
          <Text style={{ marginTop: 8, fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,.85)' }}>
            {t('security.panicModeActiveDesc')}
          </Text>
          <Pressable onPress={closePanic} style={{ marginTop: 16, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: '#fff' }}>{t('security.deactivatePanic')}</Text>
          </Pressable>
        </View>
      )}

      {!panicMode && (
        <>
          <BotonPeligroContorno label={t('security.activatePanic')} icon="emergency_home" onPress={() => setConfirmarPanico(true)} style={{ marginTop: 16 }} />
          <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fuentes.body, fontSize: 11.5, lineHeight: 16, color: theme.soft }}>
            {t('security.panicHint')}
          </Text>
        </>
      )}

      <HojaInferior visible={confirmarPanico} onClose={() => setConfirmarPanico(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.warnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="emergency_home" size={26} color="#C2352B" />
        </View>
        <Text style={{ marginTop: 16, fontFamily: fuentes.heading, fontSize: 21, letterSpacing: -0.6, color: theme.ink }}>{t('security.confirmPanicTitle')}</Text>
        <Text style={{ marginTop: 9, fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>
          {t('security.confirmPanicBody')}
        </Text>
        <BotonPeligro
          label={t('security.yesBlockAll')}
          onPress={() => {
            openPanic();
            setConfirmarPanico(false);
          }}
          style={{ marginTop: 22 }}
        />
        <BotonFantasma label={t('security.cancel')} onPress={() => setConfirmarPanico(false)} style={{ marginTop: 10 }} />
      </HojaInferior>
    </Pantalla>
  );
}

function FilaModulo({ icono, etiqueta, descripcion, insignia, alPresionar, ultimo }: { icono: string; etiqueta: string; descripcion: string; insignia?: string; alPresionar?: () => void; ultimo?: boolean }) {
  const { theme } = usarTema();
  return (
    <Pressable onPress={alPresionar} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, borderBottomWidth: ultimo ? 0 : 1, borderBottomColor: theme.line }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={icono} size={20} color={theme.gold} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: theme.ink }}>{etiqueta}</Text>
        <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11.5, color: theme.soft }}>{descripcion}</Text>
      </View>
      {insignia ? (
        <View style={{ minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: theme.warnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 11, color: theme.red }}>{insignia}</Text>
        </View>
      ) : null}
      <Icono name="chevron_right" size={18} color={theme.soft} />
    </Pressable>
  );
}
