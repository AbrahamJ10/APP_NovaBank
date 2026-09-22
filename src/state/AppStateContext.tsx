import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationItem, Payee, ServiceBill, Session, Tx } from './types';
import { DniData } from '../lib/dni';
import {
  AccountSummary,
  accountApi,
  ApiBill,
  ApiNotification,
  ApiPayee,
  ApiTransaction,
  ApiError,
  authApi,
  billsApi,
  notificationsApi,
  payeesApi,
  profileApi,
  PublicUser,
  qrApi,
  securityApi,
  SecurityAlerts,
  SecuritySession,
  transactionsApi,
  transfersApi,
  withdrawalsApi,
  withTimeout,
} from '../lib/api';
import { getAccessToken, getLastEmail, getRefreshToken, saveLastAccount } from '../lib/secureTokens';

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatMemberSince(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function toLocalTx(t: ApiTransaction): Tx {
  const created = new Date(t.createdAt);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(created)) / 86_400_000);
  return {
    id: t.id,
    name: t.name,
    meta: t.meta,
    amount: t.amount,
    kind: t.kind,
    icon: t.icon,
    iconBg: t.iconBg,
    iconFg: t.iconFg,
    category: t.category as Tx['category'],
    daysAgo: Math.max(0, daysAgo),
    time: created.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  };
}

function toLocalNotification(n: ApiNotification): NotificationItem {
  const created = new Date(n.createdAt);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(created)) / 86_400_000);
  const group: NotificationItem['group'] = daysAgo <= 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : 'Esta semana';
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    icon: n.icon,
    iconBg: n.iconBg,
    iconFg: n.iconFg,
    unread: n.unread,
    group,
    time: created.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  };
}

function toLocalPayee(p: ApiPayee): Payee {
  return { id: p.id, name: p.name, bank: p.bank, account: p.accountNumber, initials: p.initials, inactive: p.inactive };
}

function toLocalBill(b: ApiBill): ServiceBill {
  const due = new Date(b.dueDate);
  const now = new Date();
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  const period = due.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  return {
    id: b.id,
    billerKey: b.billerKey,
    supplyNumber: b.supplyNumber,
    name: b.name,
    meta: b.meta,
    icon: b.icon,
    amount: b.amount,
    due: b.paid ? 'Al día' : `Vence ${due.getDate()} ${due.toLocaleDateString('es-PE', { month: 'short' })}`,
    dueColor: b.paid ? 'ok' : daysUntil <= 5 ? 'warn' : 'ok',
    period: period.charAt(0).toUpperCase() + period.slice(1),
    expiry: due.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
    consumption: b.consumption ?? '',
    paid: b.paid,
    suspended: b.suspended,
  };
}

const SESSION_CHECK_TIMEOUT_MS = 12_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'NB'
  );
}

function applyApiUser(u: User, apiUser: PublicUser): User {
  return {
    ...u,
    name: apiUser.fullName,
    initials: initialsOf(apiUser.fullName),
    email: apiUser.email,
    dni: apiUser.dni ?? u.dni,
    phone: apiUser.phone ?? u.phone,
    // The server never returns the password (it's hashed); this field now
    // only backs the local-only "change password" mock UI in ProfileScreen.
    password: '',
  };
}

type User = {
  name: string;
  initials: string;
  email: string;
  dni: string;
  phone: string;
  password: string;
  accountNumber: string;
  cci: string;
  memberSince: string;
  cardNumber: string;
  cardExpiry: string;
};

type OtpPurpose = 'register' | 'transfer' | 'recover' | 'edit' | null;

export type TransferReceipt = {
  amount: number;
  payee: Payee;
  concept: string;
  reference: string;
  date: string;
  rejected: boolean;
  reasonCode?: string;
  reasonLabel?: string;
};

