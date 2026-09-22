import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { BackButton } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { GoldButton, GhostButton, PrimaryButton } from '../../components/Buttons';
import BottomSheet from '../../components/BottomSheet';
import Icon from '../../components/Icon';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function QrScreen() {
  const nav = useNavigation();
  const { t } = useLanguage();
  const { user, available, payQr, transactions } = useAppState();
  const [tab, setTab] = useState<'scan' | 'mine'>('scan');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);
  const locked = useRef(false);

  const qrPayments = transactions.filter((tx) => tx.category === 'qr').slice(0, 4);

  const onScanned = (result: { data: string }) => {
    if (locked.current) return;
    locked.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setScanned(result.data);
  };

  const pickFromGallery = async () => {
    if (pickingImage) return;
    setPickingImage(true);
    setGalleryError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setGalleryError(t('qr.galleryPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled || !result.assets?.[0]) return;
      const codes = await scanFromURLAsync(result.assets[0].uri, ['qr']);
      if (codes.length > 0 && codes[0].data) {
        onScanned({ data: codes[0].data });
      } else {
        setGalleryError(t('qr.noQrFound'));
      }
    } catch {
      setGalleryError(t('qr.noQrFound'));
    } finally {
      setPickingImage(false);
    }
  };

  const closeSheet = () => {
    setScanned(null);
    setAmount('');
    setDone(false);
    setError(null);
    setGalleryError(null);
    locked.current = false;
  };

  const merchantName = scanned ? (scanned.length > 24 ? t('qr.merchant') : scanned.replace(/^https?:\/\//, '').slice(0, 24)) : '';
  const amountNum = Number(amount.replace(',', '.')) || 0;

  const submit = async () => {
    if (paying) return;
    setPaying(true);
    setError(null);
    const result = await payQr(merchantName || t('qr.merchant'), amountNum);
    setPaying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F1A26' }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 22 }}>
        <View style={{ marginTop: 4 }}>
          <BackButton dark onPress={() => nav.goBack()} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, padding: 4, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }}>
          <Pressable onPress={() => setTab('scan')} style={{ flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === 'scan' ? '#fff' : 'transparent' }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: tab === 'scan' ? '#0F1A26' : 'rgba(255,255,255,.7)' }}>{t('qr.tabScan')}</Text>
          </Pressable>
          <Pressable onPress={() => setTab('mine')} style={{ flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === 'mine' ? '#fff' : 'transparent' }}>
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: tab === 'mine' ? '#0F1A26' : 'rgba(255,255,255,.7)' }}>{t('qr.tabMine')}</Text>
          </Pressable>
        </View>

        {tab === 'scan' ? (
          <View style={{ marginTop: 28, height: 300, borderRadius: 26, overflow: 'hidden', backgroundColor: '#08131F' }}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScanned}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Icon name="qr_code_2" size={56} color="rgba(255,255,255,.3)" />
                <Text style={{ marginTop: 14, textAlign: 'center', fontFamily: fonts.bodyMed, fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>
                  {t('qr.enableCamera')}
                </Text>
                <GoldButton label={t('qr.enableCameraButton')} onPress={requestPermission} style={{ marginTop: 16 }} />
              </View>
            )}
            {permission?.granted && (
              <View pointerEvents="none" style={styles.frameWrap}>
                <View style={styles.frame} />
                <Text style={styles.hint}>{t('qr.pointAtQr')}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 28, alignItems: 'center', backgroundColor: '#111E2B', borderRadius: 26, padding: 26 }}>
            <View style={{ padding: 14, backgroundColor: '#fff', borderRadius: 18 }}>
              <QRCode value={`NOVABANK|${user.accountNumber}|${user.name}`} size={190} color="#0F1A26" backgroundColor="#fff" />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fonts.headingBold, fontSize: 15, color: '#fff' }}>{user.name}</Text>
            <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('qr.account', { account: user.accountNumber })}</Text>
            <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: 'rgba(255,255,255,.45)' }}>
              {t('qr.anyoneCanScan')}
            </Text>
          </View>
        )}

        {tab === 'scan' && (
          <View style={{ marginTop: 22, flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={pickFromGallery}
              disabled={pickingImage}
              style={{ flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pickingImage ? 0.6 : 1 }}
            >
              <Icon name="photo_library" size={18} color="#fff" />
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: '#fff' }}>{t('qr.fromGallery')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setScanned('MANUAL')}
              style={{ flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="dialpad" size={18} color="#fff" />
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: '#fff' }}>{t('qr.manualCode')}</Text>
            </Pressable>
          </View>
        )}

        {tab === 'scan' && galleryError ? (
          <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fonts.bodyMed, fontSize: 12, color: '#FF8C7A' }}>{galleryError}</Text>
        ) : null}

        <Text style={{ marginTop: 26, fontFamily: fonts.headingBold, fontSize: 14, color: '#fff' }}>{t('qr.recentQrPayments')}</Text>
        <View style={{ marginTop: 12, gap: 13 }}>
          {qrPayments.map((tx) => (
            <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={tx.icon} size={19} color="#FFB07A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' }}>{tx.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{tx.daysAgo === 0 ? t('qr.today') : t('qr.daysAgo', { n: tx.daysAgo })}</Text>
              </View>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: '#FF8C7A' }}>−{money(tx.amount)}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      <BottomSheet visible={!!scanned} onClose={closeSheet}>
        {scanned && !done ? (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5 }}>{t('qr.payWithQr')}</Text>
            <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 12.5, color: '#5F6B78' }}>
              {scanned !== 'MANUAL' ? t('qr.codeReadFrom', { merchant: merchantName }) : t('qr.codeReadManually')}
            </Text>
            <View style={{ marginTop: 16 }}>
              <TextField label={t('qr.amountToPay')} icon="payments" keyboardType="decimal-pad" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
            </View>
            <Text style={{ marginTop: 6, fontFamily: fonts.bodyMed, fontSize: 11.5, color: amountNum > available ? '#C2352B' : '#5F6B78' }}>
              {amountNum > available ? t('qr.insufficientBalance') : t('qr.availableAmount', { amount: money(available) })}
            </Text>
            {error ? (
              <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
            ) : null}
            <PrimaryButton
              label={paying ? t('qr.paying') : t('qr.confirmPayment')}
              disabled={amountNum <= 0 || amountNum > available || paying}
              onPress={submit}
              style={{ marginTop: 18 }}
            />
            <GhostButton label={t('qr.cancel')} onPress={closeSheet} style={{ marginTop: 10 }} />
          </View>
        ) : done ? (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#EAF9F1', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={36} color="#21A26B" />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 19 }}>{t('qr.paymentDone')}</Text>
            <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 12.5, color: '#5F6B78' }}>{t('qr.amountSent', { amount: money(amountNum) })}</Text>
            <PrimaryButton label={t('qr.done')} onPress={closeSheet} style={{ marginTop: 18, width: '100%' }} />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 190, height: 190, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,.5)' },
  hint: { position: 'absolute', bottom: 18, fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,.7)' },
});
