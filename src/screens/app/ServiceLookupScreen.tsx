import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { GhostButton, GoldButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { RootStackParamList } from '../../navigation/types';
import { ServiceBill } from '../../state/types';
import { useLanguage } from '../../i18n/LanguageContext';

type Route = RouteProp<RootStackParamList, 'ServiceLookup'>;

export default function ServiceLookupScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const { biller } = params;
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { available, affiliateService, payBill } = useAppState();

  const [supplyNumber, setSupplyNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bill, setBill] = useState<ServiceBill | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const lookup = async () => {
    if (loading || !supplyNumber.trim()) return;
    setLoading(true);
    setError(null);
    const result = await affiliateService(biller.key, supplyNumber.trim());
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setBill(result.bill);
  };

  const submitPayment = async () => {
    if (!bill || paying) return;
    setPaying(true);
    setError(null);
    const result = await payBill(bill.id);
    setPaying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPaid(true);
  };

  if (bill && paid) {
    return (
      <Screen bg={theme.bg}>
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('services.receiptPaid')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {t('services.receiptPaidBody', { name: bill.name, amount: money(bill.amount) })}
          </Text>
          <GhostButton label={t('serviceLookup.backToServices')} onPress={() => nav.navigate('Services')} style={{ marginTop: 24, width: 240 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={theme.bg}>
      <BackButton onPress={() => nav.goBack()} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: biller.iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={biller.icon} size={21} color={biller.iconFg} />
        </View>
        <Text style={{ fontFamily: fonts.heading, fontSize: 22, letterSpacing: -0.6, color: theme.ink }}>{biller.name}</Text>
      </View>

      {!bill ? (
        <View style={{ marginTop: 22 }}>
          <TextField
            label={biller.fieldLabel}
            icon="tag"
            placeholder={biller.fieldPlaceholder}
            value={supplyNumber}
            onChangeText={setSupplyNumber}
            autoCapitalize="none"
          />
          {error ? (
            <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          <PrimaryButton
            label={loading ? t('serviceLookup.checking') : t('serviceLookup.check')}
            disabled={!supplyNumber.trim() || loading}
            onPress={lookup}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : bill.paid ? (
        <View style={{ marginTop: 22, borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check_circle" size={30} color={theme.green} />
          </View>
          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 16, color: theme.ink }}>{t('serviceLookup.upToDate')}</Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.soft }}>
            {t('serviceLookup.upToDateBody', { supply: bill.supplyNumber })}
          </Text>
          <GhostButton label={t('serviceLookup.backToServices')} onPress={() => nav.navigate('Services')} style={{ marginTop: 18, width: 220 }} />
        </View>
      ) : (
        <View style={{ marginTop: 22 }}>
          <View style={{ borderRadius: 22, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: theme.soft, letterSpacing: 1.4, textTransform: 'uppercase' }}>{t('serviceLookup.amountDue')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.heading, fontSize: 32, letterSpacing: -1, color: theme.ink }}>{money(bill.amount)}</Text>
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.line, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{biller.fieldLabel}</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: theme.ink }}>{bill.supplyNumber}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{t('services.expiry')}</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: theme.ink }}>{bill.expiry}</Text>
              </View>
            </View>
          </View>

          {error ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
          ) : null}
          {bill.amount > available ? (
            <Text style={{ marginTop: 10, fontFamily: fonts.bodyMed, fontSize: 11.5, color: '#C2352B' }}>{t('qr.insufficientBalance')}</Text>
          ) : null}

          <GoldButton
            label={paying ? t('services.paying') : t('services.pay', { amount: money(bill.amount) })}
            disabled={bill.amount > available || paying}
            onPress={submitPayment}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </Screen>
  );
}
