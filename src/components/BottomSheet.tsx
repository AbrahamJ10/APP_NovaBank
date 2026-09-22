import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { radii } from '../theme/tokens';

const { height: SCREEN_H } = Dimensions.get('window');

export default function BottomSheet({
  visible,
  onClose,
  onShow,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  // Fires once the slide-in animation finishes — autoFocus on a TextInput
  // mounted at the same time as the Modal itself is unreliable on Android
  // (the native modal window doesn't reliably have input focus yet), so any
  // sheet that needs to focus an input on open should do it from here
  // instead of the input's own autoFocus prop.
  onShow?: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => onShow?.());
    } else {
      translateY.setValue(SCREEN_H);
      fade.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ translateY }] }}>
          <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: theme.surf }]}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
            {children}
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,17,26,.55)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: radii.xxl + 2,
    borderTopRightRadius: radii.xxl + 2,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
});
