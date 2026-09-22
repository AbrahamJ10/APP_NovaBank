import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatearMiembroDesde(iso: string) {
  const fecha = new Date(iso);
  return `${MESES_ES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

function aTransaccionLocal(t: ApiTransaction): Tx {
  const creada = new Date(t.createdAt);
  const ahora = new Date();
  const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diasAtras = Math.round((inicioDelDia(ahora) - inicioDelDia(creada)) / 86_400_000);
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
    daysAgo: Math.max(0, diasAtras),
    time: creada.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  };
}

function aNotificacionLocal(n: ApiNotification): NotificationItem {
  const creada = new Date(n.createdAt);
  const ahora = new Date();
  const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diasAtras = Math.round((inicioDelDia(ahora) - inicioDelDia(creada)) / 86_400_000);
  const grupo: NotificationItem['group'] = diasAtras <= 0 ? 'Hoy' : diasAtras === 1 ? 'Ayer' : 'Esta semana';
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    icon: n.icon,
    iconBg: n.iconBg,
    iconFg: n.iconFg,
    unread: n.unread,
    group: grupo,
    time: creada.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  };
}

function aDestinatarioLocal(p: ApiPayee): Payee {
  return { id: p.id, name: p.name, bank: p.bank, account: p.accountNumber, initials: p.initials, inactive: p.inactive };
}

function aReciboLocal(b: ApiBill): ServiceBill {
  const vencimiento = new Date(b.dueDate);
  const ahora = new Date();
  const diasHasta = Math.ceil((vencimiento.getTime() - ahora.getTime()) / 86_400_000);
  const periodo = vencimiento.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  return {
    id: b.id,
    billerKey: b.billerKey,
    supplyNumber: b.supplyNumber,
    name: b.name,
    meta: b.meta,
    icon: b.icon,
    amount: b.amount,
    due: b.paid ? 'Al día' : `Vence ${vencimiento.getDate()} ${vencimiento.toLocaleDateString('es-PE', { month: 'short' })}`,
    dueColor: b.paid ? 'ok' : diasHasta <= 5 ? 'warn' : 'ok',
    period: periodo.charAt(0).toUpperCase() + periodo.slice(1),
    expiry: vencimiento.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
    consumption: b.consumption ?? '',
    paid: b.paid,
    suspended: b.suspended,
  };
}

const TIEMPO_LIMITE_VERIFICACION_SESION_MS = 12_000;
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inicialesDe(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'NB'
  );
}

function aplicarUsuarioApi(u: Usuario, apiUser: PublicUser): Usuario {
  return {
    ...u,
    name: apiUser.fullName,
    initials: inicialesDe(apiUser.fullName),
    email: apiUser.email,
    dni: apiUser.dni ?? u.dni,
    phone: apiUser.phone ?? u.phone,
    // El servidor nunca devuelve la contraseña (está hasheada) — este campo
    // es solo un lugar transitorio en `pendingUser` durante el registro
    // (ver beginRegister/completeRegister abajo), siempre vacío en el
    // usuario autenticado real. Los cambios reales de contraseña pasan por
    // profileApi.
    password: '',
  };
}

type Usuario = {
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

type PropositoOtp = 'register' | 'transfer' | 'recover' | 'edit' | null;

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

const usuarioPorDefecto: Usuario = {
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

function generarOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function formatearAhora() {
  const fecha = new Date();
  return fecha.toLocaleDateString('es-PE') + ' · ' + fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function useAppStateInternal() {
  const [now, setNow] = useState(Date.now());

  const [session, setSession] = useState<Session>('checking');
  const [expired, setExpired] = useState(false);
  const [user, setUser] = useState<Usuario>(usuarioPorDefecto);
  const [pendingUser, setPendingUser] = useState<Usuario | null>(null);

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
  const [otpPurpose, setOtpPurpose] = useState<PropositoOtp>(null);
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

  // Compartido por la verificación de arranque en frío de abajo y por el
  // botón biométrico de la pantalla de login: si hay una sesión todavía
  // válida guardada, esto es lo que en realidad la restaura. El éxito
  // biométrico por sí solo nunca habla con el backend — solo controla si
  // esto se ejecuta, igual que escribir una contraseña controlaría una
  // llamada nueva a login().
  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
      if (!accessToken && !refreshToken) return false;
      const apiUser = await withTimeout(authApi.me(), TIEMPO_LIMITE_VERIFICACION_SESION_MS);
      setUser((u) => aplicarUsuarioApi(u, apiUser));
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
      memberSince: formatearMiembroDesde(summary.memberSince),
    }));
  }, []);

  // Trae el saldo/tarjeta/historial de transacciones reales del backend —
  // se llama una vez que la sesión ya está activa (ver el efecto de abajo),
  // y se expone para que cualquier pantalla que cambie la cuenta pueda
  // pedir una copia fresca.
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
      setTransactions(txs.map(aTransaccionLocal));
      setNotifications(notifs.map(aNotificacionLocal));
      setPayees(payeeList.map(aDestinatarioLocal));
      setServices(billList.map(aReciboLocal));
    } catch {
      // Se deja lo último que se cargó tal cual — una falla pasajera aquí
      // no debería dejar en blanco la pantalla de inicio que el usuario
      // está viendo.
    } finally {
      setAccountLoading(false);
    }
  }, [applyAccountSummary]);

  useEffect(() => {
    if (session === 'in') refreshAccount();
  }, [session, refreshAccount]);

  // Los datos de Centro de Seguridad (alertas/límites/sesiones) solo se
  // piden cuando se monta una pantalla que realmente los muestra, en vez de
  // en cada refreshAccount — no respaldan nada en la pantalla de Inicio.
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
      // Se deja lo último que se cargó tal cual.
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
      // El slider/interruptor ya refleja el valor intentado localmente; una
      // falla silenciosa aquí solo significa que no se guardó esta vez.
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

  // En un arranque en frío (y cada vez que la app vuelve de estar cerrada
  // o en segundo plano), siempre se aterriza en la pantalla de login en
  // vez de volver a entrar en silencio — igual que cualquier app bancaria
  // real. Una sesión todavía válida queda intacta en el almacenamiento y
  // la pantalla de login muestra su modo rápido de nombre + huella para
  // ella (ver restoreSession arriba), pero retomarla de verdad siempre
  // requiere un toque explícito de huella o la contraseña.
  useEffect(() => {
    setSession('out');
  }, []);

  // Vigilante de inactividad: un intervalo ligero que solo toca el estado
  // cuando de verdad se cruza el umbral de 3 minutos de inactividad, para
  // que escribir normalmente nunca dispare un re-render por esta
  // verificación. Los tokens se dejan intactos a propósito aquí — esto solo
  // bloquea la interfaz (cae al modo rápido con huella de la pantalla de
  // login), no revoca la sesión de fondo, ya que la cuenta sigue "con
  // sesión iniciada" en lo que respecta al backend y una huella válida del
  // dispositivo debería bastar para retomarla.
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

  // `now` solo necesita avanzar mientras haya de verdad una cuenta
  // regresiva visible en algún lado (reenvío de OTP, bloqueo de login,
  // código de retiro sin tarjeta). Hacerlo avanzar siempre re-renderizaba
  // cada pantalla cada segundo, incluso a mitad de tecleo en formularios
  // simples sin ningún temporizador.
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

  const startOtp = useCallback((purpose: PropositoOtp, ctx?: any) => {
    const code = generarOtp();
    setOtp(code);
    setOtpPurpose(purpose);
    setOtpContext(ctx ?? null);
    setOtpDeadline(Date.now() + 60_000);
    return code;
  }, []);

  const resendOtp = useCallback(() => {
    const code = generarOtp();
    setOtp(code);
    setOtpDeadline(Date.now() + 60_000);
    return code;
  }, []);

  const verifyOtp = useCallback((code: string) => {
    return code.length === 6 && code === otp;
  }, [otp]);

  const beginRegister = useCallback((data: { name: string; email: string; dni: string; phone: string; password: string }) => {
    const u: Usuario = {
      ...usuarioPorDefecto,
      name: data.name || usuarioPorDefecto.name,
      initials: inicialesDe(data.name || usuarioPorDefecto.name),
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
      setUser(aplicarUsuarioApi(pendingUser, apiUser));
      // aplicarUsuarioApi solo transfiere nombre/correo/dni/teléfono — el número
      // de cuenta/CCI/tarjeta reales solo existen una vez que el backend
      // los crea durante register(), así que se traen ahora. De lo
      // contrario RegisterDoneScreen (que se muestra a continuación, antes
      // de que `session` llegue a 'in') mostraría los valores falsos de
      // relleno que hubiera en usuarioPorDefecto.
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
    if (!RE_CORREO.test(trimmed)) {
      return { ok: false as const, blocked: false, message: 'Por ahora, ingresa con tu correo electrónico.' };
    }

    try {
      const apiUser = await authApi.login({ email: trimmed, password });
      setUser((u) => aplicarUsuarioApi(u, apiUser));
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

  // Login rápido con Face ID: compara una selfie nueva contra las fotos de
  // referencia guardadas durante el registro (foto del DNI + selfie del
  // registro), para la cuenta que haya iniciado sesión con éxito por
  // última vez en este dispositivo.
  const loginWithFace = useCallback(async (selfieBase64: string) => {
    if (blockedUntil && blockLeft > 0) return { ok: false as const, reason: 'blocked' as const };

    const email = await getLastEmail();
    if (!email) {
      return { ok: false as const, reason: 'noAccount' as const, message: 'Primero inicia sesión con tu contraseña en este dispositivo.' };
    }

    try {
      const apiUser = await authApi.faceLogin({ email, selfie: selfieBase64 });
      setUser((u) => aplicarUsuarioApi(u, apiUser));
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

  // "Bloquear todo" real: bloquea la tarjeta del lado del servidor (el
  // mismo endpoint que el interruptor de la pantalla de Tarjeta) y revoca
  // cualquier otra sesión activa, para que un celular perdido/robado no
  // pueda seguir usando una sesión abierta en otro lado.
  const openPanic = useCallback(() => {
    setPanicMode(true);
    requestCardBlock(true);
    revokeOtherSessions();
  }, [requestCardBlock, revokeOtherSessions]);
  const closePanic = useCallback(() => {
    setPanicMode(false);
    requestCardBlock(false);
  }, [requestCardBlock]);

  // Solo controla la cuenta regresiva local de reenvío en la interfaz (ver
  // startRecover arriba) — el código real se envía y se verifica contra el
  // backend.
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
      const payee = aDestinatarioLocal(created);
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
          initials: inicialesDe(res.payee.name),
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
        // Se vuelve a pedir en vez de parchar el estado localmente — este
        // es el único lugar que de verdad movió dinero real, así que el
        // saldo/historial mostrado después debe venir directo del libro
        // contable, no de una suposición.
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
            date: formatearAhora(),
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

  // Ahora solo controla la cuenta regresiva local de reenvío en la
  // interfaz — el código real se envía y se verifica contra el backend
  // (ver authApi.requestPasswordReset / confirmPasswordReset), esto ya no
  // genera un código utilizable por sí mismo.
  const startRecover = useCallback((identifier: string) => {
    startOtp('recover', { identifier });
  }, [startOtp]);

  // Los cambios de campos del perfil (correo/teléfono/contraseña) se
  // confirman con un código real enviado por correo a la dirección actual
  // de la cuenta — esto solo controla la cuenta regresiva local de reenvío
  // en la interfaz, el código en sí se genera y se revisa del lado del
  // servidor.
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
      setUser((u) => aplicarUsuarioApi(u, apiUser));
      await saveLastAccount(apiUser.email, apiUser.fullName);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar el correo. Intenta de nuevo.' };
    }
  }, []);

  const confirmPhoneChange = useCallback(async (newPhone: string, otpCode: string) => {
    try {
      const apiUser = await profileApi.updatePhone(newPhone, otpCode);
      setUser((u) => aplicarUsuarioApi(u, apiUser));
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

  // Retiro sin tarjeta: el monto de verdad se debita del lado del servidor
  // en el momento en que se genera un código (aquí no hay una red de
  // cajeros real contra la cual canjearlo después) — cancelar emite un
  // reembolso real, renovar rota el código sin mover dinero de nuevo.
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
      // se deja el estado expirado tal cual; el botón sigue disponible para reintentar
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
      return { ok: true as const, bill: aReciboLocal(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo consultar el servicio. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const suspendBill = useCallback(async (billId: string) => {
    try {
      const bill = await billsApi.suspend(billId);
      refreshAccount();
      return { ok: true as const, bill: aReciboLocal(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo suspender el servicio. Intenta de nuevo.' };
    }
  }, [refreshAccount]);

  const resumeBill = useCallback(async (billId: string) => {
    try {
      const bill = await billsApi.resume(billId);
      refreshAccount();
      return { ok: true as const, bill: aReciboLocal(bill) };
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
