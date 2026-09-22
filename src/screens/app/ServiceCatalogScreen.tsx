import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton } from '../../components/Primitives';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { billsApi, Biller } from '../../lib/api';
import { RootStackParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

const CATEGORY_LABEL: Record<Biller['category'], string> = {
  luz: 'Luz',
  agua: 'Agua',
  gas: 'Gas',
  movil: 'Telefonía móvil',
  cable: 'Cable e internet',
  banco: 'Tarjetas y préstamos',
  seguro: 'Seguros',
  educacion: 'Educación',
  municipalidad: 'Municipalidades',
};

export default function ServiceCatalogScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { services } = useAppState();
  const [catalog, setCatalog] = useState<Biller[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    billsApi.catalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const affiliatedKeys = useMemo(() => new Set(services.map((s) => s.billerKey)), [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog ?? [];
    return q ? list.filter((b) => b.name.toLowerCase().includes(q)) : list;
  }, [catalog, query]);

  const grouped = useMemo(() => {
    const map = new Map<Biller['category'], Biller[]>();
    for (const b of filtered) {
      const arr = map.get(b.category) ?? [];
      arr.push(b);
      map.set(b.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Screen bg={theme.bg}>
      <BackButton onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.8, color: theme.ink }}>{t('serviceCatalog.title')}</Text>
      <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>{t('serviceCatalog.subtitle')}</Text>

      <View style={{ marginTop: 16, height: 48, borderRadius: 15, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }}>
        <Icon name="search" size={19} color={theme.soft} />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={t('serviceCatalog.searchPlaceholder')}
          placeholderTextColor={theme.soft}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: theme.ink }}
        />
      </View>

      {catalog === null ? (
        <Text style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 12.5, color: theme.soft, textAlign: 'center' }}>{t('serviceCatalog.loading')}</Text>
      ) : filtered.length === 0 ? (
        <Text style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 12.5, color: theme.soft, textAlign: 'center' }}>{t('serviceCatalog.noResults')}</Text>
      ) : (
        grouped.map(([category, billers]) => (
          <View key={category} style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{CATEGORY_LABEL[category]}</Text>
            <View style={{ marginTop: 10, gap: 9 }}>
              {billers.map((b) => {
                const affiliated = affiliatedKeys.has(b.key);
                return (
                  <Pressable
                    key={b.key}
                    onPress={() => nav.navigate('ServiceLookup', { biller: b })}
                    style={{ borderRadius: 18, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: b.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={b.icon} size={19} color={b.iconFg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{b.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{b.fieldLabel}</Text>
                    </View>
                    {affiliated ? (
                      <Icon name="check_circle" size={19} color={theme.green} />
                    ) : (
                      <Icon name="chevron_right" size={19} color={theme.soft} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
