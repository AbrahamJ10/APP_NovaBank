import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { fonts } from '../../theme/tokens';
import { GoldButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { analyzeDniFront } from '../../lib/dniOcr';
import { parseDniBarcode } from '../../lib/dni';
import { dniApi } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

type Phase = 'front' | 'back';
type Status = 'idle' | 'busy' | 'retry' | 'success';

const TIPS_THRESHOLD = 2; // muestra ayuda extra después de este número de intentos fallidos

// Una sola pantalla (y una sola instancia de CameraView) maneja ambos
// lados del DNI. Dos pantallas separadas, cada una montando su propio
// CameraView, hacían que la vista previa de la cámara se pusiera negra al
// navegar de frente → reverso: la sesión de cámara nativa de la primera
// pantalla no se liberaba antes de que la segunda intentara adquirirla.
// Mantener una sola cámara viva y solo cambiar el modo de captura evita
// por completo ese traspaso.
export default function DniCaptureScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { t } = useLanguage();
  const { setDniFrontPhoto, setFrontDniNumber, setScannedDni } = useAppState();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('front');
  const [status, setStatus] = useState<Status>('idle');
  const [hint, setHint] = useState<string | null>(null);
  const [underageMessage, setUnderageMessage] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [frontFails, setFrontFails] = useState(0);
  const [backFails, setBackFails] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const frontDniRef = useRef<string | null>(null);
  const backLocked = useRef(false);

  // Se descarta todo lo capturado hasta ahora para que un escaneo a medias
  // nunca se filtre a un intento posterior.
  const discardAndGoBack = () => {
    setDniFrontPhoto(null);
    setFrontDniNumber(null);
    setScannedDni(null);
    nav.goBack();
  };

  const captureFront = async () => {
    if (status === 'busy') return;
    setStatus('busy');
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85, base64: true });
      if (!photo?.uri || !photo.base64) {
        setStatus('retry');
        setFrontFails((n) => n + 1);
        return;
      }

      const analysis = await analyzeDniFront(photo.uri);
      if (!analysis.dni || analysis.age === null) {
        setStatus('retry');
        setFrontFails((n) => n + 1);
        return;
      }
      if (analysis.age < 18) {
        setUnderageMessage(t('dniCapture.underageMessage'));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDniFrontPhoto(photo.base64);
      setFrontDniNumber(analysis.dni);
      frontDniRef.current = analysis.dni;
      setFrontFails(0);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setPhase('back');
      }, 700);
    } catch {
      setStatus('retry');
      setFrontFails((n) => n + 1);
    }
  };

  const onScannedBack = async (result: { data: string }) => {
    if (phase !== 'back' || backLocked.current) return;
    backLocked.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const parsed = parseDniBarcode(result.data);
    console.log('[dniBack] raw barcode:', JSON.stringify(result.data));
    console.log('[dniBack] parsed:', parsed, '-> frontDni:', frontDniRef.current);

    const rejectAndRetry = (delay: number) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setStatus('retry');
      setHint(t('dniCapture.retry'));
      setBackFails((n) => n + 1);
      setTimeout(() => {
        setStatus('idle');
        setHint(null);
        backLocked.current = false;
      }, delay);
    };

    if (!parsed.dni) {
      rejectAndRetry(1200);
      return;
    }
    if (frontDniRef.current && parsed.dni !== frontDniRef.current) {
      rejectAndRetry(1500);
      return;
    }

    setStatus('busy');
    setBackFails(0);
    setHint(t('dniCapture.verifying', { dni: parsed.dni }));
    try {
      const verified = await dniApi.lookup(parsed.dni);
      setScannedDni({
        ...parsed,
        nombres: verified.nombres,
        apellidoPaterno: verified.apellidoPaterno,
        apellidoMaterno: verified.apellidoMaterno,
        fullName: verified.fullName,
      });
      setHint(`✓ ${verified.fullName}`);
    } catch {
      setScannedDni(parsed);
      setHint(parsed.fullName ? `✓ ${parsed.fullName}` : `✓ ${t('dniCapture.detectedFallback', { dni: parsed.dni })}`);
    }
    setStatus('success');
    setTimeout(() => nav.replace('Register'), 700);
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#08131F' }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permWrap}>
        <Icon name="photo_camera" size={44} color="#E7CE92" />
        <Text style={styles.permTitle}>{t('dniCapture.permTitle')}</Text>
        <Text style={styles.permBody}>{t('dniCapture.permBody')}</Text>
        <GoldButton label={t('dniCapture.givePermission')} onPress={requestPermission} style={{ marginTop: 22, width: '100%' }} />
        <Pressable onPress={() => nav.goBack()} style={{ marginTop: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,.7)', fontFamily: fonts.bodyMed }}>{t('dniCapture.cancel')}</Text>
        </Pressable>
      </View>
    );
  }

  if (underageMessage) {
    return (
      <View style={styles.permWrap}>
        <Icon name="block" size={44} color="#C2352B" />
        <Text style={styles.permTitle}>{t('dniCapture.underageTitle')}</Text>
        <Text style={styles.permBody}>{underageMessage}</Text>
        <GoldButton label={t('dniCapture.understood')} onPress={discardAndGoBack} style={{ marginTop: 22, width: '100%' }} />
      </View>
    );
  }

  const cornerColor = status === 'success' ? '#21A26B' : '#D9BE7A';
  const cornerWidth = status === 'success' ? 7 : 4;

  const frontHint =
    status === 'retry' ? t('dniCapture.retry') :
    status === 'success' ? t('dniCapture.frontSuccess') :
    t('dniCapture.frontInstructions');
  const backHint = hint ?? t('dniCapture.backInstructions');

  const showTips = status === 'retry' && (phase === 'front' ? frontFails >= TIPS_THRESHOLD : backFails >= TIPS_THRESHOLD);
  const tips = phase === 'front'
    ? [t('dniCapture.tipFront1'), t('dniCapture.tipFront2'), t('dniCapture.tipFront3'), t('dniCapture.tipFront4')]
    : [t('dniCapture.tipBack1'), t('dniCapture.tipBack2'), t('dniCapture.tipBack3'), t('dniCapture.tipBack4')];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['pdf417', 'qr', 'code128', 'code39'] }}
        onBarcodeScanned={phase === 'back' ? onScannedBack : undefined}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={discardAndGoBack} style={styles.closeBtn}>
            <Icon name="close" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setTorch((t) => !t)} style={[styles.closeBtn, { marginLeft: 0, marginRight: 20 }]}>
            <Icon name={torch ? 'flash_on' : 'flash_off'} size={20} color={torch ? '#E7CE92' : '#fff'} />
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.frame}>
            <View style={[styles.corner, { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderColor: cornerColor, borderWidth: cornerWidth }]} />
            <View style={[styles.corner, { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderColor: cornerColor, borderWidth: cornerWidth }]} />
            <View style={[styles.corner, { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderColor: cornerColor, borderWidth: cornerWidth }]} />
            <View style={[styles.corner, { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderColor: cornerColor, borderWidth: cornerWidth }]} />
          </View>
          <Text style={styles.hint}>{phase === 'front' ? frontHint : backHint}</Text>

          {showTips && (
            <View style={styles.tipsBox}>
              {tips.map((tip) => (
                <View key={tip} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
                  <Icon name="lightbulb" size={14} color="#E7CE92" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {phase === 'front' && (
          <View style={{ paddingHorizontal: 20 }}>
            {status === 'busy' ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#E7CE92" />
                <Text style={{ color: 'rgba(255,255,255,.7)', fontFamily: fonts.bodyMed, fontSize: 12 }}>{t('dniCapture.reading')}</Text>
              </View>
            ) : status === 'success' ? null : (
              <GoldButton label={status === 'retry' ? t('dniCapture.retakePhoto') : t('dniCapture.takePhoto')} icon="photo_camera" onPress={captureFront} />
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  closeBtn: {
    marginLeft: 20,
    marginTop: 8,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { width: 300, height: 190, borderRadius: 4 },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#D9BE7A', borderWidth: 4, borderRadius: 4 },
  hint: { marginTop: 28, textAlign: 'center', color: 'rgba(255,255,255,.85)', fontFamily: fonts.bodyMed, fontSize: 13, lineHeight: 19, paddingHorizontal: 30 },
  tipsBox: {
    marginTop: 18,
    marginHorizontal: 26,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.14)',
  },
  tipText: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,.85)' },
  permWrap: { flex: 1, backgroundColor: '#08131F', alignItems: 'center', justifyContent: 'center', padding: 30 },
  permTitle: { marginTop: 18, fontFamily: fonts.heading, fontSize: 21, color: '#fff' },
  permBody: { marginTop: 10, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,.65)' },
});
