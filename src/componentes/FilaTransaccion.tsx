import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { fuentes } from '../tema/estilos';
import { dinero } from '../libreria/formato';
import { Tx } from '../estado/tipos';
import Icono from './Icono';

export default function FilaTransaccion({ tx, onPress, showDate }: { tx: Tx; onPress?: () => void; showDate?: boolean }) {
  const { tema } = usarTema();
  const colorMonto = tx.kind === 'credit' ? tema.verde : tema.tinta;
  const signo = tx.kind === 'credit' ? '+' : '−';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: tema.linea,
      }}
    >
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: tx.iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={tx.icon} size={21} color={tx.iconFg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: fuentes.bodyBold, fontSize: 13.5, color: tema.tinta }}>
          {tx.name}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>
          {tx.meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: fuentes.headingBold, fontSize: 14.5, color: colorMonto }}>
          {signo}
          {dinero(tx.amount)}
        </Text>
        {showDate ? <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11, color: tema.suave }}>{tx.time}</Text> : null}
      </View>
    </Pressable>
  );
}
