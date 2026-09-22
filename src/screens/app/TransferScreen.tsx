import React, { useRef, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, OtpBoxes, Row, ScreenTitle } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/Logo';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money, mmss } from '../../lib/format';
import { useAppState, TransferReceipt } from '../../state/AppStateContext';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

type Nav = CompositeNavigationProp<NativeStackNavigationProp<RootStackParamList>, BottomTabNavigationProp<TabParamList>>;
type Step = 'form' | 'otp' | 'done' | 'error';

export default function TransferScreen() {
  const nav = useNavigation<Nav>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { payees, available, requestTransferOtp, executeTransfer, addPayee, otpLeft } = useAppState();

  const [step, setStep] = useState<Step>('form');
  const [addingPayee, setAddingPayee] = useState(false);
  const [savingPayee, setSavingPayee] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCci, setNewCci] = useState('');

  const [payeeId, setPayeeId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const inputRef = useRef<TextInput>(null);

  const selectedPayee = payees.find((p) => p.id === payeeId);
  const amountNum = Number(amount.replace(',', '.')) || 0;
  const insufficient = amountNum > available;
  const canContinue = !!payeeId && amountNum > 0 && !insufficient && concept.trim().length > 0;

  const reset = () => {
    setStep('form');
    setPayeeId(null);
    setAmount('');
    setConcept('');
    setCode('');
    setCodeError(null);
    setReceipt(null);
  };

  const shareReceipt = (r: TransferReceipt) => {
    Share.share({
      message: [
        `NovaBank · ${t('transfer.completedBadge')}`,
        money(r.amount),
        `${t('transfer.recipientLabel')}: ${r.payee.name}`,
        `${t('transfer.bankLabel')}: ${r.payee.bank} ${r.payee.account}`,
        `${t('transfer.dateLabel')}: ${r.date}`,
        `${t('transfer.referenceLabel')}: ${r.reference}`,
      ].join('\n'),
    }).catch(() => {});
  };

  const submitCode = async (value: string) => {
    if (value.length !== 6 || !payeeId || submittingCode) return;
    setSubmittingCode(true);
    setCodeError(null);
    try {
      const result = await executeTransfer(payeeId, amountNum, concept, value);
      if (!result.ok) {
        setCodeError(result.message);
        setCode('');
        return;
      }
      setReceipt(result.receipt);
      setStep(result.receipt.rejected ? 'error' : 'done');
    } finally {
      setSubmittingCode(false);
    }
  };

  return (
    <Screen bg={theme.bg}>
      {step === 'form' && (
        <View>
          <ScreenTitle title={t('transfer.title')} note={t('transfer.note')} />

          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.recipient')}</Text>
          <View style={{ marginTop: 10, gap: 9 }}>
            {payees.map((p) => {
              const active = payeeId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPayeeId(p.id)}
                  style={{
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? theme.gold : theme.line,
                    backgroundColor: active ? theme.selBg : theme.surf,
                    padding: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: theme.ink }}>{p.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{p.name}</Text>
                    <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>
                      {p.bank} · {p.account}
                    </Text>
                  </View>
                  <Icon name={active ? 'check_circle' : 'radio_button_unchecked'} size={20} color={active ? theme.gold : theme.soft} />
                </Pressable>
              );
            })}

            {addingPayee ? (
              <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.surf, padding: 13, gap: 10 }}>
                <TextField placeholder={t('transfer.addAccountName')} value={newName} onChangeText={setNewName} />
                <TextField placeholder={t('transfer.addAccountNumber')} value={newCci} onChangeText={setNewCci} keyboardType="number-pad" />
                <PrimaryButton
                  label={savingPayee ? t('transfer.savingAccount') : t('transfer.addAccount')}
                  disabled={newName.trim().length < 2 || newCci.trim().length < 4 || savingPayee}
                  onPress={async () => {
                    setSavingPayee(true);
                    try {
                      const created = await addPayee({
                        name: newName.trim(),
                        bank: t('transfer.addedAccount'),
                        accountNumber: '···' + newCci.trim().slice(-4),
                      });
                      if (created) {
                        setPayeeId(created.id);
                        setAddingPayee(false);
                        setNewName('');
                        setNewCci('');
                      }
                    } finally {
                      setSavingPayee(false);
                    }
                  }}
                  style={{ height: 46 }}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setAddingPayee(true)}
                style={{ borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, borderStyle: 'dashed', backgroundColor: theme.surf, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="add" size={20} color={theme.ink} />
                </View>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.addOtherBank')}</Text>
              </Pressable>
            )}
          </View>

          <Text style={{ marginTop: 22, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.amount')}</Text>
          <View
            style={{
              marginTop: 10,
              height: 72,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: insufficient ? '#C2352B' : theme.gold,
              backgroundColor: theme.surf,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              gap: 9,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: theme.soft }}>S/</Text>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={theme.soft}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontSize: 30, fontWeight: '800', color: theme.ink, letterSpacing: -1, padding: 0 }}
            />
          </View>
          <Text style={{ marginTop: 7, fontFamily: fonts.bodyMed, fontSize: 11.5, color: insufficient ? '#C2352B' : theme.soft }}>
            {insufficient ? t('transfer.insufficient', { available: money(available) }) : t('transfer.availableAmount', { available: money(available) })}
          </Text>

          <Text style={{ marginTop: 18, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.concept')}</Text>
          <View style={{ marginTop: 10 }}>
            <TextField placeholder={t('transfer.conceptPlaceholder')} value={concept} onChangeText={setConcept} />
          </View>

          {sendError ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{sendError}</Text>
          ) : null}
          <PrimaryButton
            label={sendingOtp ? t('transfer.sendingCode') : t('transfer.continue')}
            iconRight="arrow_forward"
            disabled={!canContinue || sendingOtp}
            onPress={async () => {
              setSendingOtp(true);
              setSendError(null);
              try {
                const result = await requestTransferOtp();
                if (!result.ok) {
                  setSendError(result.message);
                  return;
                }
                setStep('otp');
              } finally {
                setSendingOtp(false);
              }
            }}
            style={{ marginTop: 22 }}
          />
        </View>
      )}

      {step === 'otp' && selectedPayee && (
        <View>
          <BackButton onPress={() => setStep('form')} />
          <Text style={{ fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('transfer.confirmToken')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {t('transfer.tokenSubtitleEmail', { amount: money(amountNum) })}
          </Text>
          <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: 24 }}>
            <OtpBoxes value={code} />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={code}
            autoFocus
            editable={!submittingCode}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(v) => {
              const d = v.replace(/\D/g, '').slice(0, 6);
              setCode(d);
              setCodeError(null);
              if (d.length === 6) submitCode(d);
            }}
            style={{ position: 'absolute', opacity: 0, height: 0 }}
          />
          {submittingCode ? (
            <Text style={{ marginTop: 8, fontFamily: fonts.bodyMed, fontSize: 12, color: theme.mid }}>{t('transfer.verifying')}</Text>
          ) : codeError ? (
            <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{codeError}</Text>
          ) : null}
          <Text style={{ marginTop: 16, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
            {otpLeft > 0 ? (
              <>
                {t('transfer.resendIn')}<Text style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>{mmss(otpLeft)}</Text>
              </>
            ) : (
              <Text onPress={() => requestTransferOtp()} style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>
                {t('transfer.resendCode')}
              </Text>
            )}
          </Text>

          <View style={{ marginTop: 22, borderRadius: 18, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 18, gap: 4 }}>
            <Row label={t('transfer.destination')} value={`${selectedPayee.name} · ${selectedPayee.bank}`} />
            <Row label={t('transfer.fee')} value="S/ 0.00" />
            <View style={{ height: 1, backgroundColor: theme.line, marginVertical: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.total')}</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 19, color: theme.ink }}>{money(amountNum)}</Text>
            </View>
          </View>
        </View>
      )}

      {step === 'done' && receipt && (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: '#EAF9F1', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={40} color="#21A26B" />
          </View>
          <Text style={{ marginTop: 18, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('transfer.sent')}</Text>
          <Text style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 13.5, color: theme.mid }}>{t('transfer.sentSubtitle')}</Text>

          <View style={{ marginTop: 20, width: '100%', borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, borderStyle: 'dashed', padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LogoMark size={22} />
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#123A63' }}>NovaBank</Text>
              </View>
              <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EAF9F1' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: '#21A26B' }}>{t('transfer.completedBadge')}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 14, fontFamily: fonts.heading, fontSize: 30, letterSpacing: -1.1, color: theme.ink }}>{money(receipt.amount)}</Text>
            <View style={{ marginTop: 16, gap: 10 }}>
              <Row label={t('transfer.recipientLabel')} value={receipt.payee.name} />
              <Row label={t('transfer.bankLabel')} value={`${receipt.payee.bank} ${receipt.payee.account}`} />
              <Row label={t('transfer.dateLabel')} value={receipt.date} />
              <Row label={t('transfer.referenceLabel')} value={receipt.reference} />
            </View>
          </View>

          <GhostButton label={t('transfer.share')} icon="share" onPress={() => shareReceipt(receipt)} style={{ marginTop: 18, width: '100%', height: 50 }} />
          <PrimaryButton label={t('transfer.newTransfer')} onPress={reset} style={{ marginTop: 10, width: '100%', height: 50 }} />
        </View>
      )}

      {step === 'error' && receipt && (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: '#FFF4F3', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="error_outline" size={40} color="#C2352B" />
          </View>
          <Text style={{ marginTop: 18, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink, textAlign: 'center' }}>{t('transfer.failedTitle')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid, textAlign: 'center' }}>
            {t('transfer.failedSubtitle')}
          </Text>

          <View style={{ marginTop: 20, width: '100%', borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: theme.ink }}>{t('transfer.rejectionDetail')}</Text>
              <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFF4F3' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: '#C2352B' }}>{t('transfer.rejectedBadge')}</Text>
              </View>
            </View>
            <View style={{ marginTop: 14, gap: 10 }}>
              <Row label={t('transfer.reasonLabel')} value={receipt.reasonLabel ?? ''} />
              <Row label={t('transfer.codeLabel')} value={receipt.reasonCode ?? ''} />
              <Row label={t('transfer.amountLabel')} value={money(receipt.amount)} />
              <Row label={t('transfer.balanceLabel')} k={<Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#21A26B' }}>{t('transfer.balanceIntact', { amount: money(available) })}</Text>} />
            </View>
          </View>

          <PrimaryButton label={t('transfer.fixAndRetry')} onPress={() => setStep('form')} style={{ marginTop: 18, width: '100%', height: 52 }} />
          <GhostButton label={t('transfer.contactSupport')} icon="support_agent" onPress={() => nav.navigate('Concierge')} style={{ marginTop: 10, width: '100%', height: 52 }} />
        </View>
      )}
    </Screen>
  );
}
