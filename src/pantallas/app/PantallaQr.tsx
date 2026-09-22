import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { BotonVolver } from '../../componentes/Primitivas';
import CampoTexto from '../../componentes/CampoTexto';
import { BotonDorado, BotonFantasma, BotonPrimario } from '../../componentes/Botones';
import HojaInferior from '../../componentes/HojaInferior';
import Icono from '../../componentes/Icono';
import { fuentes } from '../../tema/estilos';
import { dinero } from '../../libreria/formato';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function PantallaQr() {
  const nav = useNavigation();
  const { t } = usarIdioma();
  const { usuario, disponible, pagarQr, transacciones } = usarEstadoApp();
  const [pestana, setPestana] = useState<'scan' | 'mine'>('scan');
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [listo, setListo] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorGaleria, setErrorGaleria] = useState<string | null>(null);
  const [seleccionandoImagen, setSeleccionandoImagen] = useState(false);
  const bloqueado = useRef(false);

  const pagosQr = transacciones.filter((tx) => tx.category === 'qr').slice(0, 4);

  const alEscanear = (resultado: { data: string }) => {
    if (bloqueado.current) return;
    bloqueado.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEscaneado(resultado.data);
  };

  const elegirDeGaleria = async () => {
    if (seleccionandoImagen) return;
    setSeleccionandoImagen(true);
    setErrorGaleria(null);
    try {
      const permisoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permisoGaleria.granted) {
        setErrorGaleria(t('qr.galleryPermissionDenied'));
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (resultado.canceled || !resultado.assets?.[0]) return;
      const codigos = await scanFromURLAsync(resultado.assets[0].uri, ['qr']);
      if (codigos.length > 0 && codigos[0].data) {
        alEscanear({ data: codigos[0].data });
      } else {
        setErrorGaleria(t('qr.noQrFound'));
      }
    } catch {
      setErrorGaleria(t('qr.noQrFound'));
    } finally {
      setSeleccionandoImagen(false);
    }
  };

  const cerrarHoja = () => {
    setEscaneado(null);
    setMonto('');
    setListo(false);
    setError(null);
    setErrorGaleria(null);
    bloqueado.current = false;
  };

  const nombreComercio = escaneado ? (escaneado.length > 24 ? t('qr.merchant') : escaneado.replace(/^https?:\/\//, '').slice(0, 24)) : '';
  const montoNum = Number(monto.replace(',', '.')) || 0;

  const enviar = async () => {
    if (pagando) return;
    setPagando(true);
    setError(null);
    const resultado = await pagarQr(nombreComercio || t('qr.merchant'), montoNum);
    setPagando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setListo(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F1A26' }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 22 }}>
        <View style={{ marginTop: 4 }}>
          <BotonVolver oscuro onPress={() => nav.goBack()} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, padding: 4, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }}>
          <Pressable onPress={() => setPestana('scan')} style={{ flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: pestana === 'scan' ? '#fff' : 'transparent' }}>
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13, color: pestana === 'scan' ? '#0F1A26' : 'rgba(255,255,255,.7)' }}>{t('qr.tabScan')}</Text>
          </Pressable>
          <Pressable onPress={() => setPestana('mine')} style={{ flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: pestana === 'mine' ? '#fff' : 'transparent' }}>
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13, color: pestana === 'mine' ? '#0F1A26' : 'rgba(255,255,255,.7)' }}>{t('qr.tabMine')}</Text>
          </Pressable>
        </View>

        {pestana === 'scan' ? (
          <View style={{ marginTop: 28, height: 300, borderRadius: 26, overflow: 'hidden', backgroundColor: '#08131F' }}>
            {permiso?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={alEscanear}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Icono name="qr_code_2" size={56} color="rgba(255,255,255,.3)" />
                <Text style={{ marginTop: 14, textAlign: 'center', fontFamily: fuentes.bodyMed, fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>
                  {t('qr.enableCamera')}
                </Text>
                <BotonDorado label={t('qr.enableCameraButton')} onPress={solicitarPermiso} style={{ marginTop: 16 }} />
              </View>
            )}
            {permiso?.granted && (
              <View pointerEvents="none" style={estilos.frameWrap}>
                <View style={estilos.frame} />
                <Text style={estilos.pista}>{t('qr.pointAtQr')}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 28, alignItems: 'center', backgroundColor: '#111E2B', borderRadius: 26, padding: 26 }}>
            <View style={{ padding: 14, backgroundColor: '#fff', borderRadius: 18 }}>
              <QRCode value={`NOVABANK|${usuario.accountNumber}|${usuario.name}`} size={190} color="#0F1A26" backgroundColor="#fff" />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fuentes.headingBold, fontSize: 15, color: '#fff' }}>{usuario.name}</Text>
            <Text style={{ marginTop: 4, fontFamily: fuentes.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('qr.account', { account: usuario.accountNumber })}</Text>
            <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fuentes.body, fontSize: 11.5, lineHeight: 16, color: 'rgba(255,255,255,.45)' }}>
              {t('qr.anyoneCanScan')}
            </Text>
          </View>
        )}

        {pestana === 'scan' && (
          <View style={{ marginTop: 22, flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={elegirDeGaleria}
              disabled={seleccionandoImagen}
              style={{ flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: seleccionandoImagen ? 0.6 : 1 }}
            >
              <Icono name="photo_library" size={18} color="#fff" />
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13, color: '#fff' }}>{t('qr.fromGallery')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setEscaneado('MANUAL')}
              style={{ flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icono name="dialpad" size={18} color="#fff" />
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13, color: '#fff' }}>{t('qr.manualCode')}</Text>
            </Pressable>
          </View>
        )}

        {pestana === 'scan' && errorGaleria ? (
          <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fuentes.bodyMed, fontSize: 12, color: '#FF8C7A' }}>{errorGaleria}</Text>
        ) : null}

        <Text style={{ marginTop: 26, fontFamily: fuentes.headingBold, fontSize: 14, color: '#fff' }}>{t('qr.recentQrPayments')}</Text>
        <View style={{ marginTop: 12, gap: 13 }}>
          {pagosQr.map((tx) => (
            <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Icono name={tx.icon} size={19} color="#FFB07A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: '#fff' }}>{tx.name}</Text>
                <Text style={{ fontFamily: fuentes.body, fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{tx.daysAgo === 0 ? t('qr.today') : t('qr.daysAgo', { n: tx.daysAgo })}</Text>
              </View>
              <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: '#FF8C7A' }}>−{dinero(tx.amount)}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      <HojaInferior visible={!!escaneado} onClose={cerrarHoja}>
        {escaneado && !listo ? (
          <View>
            <Text style={{ fontFamily: fuentes.heading, fontSize: 20, letterSpacing: -0.5 }}>{t('qr.payWithQr')}</Text>
            <Text style={{ marginTop: 6, fontFamily: fuentes.body, fontSize: 12.5, color: '#5F6B78' }}>
              {escaneado !== 'MANUAL' ? t('qr.codeReadFrom', { merchant: nombreComercio }) : t('qr.codeReadManually')}
            </Text>
            <View style={{ marginTop: 16 }}>
              <CampoTexto label={t('qr.amountToPay')} icon="payments" keyboardType="decimal-pad" value={monto} onChangeText={(v) => setMonto(v.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
            </View>
            <Text style={{ marginTop: 6, fontFamily: fuentes.bodyMed, fontSize: 11.5, color: montoNum > disponible ? '#C2352B' : '#5F6B78' }}>
              {montoNum > disponible ? t('qr.insufficientBalance') : t('qr.availableAmount', { amount: dinero(disponible) })}
            </Text>
            {error ? (
              <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
            ) : null}
            <BotonPrimario
              label={pagando ? t('qr.paying') : t('qr.confirmPayment')}
              disabled={montoNum <= 0 || montoNum > disponible || pagando}
              onPress={enviar}
              style={{ marginTop: 18 }}
            />
            <BotonFantasma label={t('qr.cancel')} onPress={cerrarHoja} style={{ marginTop: 10 }} />
          </View>
        ) : listo ? (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#EAF9F1', alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="check" size={36} color="#21A26B" />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fuentes.heading, fontSize: 19 }}>{t('qr.paymentDone')}</Text>
            <Text style={{ marginTop: 6, fontFamily: fuentes.body, fontSize: 12.5, color: '#5F6B78' }}>{t('qr.amountSent', { amount: dinero(montoNum) })}</Text>
            <BotonPrimario label={t('qr.done')} onPress={cerrarHoja} style={{ marginTop: 18, width: '100%' }} />
          </View>
        ) : null}
      </HojaInferior>
    </View>
  );
}

const estilos = StyleSheet.create({
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 190, height: 190, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,.5)' },
  pista: { position: 'absolute', bottom: 18, fontFamily: fuentes.body, fontSize: 12.5, color: 'rgba(255,255,255,.7)' },
});