const defaultUser: User = {
  name: 'Ana Quispe Rojas',
  initials: 'AQ',
  email: 'ana.quispe@gmail.com',
  dni: '72481903',
  phone: '987214550',
  password: 'NovaBank2026',
  accountNumber: '191-7734-2201',
  cci: '002-191-00177342201-45',
  memberSince: 'marzo 2024',
  cardNumber: '4417 8820 1134 2201',
  cardExpiry: '09/29',
};

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function genReference() {
  return 'NV-' + Math.floor(100 + Math.random() * 900) + ' ' + Math.floor(1000 + Math.random() * 9000) + ' ' + Math.floor(1000 + Math.random() * 9000);
}
function fmtNow() {
  const d = new Date();
  return d.toLocaleDateString('es-PE') + ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function useAppStateInternal() {
  const [now, setNow] = useState(Date.now());

  const [session, setSession] = useState<Session>('checking');
  const [expired, setExpired] = useState(false);
  const [user, setUser] = useState<User>(defaultUser);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const [available, setAvailable] = useState(0);
  const [held, setHeld] = useState(0);
  const [creditLine, setCreditLine] = useState(0);
  const [cardDebt, setCardDebt] = useState(0);
  const [minPayment, setMinPayment] = useState(0);
  const [cutDate, setCutDate] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [services, setServices] = useState<ServiceBill[]>([]);

  const [cardBlocked, setCardBlocked] = useState(false);
  const [panicMode, setPanicMode] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const [otp, setOtp] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(null);
  const [otpDeadline, setOtpDeadline] = useState<number>(0);
  const [otpContext, setOtpContext] = useState<any>(null);

  const [limitOnline, setLimitOnline] = useState(1500);
  const [limitAtm, setLimitAtm] = useState(700);
  const [geoPeru, setGeoPeru] = useState(true);
  const [geoIntl, setGeoIntl] = useState(false);
  const [alerts, setAlerts] = useState<SecurityAlerts>({ compra: true, retiro: true, login: true, promo: false });
  const [sessions, setSessions] = useState<SecuritySession[]>([]);

  const [withdraw, setWithdraw] = useState<{ id: string; code: string; qr: string; deadline: number; amount: number } | null>(null);
  const [scannedDni, setScannedDni] = useState<DniData | null>(null);
  const [dniFrontPhoto, setDniFrontPhoto] = useState<string | null>(null);
  const [frontDniNumber, setFrontDniNumber] = useState<string | null>(null);
  const [pendingSelfie, setPendingSelfie] = useState<string | null>(null);

  const lastActivity = useRef(Date.now());
  const touch = useCallback(() => {
    lastActivity.current = Date.now();
    if (expired) setExpired(false);
  }, [expired]);

  // Shared by the cold-start check below and by the login screen's
  // biometric button: if a still-valid session is sitting in storage, this
  // is what actually restores it. Biometric success alone never talks to
  // the backend — it just gates whether this runs, same as typing a
  // password would gate a fresh login() call.
  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
      if (!accessToken && !refreshToken) return false;
      const apiUser = await withTimeout(authApi.me(), SESSION_CHECK_TIMEOUT_MS);
      setUser((u) => applyApiUser(u, apiUser));
      setSession('in');
      touch();
      return true;
    } catch {
      return false;
    }
  }, [touch]);

  const applyAccountSummary = useCallback((summary: AccountSummary) => {
    setAvailable(summary.availableBalance);
    setHeld(summary.heldBalance);
    setCreditLine(summary.creditLine);
    setCardDebt(summary.cardDebt);
    setMinPayment(summary.minPayment);
    setCutDate(summary.cutDate);
    setCardBlocked(summary.cardBlocked);
    setUser((u) => ({
      ...u,
      accountNumber: summary.accountNumber,
      cci: summary.cci,
      cardNumber: summary.cardNumber,
      cardExpiry: summary.cardExpiry,
      memberSince: formatMemberSince(summary.memberSince),
    }));
  }, []);

  // Pulls the real balance/card/transactions ledger from the backend —
  // called once the session is actually in (see the effect below), and
  // exposed so any screen that changes the account can ask for a fresh copy.
  const refreshAccount = useCallback(async () => {
    setAccountLoading(true);
    try {
      const [summary, txs, notifs, payeeList, billList] = await Promise.all([
        accountApi.get(),
        transactionsApi.list(50),
        notificationsApi.list(50),
        payeesApi.list(),
        billsApi.list(),
      ]);
      applyAccountSummary(summary);
      setTransactions(txs.map(toLocalTx));
      setNotifications(notifs.map(toLocalNotification));
      setPayees(payeeList.map(toLocalPayee));
      setServices(billList.map(toLocalBill));
    } catch {
      // Leave whatever was last loaded in place — a transient failure here
      // shouldn't blank out the home screen the user is looking at.
    } finally {
      setAccountLoading(false);
    }
  }, [applyAccountSummary]);

  useEffect(() => {
    if (session === 'in') refreshAccount();
  }, [session, refreshAccount]);

  // Security Center data (alerts/limits/sessions) is only fetched when a
  // screen that actually shows it mounts, rather than on every
  // refreshAccount — it doesn't back anything on the Home screen.
  const loadSecurity = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      const [alertsRes, limitsRes, sessionsRes] = await Promise.all([
        securityApi.getAlerts(),
        securityApi.getLimits(),
        refreshToken ? securityApi.listSessions(refreshToken) : Promise.resolve([]),
      ]);
      setAlerts(alertsRes);
      setLimitOnline(limitsRes.limitOnline);
      setLimitAtm(limitsRes.limitAtm);
      setGeoPeru(limitsRes.geoPeru);
      setGeoIntl(limitsRes.geoIntl);
      setSessions(sessionsRes);
    } catch {
      // Leave whatever was last loaded in place.
    }
  }, []);

  const saveAlerts = useCallback(async (next: SecurityAlerts) => {
    const prev = alerts;
    setAlerts(next); // optimistic
    try {
      const saved = await securityApi.updateAlerts(next);
      setAlerts(saved);
    } catch {
      setAlerts(prev);
    }
  }, [alerts]);

  const saveLimits = useCallback(async (next: { limitOnline: number; limitAtm: number; geoPeru: boolean; geoIntl: boolean }) => {
    try {
      const saved = await securityApi.updateLimits(next);
      setLimitOnline(saved.limitOnline);
      setLimitAtm(saved.limitAtm);
      setGeoPeru(saved.geoPeru);
      setGeoIntl(saved.geoIntl);
    } catch {
      // Slider/toggle already reflects the attempted value locally; a
      // silent failure here just means it didn't persist this time.
    }
  }, []);

  const revokeSession = useCallback(async (id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id)); // optimistic
    try {
      await securityApi.revokeSession(id);
    } catch {
      loadSecurity();
    }
  }, [loadSecurity]);

  const revokeOtherSessions = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return;
    setSessions((s) => s.filter((x) => x.current)); // optimistic
    try {
      await securityApi.revokeOtherSessions(refreshToken);
    } catch {
      loadSecurity();
    }
  }, [loadSecurity]);

  // On cold start (and any time the app comes back from being closed or
  // backgrounded), always land on the login screen rather than silently
  // re-entering — same as any real banking app. A still-valid session sits
  // untouched in storage and the login screen shows its quick, name +
  // fingerprint mode for it (see restoreSession above), but actually
  // resuming it always takes an explicit fingerprint tap or password.
  useEffect(() => {
    setSession('out');
  }, []);

  // Inactivity watchdog: a lightweight interval that only touches state when
  // the 3-minute idle threshold is actually crossed, so normal typing never
  // triggers a re-render from this check. Tokens are left alone here on
  // purpose — this only locks the UI (drops to the login screen's quick,
  // fingerprint-eligible mode), it doesn't revoke the underlying session,
  // since the account is still "logged in" as far as the backend is
  // concerned and a valid device biometric should be enough to resume it.
  useEffect(() => {
    if (session !== 'in') return;
    const id = setInterval(() => {
      const idleMs = Date.now() - lastActivity.current;
      if (idleMs > 3 * 60 * 1000) {
        setExpired(true);
        setSession('out');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [session]);

  // `now` only needs to tick while a countdown is actually visible somewhere
  // (OTP resend, login lockout, cardless withdrawal code). Ticking it always
  // was re-rendering every screen every second, including mid-keystroke on
  // plain forms with no timer at all.
  const hasActiveTimer = otpDeadline > Date.now() || !!blockedUntil || !!withdraw;
  useEffect(() => {
    if (!hasActiveTimer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimer]);

  const blockLeft = blockedUntil ? Math.max(0, Math.round((blockedUntil - now) / 1000)) : 0;
  useEffect(() => {
    if (blockedUntil && blockLeft === 0) {
      setBlockedUntil(null);
      setAttempts(0);
    }
  }, [blockLeft, blockedUntil]);

  const otpLeft = Math.max(0, Math.round((otpDeadline - now) / 1000));

  const withdrawLeft = withdraw ? Math.max(0, Math.round((withdraw.deadline - now) / 1000)) : 0;
  const withdrawExpired = !!withdraw && withdrawLeft === 0;

  const startOtp = useCallback((purpose: OtpPurpose, ctx?: any) => {
    const code = genOtp();
    setOtp(code);
    setOtpPurpose(purpose);
    setOtpContext(ctx ?? null);
    setOtpDeadline(Date.now() + 60_000);
    return code;
  }, []);

  const resendOtp = useCallback(() => {
    const code = genOtp();
    setOtp(code);
    setOtpDeadline(Date.now() + 60_000);
    return code;
  }, []);

  const verifyOtp = useCallback((code: string) => {
    return code.length === 6 && code === otp;
  }, [otp]);

  const beginRegister = useCallback((data: { name: string; email: string; dni: string; phone: string; password: string }) => {
    const u: User = {
      ...defaultUser,
      name: data.name || defaultUser.name,
      initials: initialsOf(data.name || defaultUser.name),
      email: data.email,
      dni: data.dni,
      phone: data.phone,
      password: data.password,
    };
    setPendingUser(u);
  }, []);

  const completeRegister = useCallback(async (otpCode: string): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!pendingUser) return { ok: false, message: 'No hay un registro en curso.' };
    try {
      const apiUser = await authApi.register({
        email: pendingUser.email,
        password: pendingUser.password,
        fullName: pendingUser.name,
        phone: pendingUser.phone,
        dni: pendingUser.dni,
        otpCode,
        dniPhoto: dniFrontPhoto ?? undefined,
        selfie: pendingSelfie ?? undefined,
      });
      setUser(applyApiUser(pendingUser, apiUser));
      // applyApiUser only carries over name/email/dni/phone — the real
      // account number/CCI/card only exist once the backend creates them
      // during register(), so pull them in now. Otherwise RegisterDoneScreen
      // (shown next, before `session` ever becomes 'in') would render
      // whatever fake placeholder values were sitting in defaultUser.
      await refreshAccount();
      await saveLastAccount(pendingUser.email, apiUser.fullName);
      setPendingUser(null);
      setDniFrontPhoto(null);
      setFrontDniNumber(null);
      setPendingSelfie(null);
      setAttempts(0);
      setBlockedUntil(null);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiError ? err.message : 'No se pudo crear la cuenta. Intenta de nuevo.' };
    }
  }, [pendingUser, dniFrontPhoto, pendingSelfie, refreshAccount]);

  const login = useCallback(async (identifier: string, password: string) => {
    if (blockedUntil && blockLeft > 0) return { ok: false as const, blocked: true };

    const trimmed = identifier.trim();
    if (!EMAIL_RE.test(trimmed)) {
      return { ok: false as const, blocked: false, message: 'Por ahora, ingresa con tu correo electrónico.' };
    }

    try {
      const apiUser = await authApi.login({ email: trimmed, password });
      setUser((u) => applyApiUser(u, apiUser));
      await saveLastAccount(trimmed, apiUser.fullName);
      setAttempts(0);
      setSession('in');
      touch();
      return { ok: true as const };
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        const lockedUntil = typeof err.details?.lockedUntil === 'string' ? Date.parse(err.details.lockedUntil) : Date.now() + 15 * 60 * 1000;
        setBlockedUntil(lockedUntil);
        return { ok: false as const, blocked: true };
      }
      const next = attempts + 1;
      setAttempts(next);
      const message = err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor. Intenta de nuevo.';
      return { ok: false as const, blocked: false, attempts: next, message };
    }
  }, [attempts, blockLeft, blockedUntil, touch]);

  // Face ID quick login: compares a fresh selfie against the reference
  // photos saved during registration (DNI photo + registration selfie),
  // for whichever account last signed in successfully on this device.
  const loginWithFace = useCallback(async (selfieBase64: string) => {
    if (blockedUntil && blockLeft > 0) return { ok: false as const, reason: 'blocked' as const };

    const email = await getLastEmail();
    if (!email) {
      return { ok: false as const, reason: 'noAccount' as const, message: 'Primero inicia sesión con tu contraseña en este dispositivo.' };
    }

    try {
      const apiUser = await authApi.faceLogin({ email, selfie: selfieBase64 });
      setUser((u) => applyApiUser(u, apiUser));
      await saveLastAccount(email, apiUser.fullName);
      setAttempts(0);
      setSession('in');
      touch();
      return { ok: true as const };
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        const lockedUntil = typeof err.details?.lockedUntil === 'string' ? Date.parse(err.details.lockedUntil) : Date.now() + 15 * 60 * 1000;
        setBlockedUntil(lockedUntil);
        return { ok: false as const, reason: 'blocked' as const };
      }
      if (err instanceof ApiError && err.status === 400) {
        return { ok: false as const, reason: 'notConfigured' as const, message: err.message };
      }
      const message = err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor. Intenta de nuevo.';
      return { ok: false as const, reason: 'noMatch' as const, message };
    }
  }, [blockLeft, blockedUntil, touch]);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    setSession('out');
    setExpired(false);
  }, []);

  const requestCardBlock = useCallback(async (next: boolean) => {
    setCardBlocked(next); // optimistic — reconciled from the server response
    try {
      const res = await accountApi.setCardBlocked(next);
      setCardBlocked(res.cardBlocked);
      return { ok: true as const };
    } catch (err) {
      setCardBlocked(!next); // revert on failure
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar la tarjeta. Intenta de nuevo.' };
    }
  }, []);

  // Real "lock everything": blocks the card server-side (same endpoint as
  // the Card screen's toggle) and revokes every other active session, so a
  // lost/stolen phone can't keep using a session opened elsewhere.
  const openPanic = useCallback(() => {
    setPanicMode(true);
    requestCardBlock(true);
    revokeOtherSessions();
  }, [requestCardBlock, revokeOtherSessions]);
  const closePanic = useCallback(() => {
    setPanicMode(false);
    requestCardBlock(false);
  }, [requestCardBlock]);

  // Only drives the local resend-countdown UI (see startRecover above) —
  // the real code is sent and verified against the backend.
  const requestTransferOtp = useCallback(async () => {
    try {
      await transfersApi.requestOtp();
      startOtp('transfer');
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo enviar el código. Intenta de nuevo.' };
    }
  }, [startOtp]);

  const addPayee = useCallback(async (input: { name: string; bank: string; accountNumber: string }) => {
    try {
      const created = await payeesApi.create(input);
      const payee = toLocalPayee(created);
      setPayees((p) => [...p, payee]);
      return payee;
    } catch {
      return null;
    }
  }, []);

  const executeTransfer = useCallback(
    async (payeeId: string, amount: number, concept: string, otpCode: string) => {
      try {
        const res = await transfersApi.execute({ payeeId, amount, concept, otpCode });
        const payee = payees.find((p) => p.id === payeeId) ?? {
          id: payeeId,
          name: res.payee.name,
          bank: res.payee.bank,
          account: res.payee.accountNumber,
          initials: initialsOf(res.payee.name),
        };
        const created = new Date(res.createdAt);
        const receipt: TransferReceipt = {
          amount: res.amount,
          payee,
          concept: res.concept,
          reference: res.reference,
          date: `${created.toLocaleDateString('es-PE')} · ${created.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
          rejected: false,
        };
        // Re-fetch rather than patch state locally — this is the one place
        // that actually moved real money, so the balance/history shown
        // afterward should come straight back from the ledger, not a guess.
        refreshAccount();
        return { ok: true as const, receipt };
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          const payee = payees.find((p) => p.id === payeeId)!;
          const details = err.details as Record<string, unknown> | undefined;
          const receipt: TransferReceipt = {
            amount,
            payee,
            concept,
            reference: '',
            date: fmtNow(),
            rejected: true,
            reasonCode: typeof details?.reasonCode === 'string' ? details.reasonCode : undefined,
            reasonLabel: typeof details?.reasonLabel === 'string' ? details.reasonLabel : err.message,
          };
          return { ok: true as const, receipt };
        }
        const message = err instanceof ApiError ? err.message : 'No se pudo completar la transferencia. Intenta de nuevo.';
        return { ok: false as const, message };
      }
    },
    [payees, refreshAccount]
  );

  // Only drives the local resend countdown UI now — the real code is sent
  // and verified against the backend (see authApi.requestPasswordReset /
  // confirmPasswordReset), this no longer generates a usable code itself.
  const startRecover = useCallback((identifier: string) => {
    startOtp('recover', { identifier });
  }, [startOtp]);

  // Profile field changes (email/phone/password) are confirmed with a real
  // code emailed to the account's current address — this only drives the
  // local resend-countdown UI, the code itself is generated and checked
  // server-side.
  const requestProfileOtp = useCallback(async () => {
    try {
      await profileApi.requestOtp();
      startOtp('edit');
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo enviar el código. Intenta de nuevo.' };
    }
  }, [startOtp]);

  const confirmEmailChange = useCallback(async (newEmail: string, otpCode: string) => {
    try {
      const apiUser = await profileApi.updateEmail(newEmail, otpCode);
      setUser((u) => applyApiUser(u, apiUser));
      await saveLastAccount(apiUser.email, apiUser.fullName);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar el correo. Intenta de nuevo.' };
    }
  }, []);

  const confirmPhoneChange = useCallback(async (newPhone: string, otpCode: string) => {
    try {
      const apiUser = await profileApi.updatePhone(newPhone, otpCode);
      setUser((u) => applyApiUser(u, apiUser));
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar el teléfono. Intenta de nuevo.' };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, otpCode: string) => {
    try {
      await profileApi.updatePassword(currentPassword, newPassword, otpCode);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar la contraseña. Intenta de nuevo.' };
    }
  }, []);

  // Cardless withdrawal: the amount is really debited server-side the
  // moment a code is generated (there's no real ATM network here to redeem
  // against later) — cancelling issues a real refund, renewing rotates the
  // code without moving money again.
  const generateWithdraw = useCallback(async (amount: number) => {
    try {
      const w = await withdrawalsApi.create(amount);
      setWithdraw({ id: w.id, code: w.code, qr: `NOVABANK|WD|${w.code}|${w.amount}`, deadline: new Date(w.expiresAt).getTime(), amount: w.amount });
      refreshAccount();
      return { ok: true as const };
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const details = err.details as Record<string, unknown> | undefined;
        return { ok: false as const, message: typeof details?.reasonLabel === 'string' ? details.reasonLabel : err.message };
      }
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo generar la clave. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const cancelWithdraw = useCallback(() => {
    if (!withdraw) return;
    const id = withdraw.id;
    setWithdraw(null); // optimistic
    withdrawalsApi.cancel(id).then(refreshAccount).catch(() => {});
  }, [withdraw, refreshAccount]);

  const renewWithdraw = useCallback(async () => {
    if (!withdraw) return;
    try {
      const w = await withdrawalsApi.renew(withdraw.id);
      setWithdraw({ id: w.id, code: w.code, qr: `NOVABANK|WD|${w.code}|${w.amount}`, deadline: new Date(w.expiresAt).getTime(), amount: w.amount });
    } catch {
      // leave the expired state as-is; the button stays available to retry
    }
  }, [withdraw]);

  const payBill = useCallback(async (billId: string) => {
    try {
      await billsApi.pay(billId);
      refreshAccount();
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo pagar el servicio. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const affiliateService = useCallback(async (billerKey: string, supplyNumber: string) => {
    try {
      const bill = await billsApi.affiliate(billerKey, supplyNumber);
      refreshAccount(); // pulls the (new or existing) bill into `services` too
      return { ok: true as const, bill: toLocalBill(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo consultar el servicio. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const suspendBill = useCallback(async (billId: string) => {
    try {
      const bill = await billsApi.suspend(billId);
      refreshAccount();
      return { ok: true as const, bill: toLocalBill(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo suspender el servicio. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const resumeBill = useCallback(async (billId: string) => {
    try {
      const bill = await billsApi.resume(billId);
      refreshAccount();
      return { ok: true as const, bill: toLocalBill(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo reactivar el servicio. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const payQr = useCallback(async (merchant: string, amount: number) => {
    try {
      const receipt = await qrApi.pay(merchant, amount);
      refreshAccount();
      return { ok: true as const, receipt };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo completar el pago. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const payCard = useCallback(async (amount: number) => {
    try {
      const summary = await accountApi.payCard(amount);
      applyAccountSummary(summary);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo procesar el pago. Intenta de nuevo.' };
    }
  }, [applyAccountSummary]);

  const revealCvv = useCallback(async (otpCode: string) => {
    try {
      const { cvv } = await accountApi.revealCvv(otpCode);
      return { ok: true as const, cvv };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo verificar el código. Intenta de nuevo.' };
    }
  }, []);

  const markAllNotifRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, unread: false })));
    notificationsApi.markAllRead().catch(() => {});
  }, []);
  const markNotifRead = useCallback((id: string) => {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, unread: false } : x)));
    notificationsApi.markRead(id).catch(() => {});
  }, []);
  const clearNotifications = useCallback(() => {
    setNotifications([]); // optimistic
    notificationsApi.deleteAll().catch(() => refreshAccount());
  }, [refreshAccount]);

  const toggleAlert = useCallback((key: keyof SecurityAlerts) => {
    saveAlerts({ ...alerts, [key]: !alerts[key] });
  }, [alerts, saveAlerts]);

  return {
    now, touch,
    session, setSession, expired, setExpired,
    user, pendingUser,
    available, held, creditLine, cardDebt, minPayment, cutDate, accountLoading, refreshAccount,
    transactions, payees, notifications, services,
    cardBlocked, requestCardBlock,
    panicMode, openPanic, closePanic,
    attempts, blockedUntil, blockLeft,
    otp, otpPurpose, otpLeft, otpContext, startOtp, resendOtp, verifyOtp, setOtpPurpose,
    beginRegister, completeRegister,
    login, loginWithFace, logout, restoreSession,
    requestTransferOtp, executeTransfer, addPayee,
    startRecover,
    requestProfileOtp, confirmEmailChange, confirmPhoneChange, changePassword,
    withdraw, withdrawLeft, withdrawExpired, generateWithdraw, cancelWithdraw, renewWithdraw,
    scannedDni, setScannedDni,
    dniFrontPhoto, setDniFrontPhoto,
    frontDniNumber, setFrontDniNumber,
    pendingSelfie, setPendingSelfie,
    payBill, payQr, payCard, revealCvv, affiliateService, suspendBill, resumeBill,
    markAllNotifRead, markNotifRead, clearNotifications,
    limitOnline, setLimitOnline, limitAtm, setLimitAtm, geoPeru, setGeoPeru, geoIntl, setGeoIntl,
    alerts, toggleAlert,
    sessions, loadSecurity, saveLimits, revokeSession, revokeOtherSessions,
  };
}

type AppState = ReturnType<typeof useAppStateInternal>;
const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const value = useAppStateInternal();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
