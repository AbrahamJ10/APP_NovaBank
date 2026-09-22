import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../componentes/Pantalla';
import { BotonVolver } from '../../componentes/Primitivas';
import Icono from '../../componentes/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { billsApi, Biller } from '../../libreria/api';
import { ListaParametrosRaiz } from '../../navegacion/tipos';
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

export default function PantallaCatalogoServicios() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosRaiz>>();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { servicios } = usarEstadoApp();
  const [catalogo, setCatalogo] = useState<Biller[] | null>(null);
  const [consulta, setConsulta] = useState('');

  useEffect(() => {
    billsApi.catalog().then(setCatalogo).catch(() => setCatalogo([]));
  }, []);

  const clavesAfiliadas = useMemo(() => new Set(servicios.map((s) => s.billerKey)), [servicios]);

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
    <Pantalla bg={tema.fondo}>
      <BotonVolver onPress={() => nav.goBack()} />
      <Text style={{ fontFamily: fuentes.heading, fontSize: 25, letterSpacing: -0.8, color: tema.tinta }}>{t('serviceCatalog.title')}</Text>
      <Text style={{ marginTop: 5, fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>{t('serviceCatalog.subtitle')}</Text>

      <View style={{ marginTop: 16, height: 48, borderRadius: 15, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 }}>
        <Icono name="search" size={19} color={tema.suave} />
        <TextInput
          autoFocus
          value={consulta}
          onChangeText={setConsulta}
          placeholder={t('serviceCatalog.searchPlaceholder')}
          placeholderTextColor={tema.suave}
          style={{ flex: 1, fontFamily: fuentes.body, fontSize: 13.5, color: tema.tinta }}
        />
      </View>

      {catalogo === null ? (
        <Text style={{ marginTop: 20, fontFamily: fuentes.body, fontSize: 12.5, color: tema.suave, textAlign: 'center' }}>{t('serviceCatalog.loading')}</Text>
      ) : filtrados.length === 0 ? (
        <Text style={{ marginTop: 20, fontFamily: fuentes.body, fontSize: 12.5, color: tema.suave, textAlign: 'center' }}>{t('serviceCatalog.noResults')}</Text>
      ) : (
        agrupados.map(([categoria, proveedores]) => (
          <View key={categoria} style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: fuentes.body, fontSize: 10, color: tema.suave, letterSpacing: 1.6, textTransform: 'uppercase' }}>{ETIQUETA_CATEGORIA[categoria]}</Text>
            <View style={{ marginTop: 10, gap: 9 }}>
              {proveedores.map((proveedor) => {
                const afiliado = clavesAfiliadas.has(proveedor.key);
                return (
                  <Pressable
                    key={proveedor.key}
                    onPress={() => nav.navigate('ServiceLookup', { biller: proveedor })}
                    style={{ borderRadius: 18, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: proveedor.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icono name={proveedor.icon} size={19} color={proveedor.iconFg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>{proveedor.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{proveedor.fieldLabel}</Text>
                    </View>
                    {afiliado ? (
                      <Icono name="check_circle" size={19} color={tema.verde} />
                    ) : (
                      <Icono name="chevron_right" size={19} color={tema.suave} />
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
