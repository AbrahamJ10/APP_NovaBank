import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../tema/ContextoTema';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bg?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export default function Pantalla({ children, scroll = true, padded = true, bg, style, contentStyle, edges }: Props) {
  const { tema, oscuro } = usarTema();
  const fondo = bg ?? tema.fondo;

  const cuerpo = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, { paddingBottom: 40 }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: fondo }, style]} edges={edges ?? ['top', 'left', 'right']}>
      <StatusBar barStyle={oscuro ? 'light-content' : 'dark-content'} backgroundColor={fondo} />
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {cuerpo}
        </KeyboardAvoidingView>
      ) : (
        cuerpo
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: 20, paddingTop: 6 },
});
