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
  const [focused, setFocused] = useState(false);

  let borderColor = theme.line;
  let bg = theme.surf;
  if (status === 'success') {
    borderColor = '#21A26B';
    bg = theme.dark ? theme.surf : '#F5FCF8';
  } else if (status === 'error') {
    borderColor = '#C2352B';
    bg = theme.dark ? theme.surf : '#FFF4F3';
  } else if (focused) {
    borderColor = theme.gold;
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
          borderColor,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {icon ? <Icon name={icon} size={19} color={theme.soft} /> : null}
        <TextInput
          placeholderTextColor={theme.soft}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
