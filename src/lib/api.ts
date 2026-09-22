import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './secureTokens';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL no está configurada — revisa el archivo .env');
}

// Los valores de header HTTP deben ser ASCII sin caracteres de control —
// un string de nombre de dispositivo tal cual lo da el fabricante no tiene
// esa garantía, y un valor de header inválido lanza una excepción dentro
// de fetch/XMLHttpRequest en RN, lo que rompería cada llamada a la API en
// toda la app. Se filtra todo lo que esté fuera de un rango ASCII
// imprimible seguro antes de que llegue a un header.
function sanitizeHeaderValue(value: string, maxLength = 60): string {
  const cleaned = value.replace(/[^\x20-\x7E]/g, '').trim();
  return (cleaned || 'Desconocido').slice(0, maxLength);
}

// Se envía en cada solicitud para que el rastro de auditoría del backend
// (ver tabla auditoria) pueda atribuir cada acción a un dispositivo/
// plataforma/versión de app reales, no solo a una IP. Se calcula una sola
// vez — nunca cambian durante la vida de la app.
const DEVICE_HEADERS: Record<string, string> = {
  'X-Device-Model': sanitizeHeaderValue(
    [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || Device.deviceName || 'Desconocido'
  ),
  'X-Platform': Platform.OS,
  'X-App-Version': sanitizeHeaderValue(Constants.expoConfig?.version ?? '0.0.0', 20),
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, unknown>) {
    super(message);
  }
}

// Se lanza cuando el refresh token en sí es inválido/expiró — quien llama
// debe mandar al usuario de vuelta a la pantalla de login, no hay
// recuperación automática.
export class SessionExpiredError extends Error {}

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  dni: string | null;
};

type AuthResponse = { user: PublicUser; accessToken: string; refreshToken: string };

async function rawRequest(path: string, options: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...DEVICE_HEADERS, ...(options.headers ?? {}) },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'Ocurrió un error inesperado', body ?? undefined);
  }
  return body;
}

