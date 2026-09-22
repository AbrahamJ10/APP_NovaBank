import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

// logo1 = compact mark, used everywhere inside the app (headers, cards, login…)
// logo2 = full lockup with wordmark, reserved for the splash / welcome moment.
const logo1 = require('../../img/logo1.jpg');
const logo2 = require('../../img/logo2.jpg');

export function LogoMark({ size = 40, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={logo1} style={[{ width: size, height: size, resizeMode: 'contain' }, style]} />;
}

export function LogoFull({ width = 240, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  const height = width * (1024 / 1536);
  return <Image source={logo2} style={[{ width, height, resizeMode: 'contain' }, style]} />;
}
