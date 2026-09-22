import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'novabank_access_token';
const REFRESH_KEY = 'novabank_refresh_token';
const LAST_EMAIL_KEY = 'novabank_last_email';
const LAST_NAME_KEY = 'novabank_last_name';

export async function guardarTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function obtenerTokenAcceso() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function obtenerTokenRefresco() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function limpiarTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

// Recuerda qué cuenta inició sesión con éxito por última vez en este
// dispositivo, para que el login rápido con Face ID sepa contra las fotos
// de referencia de quién comparar, y la pantalla de login pueda saludar a
// un usuario que regresa por su nombre y saltarse pedir el correo de nuevo
// (solo la contraseña, como hacen la mayoría de apps bancarias).
export async function guardarUltimoCorreo(email: string) {
  await SecureStore.setItemAsync(LAST_EMAIL_KEY, email);
}

export async function obtenerUltimoCorreo() {
  return SecureStore.getItemAsync(LAST_EMAIL_KEY);
}

export async function guardarUltimaCuenta(email: string, fullName: string) {
  await Promise.all([
    SecureStore.setItemAsync(LAST_EMAIL_KEY, email),
    SecureStore.setItemAsync(LAST_NAME_KEY, fullName),
  ]);
}

export async function obtenerUltimaCuenta() {
  const [email, fullName] = await Promise.all([
    SecureStore.getItemAsync(LAST_EMAIL_KEY),
    SecureStore.getItemAsync(LAST_NAME_KEY),
  ]);
  if (!email || !fullName) return null;
  return { email, fullName };
}

export async function limpiarUltimaCuenta() {
  await Promise.all([
    SecureStore.deleteItemAsync(LAST_EMAIL_KEY),
    SecureStore.deleteItemAsync(LAST_NAME_KEY),
  ]);
}
