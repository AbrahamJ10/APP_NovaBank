import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'novabank_access_token';
const REFRESH_KEY = 'novabank_refresh_token';
const LAST_EMAIL_KEY = 'novabank_last_email';
const LAST_NAME_KEY = 'novabank_last_name';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

// Remembers which account last signed in successfully on this device, so
// Face ID quick-login knows whose reference photos to compare against, and
// the login screen can greet a returning user by name and skip asking for
// their email again (only the password, like most banking apps do).
export async function saveLastEmail(email: string) {
  await SecureStore.setItemAsync(LAST_EMAIL_KEY, email);
}

export async function getLastEmail() {
  return SecureStore.getItemAsync(LAST_EMAIL_KEY);
}

export async function saveLastAccount(email: string, fullName: string) {
  await Promise.all([
    SecureStore.setItemAsync(LAST_EMAIL_KEY, email),
    SecureStore.setItemAsync(LAST_NAME_KEY, fullName),
  ]);
}

export async function getLastAccount() {
  const [email, fullName] = await Promise.all([
    SecureStore.getItemAsync(LAST_EMAIL_KEY),
    SecureStore.getItemAsync(LAST_NAME_KEY),
  ]);
  if (!email || !fullName) return null;
  return { email, fullName };
}

export async function clearLastAccount() {
  await Promise.all([
    SecureStore.deleteItemAsync(LAST_EMAIL_KEY),
    SecureStore.deleteItemAsync(LAST_NAME_KEY),
  ]);
}
