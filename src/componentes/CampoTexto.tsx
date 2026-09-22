import React, { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { fuentes } from '../tema/estilos';
import Icono from './Icono';

type Props = TextInputProps & {
  label?: string;
  icon?: string;
  status?: 'default' | 'error' | 'success';
  iconoAccion?: string;
  alPresionarIconoAccion?: () => void;
  pista?: string;
};

export default function CampoTexto({ label, icon, status = 'default', iconoAccion, alPresionarIconoAccion, pista, style, ...rest }: Props) {
  const { tema } = usarTema();
  const [enfocado, setEnfocado] = useState(false);

  let colorBorde = tema.linea;
  let fondo = tema.superficie;
  if (status === 'success') {
    colorBorde = '#21A26B';
    fondo = tema.oscuro ? tema.superficie : '#F5FCF8';
  } else if (status === 'error') {
    colorBorde = '#C2352B';
    fondo = tema.oscuro ? tema.superficie : '#FFF4F3';
  } else if (enfocado) {
    colorBorde = tema.dorado;
  }

  return (
    <View style={{ marginBottom: 2 }}>
      {label ? (
        <Text style={{ fontFamily: fuentes.headingSemi, fontSize: 12, color: tema.medio, marginBottom: 7 }}>{label}</Text>
      ) : null}
      <View
        style={{
          height: 52,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colorBorde,
          backgroundColor: fondo,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {icon ? <Icono name={icon} size={19} color={tema.suave} /> : null}
        <TextInput
          placeholderTextColor={tema.suave}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          style={[{ flex: 1, fontSize: 14.5, color: tema.tinta, padding: 0 }, style]}
          {...rest}
        />
        {status === 'success' ? <Icono name="check_circle" size={19} color="#21A26B" /> : null}
        {iconoAccion ? (
          <Pressable onPress={alPresionarIconoAccion} hitSlop={10}>
            <Icono name={iconoAccion} size={19} color={tema.suave} />
          </Pressable>
        ) : null}
      </View>
      {pista ? <Text style={{ marginTop: 6, fontSize: 11.5, fontFamily: fuentes.bodyMed, color: status === 'error' ? '#C2352B' : tema.suave }}>{pista}</Text> : null}
    </View>
  );
}
