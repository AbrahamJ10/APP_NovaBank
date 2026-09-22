import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

// The mockup was authored against Material Symbols Rounded (Google, uses
// snake_case names). @expo/vector-icons ships the classic Material Icons
// font instead (kebab-case, and a handful of names differ outright). This
// keeps every screen able to reference the original mockup icon name.
const ALIASES: Record<string, string> = {
  shield_lock: 'security',
  emergency_home: 'emergency',
  local_atm: 'local-atm',
};

export function symbolToGlyph(name: string) {
  if (ALIASES[name]) return ALIASES[name];
  return name.replace(/_/g, '-');
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
