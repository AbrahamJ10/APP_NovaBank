import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Icon from '../../components/Icon';
import { GoldButton, GhostButton } from '../../components/Buttons';
import { fonts } from '../../theme/tokens';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { faceFailMessage, runFaceCheck } from '../../lib/faceDetect';
import { ApiError, verificationApi } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

type Stage = 'idle' | 'scanning' | 'checking' | 'ok' | 'otpFailed' | 'fail';

const RING = 178;

export default function RegisterFaceScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { t } = useLanguage();
  const { pendingUser, dniFrontPhoto, setPendingSelfie } = useAppState();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>('idle');
  const [failMsg, setFailMsg] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage !== 'scanning') return;
    scanY.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    const timer = setTimeout(capture, 1600);
    return () => {
      loop.stop();
      clearTimeout(timer);
    };
  }, [stage]);

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setStage('scanning');
  };

  const capture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6, base64: true, skipProcessing: true });
      setStage('checking');
      if (!photo?.uri || !photo.base64) {
        setFailMsg(t('registerFace.failCapture'));
        setStage('fail');
        return;
      }

      const liveness = await runFaceCheck(photo.uri);
      console.log('[registerFace] liveness:', liveness);
      if (!liveness.ok) {
        setFailMsg(faceFailMessage(liveness.reason, t));
        setStage('fail');
        return;
      }

      if (!dniFrontPhoto || !pendingUser?.dni) {
        setFailMsg(t('registerFace.failNoPhoto'));
        setStage('fail');
        return;
      }

      const result = await verificationApi.faceMatch({ dni: pendingUser.dni, selfie: photo.base64, dniPhoto: dniFrontPhoto });
      if (!result.matched) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setFailMsg(t('registerFace.failNoMatch'));
        setStage('fail');
        return;
      }

      // Se guarda la selfie ahora para poder enviarla junto con la llamada
      // final a register() y guardarla como foto de referencia de Face ID.
      setPendingSelfie(photo.base64);

      // El rostro ya está verificado en este punto — una falla enviando el
      // correo con el OTP después es un problema aparte y no debe mostrarse
      // como "no pudimos verificarte".
      await sendOtp();
    } catch (err) {
      setFailMsg(err instanceof ApiError ? err.message : t('registerFace.failGeneric'));
      setStage('fail');
    }
  };

  const sendOtp = async () => {
    if (!pendingUser) return;
    try {
      await verificationApi.requestRegisterOtp(pendingUser.email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStage('ok');
    } catch (err) {
      setFailMsg(err instanceof ApiError ? err.message : t('registerFace.failGeneric'));
      setStage('otpFailed');
    }
  };

  const translateY = scanY.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });

  const title =
    stage === 'idle' ? t('registerFace.title') :
    stage === 'scanning' ? t('registerFace.titleScanning') :
    stage === 'checking' ? t('registerFace.titleChecking') :
    stage === 'ok' ? t('registerFace.titleOk') :
    stage === 'otpFailed' ? t('registerFace.titleOtpFailed') :
    t('registerFace.titleFail');
  const desc =
    stage === 'idle'
      ? t('registerFace.descIdle')
      : stage === 'scanning'
      ? t('registerFace.descScanning')
      : stage === 'checking'
      ? t('registerFace.descChecking')
      : stage === 'ok'
      ? t('registerFace.descOk')
      : failMsg;

  return (
    <View style={{ flex: 1, backgroundColor: '#08131F' }}>
      <LinearGradient colors={['#122438', '#08131F']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 26, paddingTop: 10, paddingBottom: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={20} color="#fff" />
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[styles.ring, (stage === 'ok' || stage === 'otpFailed') && { borderColor: 'rgba(123,224,168,.5)' }, stage === 'fail' && { borderColor: 'rgba(194,53,43,.5)' }]}>
            {stage === 'scanning' || stage === 'checking' ? (
              <View style={styles.cameraClip}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
                {stage === 'scanning' && <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />}
                {stage === 'checking' && (
                  <View style={styles.checkingOverlay}>
                    <ActivityIndicator color="#E7CE92" size="large" />
                  </View>
                )}
              </View>
            ) : (
              <Icon name="face" size={96} color={stage === 'ok' || stage === 'otpFailed' ? '#7BE0A8' : stage === 'fail' ? '#C2352B' : 'rgba(255,255,255,.55)'} />
            )}

            {(stage === 'ok' || stage === 'otpFailed') && (
              <View style={[styles.badge, { backgroundColor: '#21A26B' }]}>
                <Icon name="check" size={30} color="#fff" />
              </View>
            )}
            {stage === 'fail' && (
              <View style={[styles.badge, { backgroundColor: '#C2352B' }]}>
                <Icon name="close" size={30} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{desc}</Text>
        </View>

        <View style={{ gap: 11 }}>
          {stage === 'idle' && <GoldButton label={t('registerFace.scanButton')} icon="face" onPress={startScan} />}
          {(stage === 'scanning' || stage === 'checking') && (
            <GhostButton label={t('registerFace.cancel')} onPress={() => setStage('idle')} textColor="#fff" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,.28)' }} />
          )}
          {stage === 'ok' && (
            <GoldButton label={t('registerFace.continueButton')} icon="arrow_forward" onPress={() => nav.replace('Otp')} />
          )}
          {stage === 'otpFailed' && (
            <GoldButton label={t('registerFace.retrySendEmail')} icon="refresh" onPress={sendOtp} />
          )}
          {stage === 'fail' && (
            <>
              <GoldButton label={t('registerFace.retryButton')} onPress={() => setStage('idle')} />
              <GhostButton
                label={t('registerFace.rescanDni')}
                onPress={() => nav.goBack()}
                textColor="#fff"
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
    width: RING,
    height: RING,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraClip: { width: RING - 3, height: RING - 3, borderRadius: 58, overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 14, right: 14, top: '46%', height: 2, backgroundColor: '#D9BE7A', shadowColor: '#C9A227', shadowOpacity: 1, shadowRadius: 8 },
  checkingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,17,26,.35)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -6, bottom: -6, width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: '#08131F', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 34, fontFamily: fonts.heading, fontSize: 24, color: '#fff', letterSpacing: -0.7, textAlign: 'center' },
  desc: { marginTop: 10, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,.62)', textAlign: 'center', maxWidth: 280 },
  footer: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 },
});
