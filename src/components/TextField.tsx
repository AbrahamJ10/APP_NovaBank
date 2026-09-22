import React, { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/tokens';
import Icon from './Icon';

type Props = TextInputProps & {
  label?: string;
  icon?: string;
  status?: 'default' | 'error' | 'success';
  rightIcon?: string;
  onRightIconPress?: () => void;
  hint?: string;
};

export default function TextField({ label, icon, status = 'default', rightIcon, onRightIconPress, hint, style, ...rest }: Props) {
  const { theme } = useTheme();
  const [enfocado, setEnfocado] = useState(false);

  let colorBorde = theme.line;
  let fondo = theme.surf;
  if (status === 'success') {
    colorBorde = '#21A26B';
    fondo = theme.dark ? theme.surf : '#F5FCF8';
  } else if (status === 'error') {
    colorBorde = '#C2352B';
    fondo = theme.dark ? theme.surf : '#FFF4F3';
  } else if (enfocado) {
    colorBorde = theme.gold;
  }

  return (
    <View style={{ marginBottom: 2 }}>
      {label ? (
        <Text style={{ fontFamily: fonts.headingSemi, fontSize: 12, color: theme.mid, marginBottom: 7 }}>{label}</Text>
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
        {icon ? <Icon name={icon} size={19} color={theme.soft} /> : null}
        <TextInput
          placeholderTextColor={theme.soft}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          style={[{ flex: 1, fontSize: 14.5, color: theme.ink, padding: 0 }, style]}
          {...rest}
        />
        {status === 'success' ? <Icon name="check_circle" size={19} color="#21A26B" /> : null}
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <Icon name={rightIcon} size={19} color={theme.soft} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={{ marginTop: 6, fontSize: 11.5, fontFamily: fonts.bodyMed, color: status === 'error' ? '#C2352B' : theme.soft }}>{hint}</Text> : null}
    </View>
  );
}