// Un solo refresh en vuelo a la vez, compartido por cada quien que reciba
// un 401 al mismo tiempo, para no gastar rotaciones de refresh token
// compitiendo entre sí.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new SessionExpiredError('No hay sesión activa');
      try {
        const data: AuthResponse = await rawRequest('/api/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
        await saveTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      } catch (err) {
        await clearTokens();
        throw new SessionExpiredError('Tu sesión expiró, inicia sesión nuevamente');
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function authedRequest(path: string, options: RequestInit = {}) {
  let accessToken = await getAccessToken();

  const attempt = (token: string | null) =>
    rawRequest(path, {
      ...options,
      headers: { ...(options.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

  try {
    return await attempt(accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      accessToken = await refreshAccessToken();
      return attempt(accessToken);
    }
    throw err;
  }
}

// El plan gratuito de Render puede tardar hasta ~50s en despertar una
// instancia dormida — se usa para acotar la verificación de sesión al
// arrancar, para que la app no se quede colgada con un backend frío y en
// vez de eso caiga a la pantalla de login.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export type DniLookupResult = {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fullName: string;
};

export const dniApi = {
  async lookup(dni: string): Promise<DniLookupResult> {
    return rawRequest(`/api/dni/${dni}`, { method: 'GET' });
  },
};

export type FaceMatchResult = { matched: boolean; confidence: number; threshold: number };

export const verificationApi = {
  async requestRegisterOtp(email: string) {
    await rawRequest('/api/verification/otp/request', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async faceMatch(input: { dni: string; selfie: string; dniPhoto: string }): Promise<FaceMatchResult> {
    return rawRequest('/api/verification/face-match', { method: 'POST', body: JSON.stringify(input) });
  },
};

export type AccountSummary = {
  accountNumber: string;
  cci: string;
  cardNumber: string;
  cardExpiry: string;
  availableBalance: number;
  heldBalance: number;
  creditLine: number;
  cardDebt: number;
  minPayment: number;
  cutDate: string;
  cardBlocked: boolean;
  memberSince: string;
};

export const accountApi = {
  async get(): Promise<AccountSummary> {
    return authedRequest('/api/account');
  },

  async setCardBlocked(blocked: boolean): Promise<{ cardBlocked: boolean }> {
    return authedRequest('/api/account/card-block', { method: 'POST', body: JSON.stringify({ blocked }) });
  },

  async payCard(amount: number): Promise<AccountSummary> {
    return authedRequest('/api/account/pay-card', { method: 'POST', body: JSON.stringify({ amount }) });
  },

  async revealCvv(otpCode: string): Promise<{ cvv: string }> {
    return authedRequest('/api/account/reveal-cvv', { method: 'POST', body: JSON.stringify({ otpCode }) });
  },
};

export type ApiTransaction = {
  id: string;
  name: string;
  meta: string;
  amount: number;
  kind: 'credit' | 'debit';
  category: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  createdAt: string;
};

export const transactionsApi = {
  async list(limit = 50): Promise<ApiTransaction[]> {
    const data: { items: ApiTransaction[] } = await authedRequest(`/api/transactions?limit=${limit}`);
    return data.items;
  },
};

export type ApiNotification = {
  id: string;
  title: string;
  body: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  unread: boolean;
  createdAt: string;
};

export const notificationsApi = {
  async list(limit = 50): Promise<ApiNotification[]> {
    const data: { items: ApiNotification[] } = await authedRequest(`/api/notifications?limit=${limit}`);
    return data.items;
  },

  async markAllRead() {
    await authedRequest('/api/notifications/read-all', { method: 'POST' });
  },

  async markRead(id: string) {
    await authedRequest(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async deleteAll() {
    await authedRequest('/api/notifications', { method: 'DELETE' });
  },
};

export type ApiPayee = {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  initials: string;
  inactive: boolean;
};

export const payeesApi = {
  async list(): Promise<ApiPayee[]> {
    const data: { items: ApiPayee[] } = await authedRequest('/api/payees');
    return data.items;
  },

  async create(input: { name: string; bank: string; accountNumber: string }): Promise<ApiPayee> {
    return authedRequest('/api/payees', { method: 'POST', body: JSON.stringify(input) });
  },
};

export type TransferReceiptResponse = {
  transactionId: string;
  amount: number;
  concept: string;
  payee: { name: string; bank: string; accountNumber: string };
  reference: string;
  createdAt: string;
};

export const transfersApi = {
  async requestOtp() {
    await authedRequest('/api/transfers/otp/request', { method: 'POST' });
  },

  async execute(input: { payeeId: string; amount: number; concept: string; otpCode: string }): Promise<TransferReceiptResponse> {
    return authedRequest('/api/transfers', { method: 'POST', body: JSON.stringify(input) });
  },
};

export const profileApi = {
  async requestOtp() {
    await authedRequest('/api/profile/otp/request', { method: 'POST' });
  },

  async updateEmail(newEmail: string, otpCode: string): Promise<PublicUser> {
    const data: { user: PublicUser } = await authedRequest('/api/profile/email', {
      method: 'POST',
      body: JSON.stringify({ newEmail, otpCode }),
    });
    return data.user;
  },

  async updatePhone(newPhone: string, otpCode: string): Promise<PublicUser> {
    const data: { user: PublicUser } = await authedRequest('/api/profile/phone', {
      method: 'POST',
      body: JSON.stringify({ newPhone, otpCode }),
    });
    return data.user;
  },

  async updatePassword(currentPassword: string, newPassword: string, otpCode: string) {
    await authedRequest('/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, otpCode }),
    });
  },
};

export type SecurityAlerts = { compra: boolean; retiro: boolean; login: boolean; promo: boolean };
export type SecurityLimits = { limitOnline: number; limitAtm: number; geoPeru: boolean; geoIntl: boolean };
export type SecuritySession = { id: string; device: string; ip: string | null; createdAt: string; current: boolean };

export const securityApi = {
  async getAlerts(): Promise<SecurityAlerts> {
    return authedRequest('/api/security/alerts');
  },

  async updateAlerts(alerts: SecurityAlerts): Promise<SecurityAlerts> {
    return authedRequest('/api/security/alerts', { method: 'PUT', body: JSON.stringify(alerts) });
  },

  async getLimits(): Promise<SecurityLimits> {
    return authedRequest('/api/security/limits');
  },

  async updateLimits(limits: SecurityLimits): Promise<SecurityLimits> {
    return authedRequest('/api/security/limits', { method: 'PUT', body: JSON.stringify(limits) });
  },

  async listSessions(refreshToken: string): Promise<SecuritySession[]> {
    const data: { items: SecuritySession[] } = await authedRequest('/api/security/sessions', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return data.items;
  },

  async revokeSession(id: string) {
    await authedRequest(`/api/security/sessions/${id}`, { method: 'DELETE' });
  },

  async revokeOtherSessions(refreshToken: string) {
    await authedRequest('/api/security/sessions/revoke-others', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  },
};

export const statementsApi = {
  async send(month: number, year: number) {
    await authedRequest('/api/statements/send', { method: 'POST', body: JSON.stringify({ month, year }) });
  },
};

export type ApiBill = {
  id: string;
  billerKey: string;
  supplyNumber: string;
  name: string;
  meta: string;
  icon: string;
  amount: number;
  dueDate: string;
  consumption: string | null;
  paid: boolean;
  suspended: boolean;
};

export type Biller = {
  key: string;
  name: string;
  category: 'luz' | 'agua' | 'gas' | 'movil' | 'cable' | 'banco' | 'seguro' | 'educacion' | 'municipalidad';
  icon: string;
  iconBg: string;
  iconFg: string;
  fieldLabel: string;
  fieldPlaceholder: string;
};

export const billsApi = {
  async list(): Promise<ApiBill[]> {
    const data: { items: ApiBill[] } = await authedRequest('/api/bills');
    return data.items;
  },

  async catalog(): Promise<Biller[]> {
    const data: { items: Biller[] } = await authedRequest('/api/bills/catalog');
    return data.items;
  },

  async affiliate(billerKey: string, supplyNumber: string): Promise<ApiBill> {
    return authedRequest('/api/bills/affiliate', { method: 'POST', body: JSON.stringify({ billerKey, supplyNumber }) });
  },

  async pay(id: string) {
    await authedRequest(`/api/bills/${id}/pay`, { method: 'POST' });
  },

  async suspend(id: string): Promise<ApiBill> {
    return authedRequest(`/api/bills/${id}/suspend`, { method: 'POST' });
  },

  async resume(id: string): Promise<ApiBill> {
    return authedRequest(`/api/bills/${id}/resume`, { method: 'POST' });
  },
};

export type ApiWithdrawal = { id: string; code: string; amount: number; expiresAt: string };

export const withdrawalsApi = {
  async create(amount: number): Promise<ApiWithdrawal> {
    return authedRequest('/api/withdrawals', { method: 'POST', body: JSON.stringify({ amount }) });
  },

  async cancel(id: string) {
    await authedRequest(`/api/withdrawals/${id}/cancel`, { method: 'POST' });
  },

  async renew(id: string): Promise<ApiWithdrawal> {
    return authedRequest(`/api/withdrawals/${id}/renew`, { method: 'POST' });
  },
};

export type QrPaymentReceipt = { transactionId: string; merchant: string; amount: number; createdAt: string };

export const qrApi = {
  async pay(merchant: string, amount: number): Promise<QrPaymentReceipt> {
    return authedRequest('/api/qr/pay', { method: 'POST', body: JSON.stringify({ merchant, amount }) });
  },
};

export type AuditClientEvent = {
  action: string;
  screen?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
};

export const auditApi = {
  async sendEvents(events: AuditClientEvent[]): Promise<void> {
    await authedRequest('/api/audit/events', { method: 'POST', body: JSON.stringify({ events }) });
  },
};

export const authApi = {
  async register(input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dni?: string;
    otpCode: string;
    dniPhoto?: string;
    selfie?: string;
  }) {
    const data: AuthResponse = await rawRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
    await saveTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async login(input: { email: string; password: string }) {
    const data: AuthResponse = await rawRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(input) });
    await saveTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async faceLogin(input: { email: string; selfie: string }) {
    const data: AuthResponse = await rawRequest('/api/auth/face-login', { method: 'POST', body: JSON.stringify(input) });
    await saveTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async me(): Promise<PublicUser> {
    return authedRequest('/api/auth/me');
  },

  async requestPasswordReset(email: string) {
    await rawRequest('/api/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async confirmPasswordReset(input: { email: string; code: string; newPassword: string }) {
    await rawRequest('/api/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify(input) });
  },

  async logout() {
    const refreshToken = await getRefreshToken();
    await clearTokens();
    if (refreshToken) {
      await rawRequest('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
    }
  },
};
