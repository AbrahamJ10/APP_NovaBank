import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Icono from '../../componentes/Icono';
import { BotonDorado, BotonFantasma } from '../../componentes/Botones';
import { fuentes } from '../../tema/estilos';
import { ListaParametrosAuth } from '../../navegacion/tipos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { mensajeFalloRostro, ejecutarChequeoRostro } from '../../libreria/deteccionRostro';
import { ApiError, verificationApi } from '../../libreria/api';
import { usarIdioma } from '../../i18n/ContextoIdioma';

type Etapa = 'idle' | 'scanning' | 'checking' | 'ok' | 'otpFailed' | 'fail';

const ANILLO = 178;

export default function PantallaRegistroRostro() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { t } = usarIdioma();
  const { usuarioPendiente, fotoFrenteDni, setSelfiePendiente } = usarEstadoApp();
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [etapa, setEtapa] = useState<Etapa>('idle');
  const [mensajeFalla, setMensajeFalla] = useState('');
  const camaraRef = useRef<CameraView>(null);
  const escaneoY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (etapa !== 'scanning') return;
    escaneoY.setValue(0);
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(escaneoY, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(escaneoY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    bucle.start();
    const temporizador = setTimeout(capturar, 1600);
    return () => {
      bucle.stop();
      clearTimeout(temporizador);
    };
  }, [etapa]);

  const iniciarEscaneo = async () => {
    if (!permiso?.granted) {
      const res = await solicitarPermiso();
      if (!res.granted) return;
    }
    setEtapa('scanning');
  };

  const capturar = async () => {
    try {
      const foto = await camaraRef.current?.takePictureAsync({ quality: 0.6, base64: true, skipProcessing: true });
      setEtapa('checking');
      if (!foto?.uri || !foto.base64) {
        setMensajeFalla(t('registerFace.failCapture'));
        setEtapa('fail');
        return;
      }

      const pruebaVida = await ejecutarChequeoRostro(foto.uri);
      console.log('[registerFace] liveness:', pruebaVida);
      if (!pruebaVida.ok) {
        setMensajeFalla(mensajeFalloRostro(pruebaVida.reason, t));
        setEtapa('fail');
        return;
      }

      if (!fotoFrenteDni || !usuarioPendiente?.dni) {
        setMensajeFalla(t('registerFace.failNoPhoto'));
        setEtapa('fail');
        return;
      }

      const resultado = await verificationApi.faceMatch({ dni: usuarioPendiente.dni, selfie: foto.base64, dniPhoto: fotoFrenteDni });
      if (!resultado.matched) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setMensajeFalla(t('registerFace.failNoMatch'));
        setEtapa('fail');
        return;
      }

      // Se guarda la selfie ahora para poder enviarla junto con la llamada
      // final a register() y guardarla como foto de referencia de Face ID.
      setSelfiePendiente(foto.base64);

      // El rostro ya está verificado en este punto — una falla enviando el
      // correo con el OTP después es un problema aparte y no debe mostrarse
      // como "no pudimos verificarte".
      await enviarOtp();
    } catch (error) {
      setMensajeFalla(error instanceof ApiError ? error.message : t('registerFace.failGeneric'));
      setEtapa('fail');
    }
  };

  const enviarOtp = async () => {
    if (!usuarioPendiente) return;
    try {
      await verificationApi.requestRegisterOtp(usuarioPendiente.email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setEtapa('ok');
    } catch (error) {
      setMensajeFalla(error instanceof ApiError ? error.message : t('registerFace.failGeneric'));
      setEtapa('otpFailed');
    }
  };

  const trasladoY = escaneoY.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });

  const titulo =
    etapa === 'idle' ? t('registerFace.title') :
    etapa === 'scanning' ? t('registerFace.titleScanning') :
    etapa === 'checking' ? t('registerFace.titleChecking') :
    etapa === 'ok' ? t('registerFace.titleOk') :
    etapa === 'otpFailed' ? t('registerFace.titleOtpFailed') :
    t('registerFace.titleFail');
  const descripcion =
    etapa === 'idle'
      ? t('registerFace.descIdle')
      : etapa === 'scanning'
      ? t('registerFace.descScanning')
      : etapa === 'checking'
      ? t('registerFace.descChecking')
      : etapa === 'ok'
      ? t('registerFace.descOk')
      : mensajeFalla;

  return (
    <View style={{ flex: 1, backgroundColor: '#08131F' }}>
      <LinearGradient colors={['#122438', '#08131F']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 26, paddingTop: 10, paddingBottom: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Icono name="close" size={20} color="#fff" />
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[styles.ring, (etapa === 'ok' || etapa === 'otpFailed') && { borderColor: 'rgba(123,224,168,.5)' }, etapa === 'fail' && { borderColor: 'rgba(194,53,43,.5)' }]}>
            {etapa === 'scanning' || etapa === 'checking' ? (
              <View style={styles.cameraClip}>
                <CameraView ref={camaraRef} style={StyleSheet.absoluteFill} facing="front" />
                {etapa === 'scanning' && <Animated.View style={[styles.scanLine, { transform: [{ translateY: trasladoY }] }]} />}
                {etapa === 'checking' && (
                  <View style={styles.checkingOverlay}>
                    <ActivityIndicator color="#E7CE92" size="large" />
                  </View>
                )}
              </View>
            ) : (
              <Icono name="face" size={96} color={etapa === 'ok' || etapa === 'otpFailed' ? '#7BE0A8' : etapa === 'fail' ? '#C2352B' : 'rgba(255,255,255,.55)'} />
            )}

            {(etapa === 'ok' || etapa === 'otpFailed') && (
              <View style={[styles.badge, { backgroundColor: '#21A26B' }]}>
                <Icono name="check" size={30} color="#fff" />
              </View>
            )}
            {etapa === 'fail' && (
              <View style={[styles.badge, { backgroundColor: '#C2352B' }]}>
                <Icono name="close" size={30} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.desc}>{descripcion}</Text>
        </View>

        <View style={{ gap: 11 }}>
          {etapa === 'idle' && <BotonDorado label={t('registerFace.scanButton')} icon="face" onPress={iniciarEscaneo} />}
          {(etapa === 'scanning' || etapa === 'checking') && (
            <BotonFantasma label={t('registerFace.cancel')} onPress={() => setEtapa('idle')} colorTexto="#fff" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,.28)' }} />
          )}
          {etapa === 'ok' && (
            <BotonDorado label={t('registerFace.continueButton')} icon="arrow_forward" onPress={() => nav.replace('Otp')} />
          )}
          {etapa === 'otpFailed' && (
            <BotonDorado label={t('registerFace.retrySendEmail')} icon="refresh" onPress={enviarOtp} />
          )}
          {etapa === 'fail' && (
            <>
              <BotonDorado label={t('registerFace.retryButton')} onPress={() => setEtapa('idle')} />
              <BotonFantasma
                label={t('registerFace.rescanDni')}
                onPress={() => nav.goBack()}
                colorTexto="#fff"
                style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,.3)' }}
              />
            </>
          )}
          <Text style={styles.footer}>{t('registerFace.footer')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  closeBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: ANILLO,
    height: ANILLO,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraClip: { width: ANILLO - 3, height: ANILLO - 3, borderRadius: 58, overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 14, right: 14, top: '46%', height: 2, backgroundColor: '#D9BE7A', shadowColor: '#C9A227', shadowOpacity: 1, shadowRadius: 8 },
  checkingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,17,26,.35)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -6, bottom: -6, width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: '#08131F', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 34, fontFamily: fuentes.heading, fontSize: 24, color: '#fff', letterSpacing: -0.7, textAlign: 'center' },
  desc: { marginTop: 10, fontFamily: fuentes.body, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,.62)', textAlign: 'center', maxWidth: 280 },
  footer: { textAlign: 'center', fontFamily: fuentes.body, fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 },
});
