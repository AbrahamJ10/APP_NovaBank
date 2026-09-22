import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../components/Pantalla';
import { BotonVolver } from '../../components/Primitivas';
import Icono from '../../components/Icono';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { billsApi, Biller } from '../../lib/api';
import { ListaParametrosRaiz } from '../../navigation/tipos';
import { usarIdioma } from '../../i18n/ContextoIdioma';

const ETIQUETA_CATEGORIA: Record<Biller['category'], string> = {
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
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosRaiz>>();
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { services } = usarEstadoApp();
  const [catalogo, setCatalogo] = useState<Biller[] | null>(null);
  const [consulta, setConsulta] = useState('');

  useEffect(() => {
    billsApi.catalog().then(setCatalogo).catch(() => setCatalogo([]));
  }, []);

  const clavesAfiliadas = useMemo(() => new Set(services.map((s) => s.billerKey)), [services]);

  const filtrados = useMemo(() => {
    const q = consulta.trim().toLowerCase();
    const lista = catalogo ?? [];
    return q ? lista.filter((proveedor) => proveedor.name.toLowerCase().includes(q)) : lista;
  }, [catalogo, consulta]);

  const agrupados = useMemo(() => {
    const mapa = new Map<Biller['category'], Biller[]>();
    for (const proveedor of filtrados) {
      const arreglo = mapa.get(proveedor.category) ?? [];
      arreglo.push(proveedor);
      mapa.set(proveedor.category, arreglo);
    }
    return Array.from(mapa.entries());
  }, [filtrados]);

  return (
    <Pantalla bg={theme.bg}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fuentes.heading, fontSize: 25, letterSpacing: -0.8, color: theme.ink }}>{t('serviceCatalog.title')}</Text>
      <Text style={{ marginTop: 5, fontFamily: fuentes.body, fontSize: 12.5, color: theme.mid }}>{t('serviceCatalog.subtitle')}</Text>

      <View style={{ marginTop: 16, height: 48, borderRadius: 15, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }}>
        <Icono name="search" size={19} color={theme.soft} />
        <TextInput
          autoFocus
          value={consulta}
          onChangeText={setConsulta}
          placeholder={t('serviceCatalog.searchPlaceholder')}
          placeholderTextColor={theme.soft}
          style={{ flex: 1, fontFamily: fuentes.body, fontSize: 13.5, color: theme.ink }}
        />
      </View>

      {catalogo === null ? (
        <Text style={{ marginTop: 20, fontFamily: fuentes.body, fontSize: 12.5, color: theme.soft, textAlign: 'center' }}>{t('serviceCatalog.loading')}</Text>
      ) : filtrados.length === 0 ? (
        <Text style={{ marginTop: 20, fontFamily: fuentes.body, fontSize: 12.5, color: theme.soft, textAlign: 'center' }}>{t('serviceCatalog.noResults')}</Text>
      ) : (
        agrupados.map(([categoria, proveedores]) => (
          <View key={categoria} style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: theme.soft, letterSpacing: 1.6, textTransform: 'uppercase' }}>{ETIQUETA_CATEGORIA[categoria]}</Text>
            <View style={{ marginTop: 10, gap: 9 }}>
              {proveedores.map((proveedor) => {
                const afiliado = clavesAfiliadas.has(proveedor.key);
                return (
                  <Pressable
                    key={proveedor.key}
                    onPress={() => nav.navigate('ServiceLookup', { biller: proveedor })}
                    style={{ borderRadius: 18, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: proveedor.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icono name={proveedor.icon} size={19} color={proveedor.iconFg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: theme.ink }}>{proveedor.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{proveedor.fieldLabel}</Text>
                    </View>
                    {afiliado ? (
                      <Icono name="check_circle" size={19} color={theme.green} />
                    ) : (
                      <Icono name="chevron_right" size={19} color={theme.soft} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Pantalla>
  );
}
