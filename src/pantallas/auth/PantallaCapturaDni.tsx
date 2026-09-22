import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { fuentes } from '../../tema/estilos';
import { BotonDorado } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { ListaParametrosAuth } from '../../navegacion/tipos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { analizarFrenteDni } from '../../libreria/dniOcr';
import { analizarCodigoBarrasDni } from '../../libreria/dni';
import { dniApi } from '../../libreria/api';
import { usarIdioma } from '../../i18n/ContextoIdioma';

type Fase = 'front' | 'back';
type Estado = 'idle' | 'busy' | 'retry' | 'success';

const UMBRAL_CONSEJOS = 2; // muestra ayuda extra después de este número de intentos fallidos

// Una sola pantalla (y una sola instancia de CameraView) maneja ambos
// lados del DNI. Dos pantallas separadas, cada una montando su propio
// CameraView, hacían que la vista previa de la cámara se pusiera negra al
// navegar de frente → reverso: la sesión de cámara nativa de la primera
// pantalla no se liberaba antes de que la segunda intentara adquirirla.
// Mantener una sola cámara viva y solo cambiar el modo de captura evita
// por completo ese traspaso.
export default function PantallaCapturaDni() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { t } = usarIdioma();
  const { setFotoFrenteDni, setNumeroFrenteDni, setDniEscaneado } = usarEstadoApp();
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [fase, setFase] = useState<Fase>('front');
  const [estado, setEstado] = useState<Estado>('idle');
  const [pista, setPista] = useState<string | null>(null);
  const [mensajeMenorEdad, setMensajeMenorEdad] = useState<string | null>(null);
  const [linterna, setLinterna] = useState(false);
  const [fallosFrente, setFallosFrente] = useState(0);
  const [fallosReverso, setFallosReverso] = useState(0);
  const camaraRef = useRef<CameraView>(null);
  const dniFrenteRef = useRef<string | null>(null);
  const reversoBloqueado = useRef(false);

  // Se descarta todo lo capturado hasta ahora para que un escaneo a medias
  // nunca se filtre a un intento posterior.
  const descartarYVolver = () => {
    setFotoFrenteDni(null);
    setNumeroFrenteDni(null);
    setDniEscaneado(null);
    nav.goBack();
  };

  const capturarFrente = async () => {
    if (estado === 'busy') return;
    setEstado('busy');
    try {
      const foto = await camaraRef.current?.takePictureAsync({ quality: 0.85, base64: true });
      if (!foto?.uri || !foto.base64) {
        setEstado('retry');
        setFallosFrente((n) => n + 1);
        return;
      }

      const analisis = await analizarFrenteDni(foto.uri);
      if (!analisis.dni || analisis.age === null) {
        setEstado('retry');
        setFallosFrente((n) => n + 1);
        return;
      }
      if (analisis.age < 18) {
        setMensajeMenorEdad(t('dniCapture.underageMessage'));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFotoFrenteDni(foto.base64);
      setNumeroFrenteDni(analisis.dni);
      dniFrenteRef.current = analisis.dni;
      setFallosFrente(0);
      setEstado('success');
      setTimeout(() => {
        setEstado('idle');
        setFase('back');
      }, 700);
    } catch {
      setEstado('retry');
      setFallosFrente((n) => n + 1);
    }
  };

  const alEscanearReverso = async (resultado: { data: string }) => {
    if (fase !== 'back' || reversoBloqueado.current) return;
    reversoBloqueado.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const analizado = analizarCodigoBarrasDni(resultado.data);
    console.log('[dniBack] raw barcode:', JSON.stringify(resultado.data));
    console.log('[dniBack] parsed:', analizado, '-> frontDni:', dniFrenteRef.current);

    const rechazarYReintentar = (espera: number) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEstado('retry');
      setPista(t('dniCapture.retry'));
      setFallosReverso((n) => n + 1);
      setTimeout(() => {
        setEstado('idle');
        setPista(null);
        reversoBloqueado.current = false;
      }, espera);
    };

    if (!analizado.dni) {
      rechazarYReintentar(1200);
      return;
    }
    if (dniFrenteRef.current && analizado.dni !== dniFrenteRef.current) {
      rechazarYReintentar(1500);
      return;
    }

    setEstado('busy');
    setFallosReverso(0);
    setPista(t('dniCapture.verifying', { dni: analizado.dni }));
    try {
      const verificado = await dniApi.lookup(analizado.dni);
      setDniEscaneado({
        ...analizado,
        nombres: verificado.nombres,
        apellidoPaterno: verificado.apellidoPaterno,
        apellidoMaterno: verificado.apellidoMaterno,
        fullName: verificado.fullName,
      });
      setPista(`✓ ${verificado.fullName}`);
    } catch {
      setDniEscaneado(analizado);
      setPista(analizado.fullName ? `✓ ${analizado.fullName}` : `✓ ${t('dniCapture.detectedFallback', { dni: analizado.dni })}`);
    }
    setEstado('success');
    setTimeout(() => nav.replace('Register'), 700);
  };

  if (!permiso) return <View style={{ flex: 1, backgroundColor: '#08131F' }} />;

  if (!permiso.granted) {
    return (
      <View style={styles.permWrap}>
        <Icono name="photo_camera" size={44} color="#E7CE92" />
        <Text style={styles.permTitle}>{t('dniCapture.permTitle')}</Text>
        <Text style={styles.permBody}>{t('dniCapture.permBody')}</Text>
        <BotonDorado label={t('dniCapture.givePermission')} onPress={solicitarPermiso} style={{ marginTop: 22, width: '100%' }} />
        <Pressable onPress={() => nav.goBack()} style={{ marginTop: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,.7)', fontFamily: fuentes.bodyMed }}>{t('dniCapture.cancel')}</Text>
        </Pressable>
      </View>
    );
  }

  if (mensajeMenorEdad) {
    return (
      <View style={styles.permWrap}>
        <Icono name="block" size={44} color="#C2352B" />
        <Text style={styles.permTitle}>{t('dniCapture.underageTitle')}</Text>
        <Text style={styles.permBody}>{mensajeMenorEdad}</Text>
        <BotonDorado label={t('dniCapture.understood')} onPress={descartarYVolver} style={{ marginTop: 22, width: '100%' }} />
      </View>
    );
  }

  const colorEsquina = estado === 'success' ? '#21A26B' : '#D9BE7A';
  const anchoEsquina = estado === 'success' ? 7 : 4;

  const pistaFrente =
    estado === 'retry' ? t('dniCapture.retry') :
    estado === 'success' ? t('dniCapture.frontSuccess') :
    t('dniCapture.frontInstructions');
  const pistaReverso = pista ?? t('dniCapture.backInstructions');

  const mostrarConsejos = estado === 'retry' && (fase === 'front' ? fallosFrente >= UMBRAL_CONSEJOS : fallosReverso >= UMBRAL_CONSEJOS);
  const consejos = fase === 'front'
    ? [t('dniCapture.tipFront1'), t('dniCapture.tipFront2'), t('dniCapture.tipFront3'), t('dniCapture.tipFront4')]
    : [t('dniCapture.tipBack1'), t('dniCapture.tipBack2'), t('dniCapture.tipBack3'), t('dniCapture.tipBack4')];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={camaraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={linterna}
        barcodeScannerSettings={{ barcodeTypes: ['pdf417', 'qr', 'code128', 'code39'] }}
        onBarcodeScanned={fase === 'back' ? alEscanearReverso : undefined}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={descartarYVolver} style={styles.closeBtn}>
            <Icono name="close" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setLinterna((v) => !v)} style={[styles.closeBtn, { marginLeft: 0, marginRight: 20 }]}>
            <Icono name={linterna ? 'flash_on' : 'flash_off'} size={20} color={linterna ? '#E7CE92' : '#fff'} />
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.frame}>
            <View style={[styles.corner, { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderColor: colorEsquina, borderWidth: anchoEsquina }]} />
            <View style={[styles.corner, { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderColor: colorEsquina, borderWidth: anchoEsquina }]} />
            <View style={[styles.corner, { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderColor: colorEsquina, borderWidth: anchoEsquina }]} />
            <View style={[styles.corner, { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderColor: colorEsquina, borderWidth: anchoEsquina }]} />
          </View>
          <Text style={styles.hint}>{fase === 'front' ? pistaFrente : pistaReverso}</Text>

          {mostrarConsejos && (
            <View style={styles.tipsBox}>
              {consejos.map((consejo) => (
                <View key={consejo} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
                  <Icono name="lightbulb" size={14} color="#E7CE92" />
                  <Text style={styles.tipText}>{consejo}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {fase === 'front' && (
          <View style={{ paddingHorizontal: 20 }}>
            {estado === 'busy' ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#E7CE92" />
                <Text style={{ color: 'rgba(255,255,255,.7)', fontFamily: fuentes.bodyMed, fontSize: 12 }}>{t('dniCapture.reading')}</Text>
              </View>
            ) : estado === 'success' ? null : (
              <BotonDorado label={estado === 'retry' ? t('dniCapture.retakePhoto') : t('dniCapture.takePhoto')} icon="photo_camera" onPress={capturarFrente} />
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
  hint: { marginTop: 28, textAlign: 'center', color: 'rgba(255,255,255,.85)', fontFamily: fuentes.bodyMed, fontSize: 13, lineHeight: 19, paddingHorizontal: 30 },
  tipsBox: {
    marginTop: 18,
    marginHorizontal: 26,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.14)',
  },
  tipText: { flex: 1, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,.85)' },
  permWrap: { flex: 1, backgroundColor: '#08131F', alignItems: 'center', justifyContent: 'center', padding: 30 },
  permTitle: { marginTop: 18, fontFamily: fuentes.heading, fontSize: 21, color: '#fff' },
  permBody: { marginTop: 10, textAlign: 'center', fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,.65)' },
});
