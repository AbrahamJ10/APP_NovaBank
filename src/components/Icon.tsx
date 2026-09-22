import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

// El mockup se hizo contra Material Symbols Rounded (Google, usa nombres
// snake_case). @expo/vector-icons trae en cambio la fuente clásica de
// Material Icons (kebab-case, y un puñado de nombres son directamente
// distintos). Esto le permite a cada pantalla seguir usando el nombre de
// ícono original del mockup.
const ALIAS: Record<string, string> = {
  shield_lock: 'security',
  emergency_home: 'emergency',
  local_atm: 'local-atm',
};

export function symbolToGlyph(nombre: string) {
  if (ALIAS[nombre]) return ALIAS[nombre];
  return nombre.replace(/_/g, '-');
}

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: any;
};

export default function Icon({ name, size = 20, color = '#0F1A26', style }: Props) {
  return <MaterialIcons name={symbolToGlyph(name) as any} size={size} color={color} style={style} />;
}
