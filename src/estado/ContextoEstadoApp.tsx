import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { NotificationItem, Payee, ServiceBill, Session, Tx } from './tipos';
import { DatosDni } from '../libreria/dni';
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
  verificationApi,
  withdrawalsApi,
  withTimeout,
} from '../libreria/api';
import { obtenerTokenAcceso, obtenerUltimoCorreo, obtenerTokenRefresco, guardarUltimaCuenta } from '../libreria/tokensSeguros';

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
  return { id: p.id, name: p.name, bank: p.bank, account: p.accountNumber, iniciales: p.initials, inactive: p.inactive };
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
    iniciales: inicialesDe(apiUser.fullName),
    email: apiUser.email,
    dni: apiUser.dni ?? u.dni,
    phone: apiUser.phone ?? u.phone,
    // El servidor nunca devuelve la contraseña (está hasheada) — este campo
    // es solo un lugar transitorio en `usuarioPendiente` durante el registro
    // (ver iniciarRegistro/completarRegistro abajo), siempre vacío en el
    // usuario autenticado real. Los cambios reales de contraseña pasan por
    // profileApi.
    password: '',
  };
}

type Usuario = {
  name: string;
  iniciales: string;
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

export type ComprobanteTransferencia = {
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
  iniciales: 'AQ',
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

export function usarEstadoAppInterno() {
  const [ahora, setNow] = useState(Date.now());

  const [sesion, setSesion] = useState<Session>('checking');
  const [expirado, setExpirado] = useState(false);
  const [usuario, setUser] = useState<Usuario>(usuarioPorDefecto);
  const [usuarioPendiente, setPendingUser] = useState<Usuario | null>(null);

  const [disponible, setAvailable] = useState(0);
  const [retenido, setHeld] = useState(0);
  const [lineaCredito, setCreditLine] = useState(0);
  const [deudaTarjeta, setCardDebt] = useState(0);
  const [pagoMinimo, setMinPayment] = useState(0);
  const [fechaCorte, setCutDate] = useState('');
  const [cargandoCuenta, setAccountLoading] = useState(false);

  const [transacciones, setTransactions] = useState<Tx[]>([]);
  const [destinatarios, setPayees] = useState<Payee[]>([]);
  const [notificaciones, setNotifications] = useState<NotificationItem[]>([]);
  const [servicios, setServices] = useState<ServiceBill[]>([]);

  const [tarjetaBloqueada, setCardBlocked] = useState(false);
  const [modoPanico, setPanicMode] = useState(false);

  const [intentos, setAttempts] = useState(0);
  const [bloqueadoHasta, setBlockedUntil] = useState<number | null>(null);

  const [otp, setOtp] = useState<string | null>(null);
  const [propositoOtp, setPropositoOtp] = useState<PropositoOtp>(null);
  const [otpDeadline, setOtpDeadline] = useState<number>(0);
  const [contextoOtp, setOtpContext] = useState<any>(null);

  const [limiteEnLinea, setLimiteEnLinea] = useState(1500);
  const [limiteCajero, setLimiteCajero] = useState(700);
  const [geoPeru, setGeoPeru] = useState(true);
  const [geoInternacional, setGeoInternacional] = useState(false);
  const [alertas, setAlerts] = useState<SecurityAlerts>({ compra: true, retiro: true, login: true, promo: false });
  const [sesiones, setSessions] = useState<SecuritySession[]>([]);

  const [retiro, setWithdraw] = useState<{ id: string; code: string; qr: string; deadline: number; amount: number } | null>(null);
  const [dniEscaneado, setDniEscaneado] = useState<DatosDni | null>(null);
  const [fotoFrenteDni, setFotoFrenteDni] = useState<string | null>(null);
  const [numeroFrenteDni, setNumeroFrenteDni] = useState<string | null>(null);
  const [selfiePendiente, setSelfiePendiente] = useState<string | null>(null);
  // Se guarda el código apenas se verifica el correo en el formulario de
  // registro (mucho antes de terminar la captura de DNI/rostro), para
  // volver a enviarlo tal cual al completar el registro más adelante — el
  // backend lo valida otra vez ahí (y recién ahí lo consume).
  const [otpCorreoVerificado, setOtpCorreoVerificado] = useState<string | null>(null);

  const lastActivity = useRef(Date.now());
  const tocar = useCallback(() => {
    lastActivity.current = Date.now();
    if (expirado) setExpirado(false);
  }, [expirado]);

  // Compartido por la verificación de arranque en frío de abajo y por el
  // botón biométrico de la pantalla de iniciarSesion: si hay una sesión todavía
  // válida guardada, esto es lo que en realidad la restaura. El éxito
  // biométrico por sí solo nunca habla con el backend — solo controla si
  // esto se ejecuta, igual que escribir una contraseña controlaría una
  // llamada nueva a iniciarSesion().
  const restaurarSesion = useCallback(async (): Promise<boolean> => {
    try {
      const [accessToken, refreshToken] = await Promise.all([obtenerTokenAcceso(), obtenerTokenRefresco()]);
      if (!accessToken && !refreshToken) return false;
      const apiUser = await withTimeout(authApi.me(), TIEMPO_LIMITE_VERIFICACION_SESION_MS);
      setUser((u) => aplicarUsuarioApi(u, apiUser));
      setSesion('in');
      tocar();
      return true;
    } catch {
      return false;
    }
  }, [tocar]);

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
  const refrescarCuenta = useCallback(async () => {
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
    if (sesion === 'in') refrescarCuenta();
  }, [sesion, refrescarCuenta]);

  // Los datos de Centro de Seguridad (alertas/límites/sesiones) solo se
  // piden cuando se monta una pantalla que realmente los muestra, en vez de
  // en cada refrescarCuenta — no respaldan nada en la pantalla de Inicio.
  const cargarSeguridad = useCallback(async () => {
    try {
      const refreshToken = await obtenerTokenRefresco();
      const [alertsRes, limitsRes, sessionsRes] = await Promise.all([
        securityApi.getAlerts(),
        securityApi.getLimits(),
        refreshToken ? securityApi.listSessions(refreshToken) : Promise.resolve([]),
      ]);
      setAlerts(alertsRes);
      setLimiteEnLinea(limitsRes.limitOnline);
      setLimiteCajero(limitsRes.limitAtm);
      setGeoPeru(limitsRes.geoPeru);
      setGeoInternacional(limitsRes.geoIntl);
      setSessions(sessionsRes);
    } catch {
      // Se deja lo último que se cargó tal cual.
    }
  }, []);

  const saveAlerts = useCallback(async (next: SecurityAlerts) => {
    const prev = alertas;
    setAlerts(next); // optimistic
    try {
      const saved = await securityApi.updateAlerts(next);
      setAlerts(saved);
    } catch {
      setAlerts(prev);
    }
  }, [alertas]);

  const guardarLimites = useCallback(async (next: { limiteEnLinea: number; limiteCajero: number; geoPeru: boolean; geoInternacional: boolean }) => {
    try {
      const saved = await securityApi.updateLimits({
        limitOnline: next.limiteEnLinea,
        limitAtm: next.limiteCajero,
        geoPeru: next.geoPeru,
        geoIntl: next.geoInternacional,
      });
      setLimiteEnLinea(saved.limitOnline);
      setLimiteCajero(saved.limitAtm);
      setGeoPeru(saved.geoPeru);
      setGeoInternacional(saved.geoIntl);
    } catch {
      // El slider/interruptor ya refleja el valor intentado localmente; una
      // falla silenciosa aquí solo significa que no se guardó esta vez.
    }
  }, []);

  const revocarSesion = useCallback(async (id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id)); // optimistic
    try {
      await securityApi.revocarSesion(id);
    } catch {
      cargarSeguridad();
    }
  }, [cargarSeguridad]);

  const revocarOtrasSesiones = useCallback(async () => {
    const refreshToken = await obtenerTokenRefresco();
    if (!refreshToken) return;
    setSessions((s) => s.filter((x) => x.current)); // optimistic
    try {
      await securityApi.revocarOtrasSesiones(refreshToken);
    } catch {
      cargarSeguridad();
    }
  }, [cargarSeguridad]);

  // En un arranque en frío (y cada vez que la app vuelve de estar cerrada
  // o en segundo plano), siempre se aterriza en la pantalla de iniciarSesion en
  // vez de volver a entrar en silencio — igual que cualquier app bancaria
  // real. Una sesión todavía válida queda intacta en el almacenamiento y
  // la pantalla de iniciarSesion muestra su modo rápido de nombre + huella para
  // ella (ver restaurarSesion arriba), pero retomarla de verdad siempre
  // requiere un toque explícito de huella o la contraseña.
  useEffect(() => {
    setSesion('out');
  }, []);

  // Vigilante de inactividad: un intervalo ligero que solo toca el estado
  // cuando de verdad se cruza el umbral de 3 minutos de inactividad, para
  // que escribir normalmente nunca dispare un re-render por esta
  // verificación. Los tokens se dejan intactos a propósito aquí — esto solo
  // bloquea la interfaz (cae al modo rápido con huella de la pantalla de
  // iniciarSesion), no revoca la sesión de fondo, ya que la cuenta sigue "con
  // sesión iniciada" en lo que respecta al backend y una huella válida del
  // dispositivo debería bastar para retomarla.
  useEffect(() => {
    if (sesion !== 'in') return;
    const id = setInterval(() => {
      const idleMs = Date.now() - lastActivity.current;
      if (idleMs > 3 * 60 * 1000) {
        setExpirado(true);
        setSesion('out');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [sesion]);

  // `ahora` solo necesita avanzar mientras haya de verdad una cuenta
  // regresiva visible en algún lado (reenvío de OTP, bloqueo de iniciarSesion,
  // código de retiro sin tarjeta). Hacerlo avanzar siempre re-renderizaba
  // cada pantalla cada segundo, incluso a mitad de tecleo en formularios
  // simples sin ningún temporizador.
  const hasActiveTimer = otpDeadline > Date.now() || !!bloqueadoHasta || !!retiro;
  useEffect(() => {
    if (!hasActiveTimer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimer]);

  const tiempoBloqueoRestante = bloqueadoHasta ? Math.max(0, Math.round((bloqueadoHasta - ahora) / 1000)) : 0;
  useEffect(() => {
    if (bloqueadoHasta && tiempoBloqueoRestante === 0) {
      setBlockedUntil(null);
      setAttempts(0);
    }
  }, [tiempoBloqueoRestante, bloqueadoHasta]);

  const otpRestante = Math.max(0, Math.round((otpDeadline - ahora) / 1000));

  const retiroRestante = retiro ? Math.max(0, Math.round((retiro.deadline - ahora) / 1000)) : 0;
  const retiroExpirado = !!retiro && retiroRestante === 0;

  const iniciarOtp = useCallback((purpose: PropositoOtp, ctx?: any) => {
    const code = generarOtp();
    setOtp(code);
    setPropositoOtp(purpose);
    setOtpContext(ctx ?? null);
    setOtpDeadline(Date.now() + 60_000);
    return code;
  }, []);

  const reenviarOtp = useCallback(() => {
    const code = generarOtp();
    setOtp(code);
    setOtpDeadline(Date.now() + 60_000);
    return code;
  }, []);

  const verificarOtp = useCallback((code: string) => {
    return code.length === 6 && code === otp;
  }, [otp]);

  const iniciarRegistro = useCallback((data: { name: string; email: string; dni: string; phone: string; password: string }) => {
    const u: Usuario = {
      ...usuarioPorDefecto,
      name: data.name || usuarioPorDefecto.name,
      iniciales: inicialesDe(data.name || usuarioPorDefecto.name),
      email: data.email,
      dni: data.dni,
      phone: data.phone,
      password: data.password,
    };
    setPendingUser(u);
    setOtpCorreoVerificado(null);
  }, []);

  // Verificación temprana del correo, hecha en el propio formulario de
  // registro apenas se escribe — no consume el código en el servidor (ver
  // verificarOtpRegistroPrevio), solo confirma que es correcto y lo guarda
  // para reenviarlo tal cual cuando el registro se complete de verdad.
  const verificarCorreoRegistro = useCallback(async (correo: string, codigo: string): Promise<{ ok: true } | { ok: false; message: string }> => {
    try {
      await verificationApi.verifyRegisterOtp(correo, codigo);
      setOtpCorreoVerificado(codigo);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiError ? err.message : 'No se pudo verificar el código. Intenta de nuevo.' };
    }
  }, []);

  const completarRegistro = useCallback(async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!usuarioPendiente) return { ok: false, message: 'No hay un registro en curso.' };
    if (!otpCorreoVerificado) return { ok: false, message: 'Primero verifica tu correo.' };
    try {
      const apiUser = await authApi.register({
        email: usuarioPendiente.email,
        password: usuarioPendiente.password,
        fullName: usuarioPendiente.name,
        phone: usuarioPendiente.phone,
        dni: usuarioPendiente.dni,
        otpCode: otpCorreoVerificado,
        dniPhoto: fotoFrenteDni ?? undefined,
        selfie: selfiePendiente ?? undefined,
      });
      setUser(aplicarUsuarioApi(usuarioPendiente, apiUser));
      // aplicarUsuarioApi solo transfiere nombre/correo/dni/teléfono — el número
      // de cuenta/CCI/tarjeta reales solo existen una vez que el backend
      // los crea durante register(), así que se traen ahora. De lo
      // contrario PantallaRegistroCompleto (que se muestra a continuación, antes
      // de que `sesion` llegue a 'in') mostraría los valores falsos de
      // relleno que hubiera en usuarioPorDefecto.
      await refrescarCuenta();
      await guardarUltimaCuenta(usuarioPendiente.email, apiUser.fullName);
      setPendingUser(null);
      setFotoFrenteDni(null);
      setNumeroFrenteDni(null);
      setSelfiePendiente(null);
      setOtpCorreoVerificado(null);
      setAttempts(0);
      setBlockedUntil(null);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiError ? err.message : 'No se pudo crear la cuenta. Intenta de nuevo.' };
    }
  }, [usuarioPendiente, otpCorreoVerificado, fotoFrenteDni, selfiePendiente, refrescarCuenta]);

  const iniciarSesion = useCallback(async (identifier: string, password: string) => {
    if (bloqueadoHasta && tiempoBloqueoRestante > 0) return { ok: false as const, blocked: true };

    const trimmed = identifier.trim();
    if (!RE_CORREO.test(trimmed)) {
      return { ok: false as const, blocked: false, message: 'Por ahora, ingresa con tu correo electrónico.' };
    }

    try {
      const apiUser = await authApi.iniciarSesion({ email: trimmed, password });
      setUser((u) => aplicarUsuarioApi(u, apiUser));
      await guardarUltimaCuenta(trimmed, apiUser.fullName);
      setAttempts(0);
      setSesion('in');
      tocar();
      return { ok: true as const };
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        const lockedUntil = typeof err.details?.lockedUntil === 'string' ? Date.parse(err.details.lockedUntil) : Date.now() + 15 * 60 * 1000;
        setBlockedUntil(lockedUntil);
        return { ok: false as const, blocked: true };
      }
      const next = intentos + 1;
      setAttempts(next);
      const message = err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor. Intenta de nuevo.';
      return { ok: false as const, blocked: false, intentos: next, message };
    }
  }, [intentos, tiempoBloqueoRestante, bloqueadoHasta, tocar]);

  // Login rápido con Face ID: compara una selfie nueva contra las fotos de
  // referencia guardadas durante el registro (foto del DNI + selfie del
  // registro), para la cuenta que haya iniciado sesión con éxito por
  // última vez en este dispositivo.
  const iniciarSesionConRostro = useCallback(async (selfieBase64: string) => {
    if (bloqueadoHasta && tiempoBloqueoRestante > 0) return { ok: false as const, reason: 'blocked' as const };

    const email = await obtenerUltimoCorreo();
    if (!email) {
      return { ok: false as const, reason: 'noAccount' as const, message: 'Primero inicia sesión con tu contraseña en este dispositivo.' };
    }

    try {
      const apiUser = await authApi.faceLogin({ email, selfie: selfieBase64 });
      setUser((u) => aplicarUsuarioApi(u, apiUser));
      await guardarUltimaCuenta(email, apiUser.fullName);
      setAttempts(0);
      setSesion('in');
      tocar();
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
  }, [tiempoBloqueoRestante, bloqueadoHasta, tocar]);

  const cerrarSesion = useCallback(() => {
    authApi.cerrarSesion().catch(() => {});
    setSesion('out');
    setExpirado(false);
  }, []);

  const solicitarBloqueoTarjeta = useCallback(async (next: boolean) => {
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
  const abrirPanico = useCallback(() => {
    setPanicMode(true);
    solicitarBloqueoTarjeta(true);
    revocarOtrasSesiones();
  }, [solicitarBloqueoTarjeta, revocarOtrasSesiones]);
  const cerrarPanico = useCallback(() => {
    setPanicMode(false);
    solicitarBloqueoTarjeta(false);
  }, [solicitarBloqueoTarjeta]);

  // Solo controla la cuenta regresiva local de reenvío en la interfaz (ver
  // iniciarRecuperacion arriba) — el código real se envía y se verifica contra el
  // backend.
  const solicitarOtpTransferencia = useCallback(async () => {
    try {
      await transfersApi.requestOtp();
      iniciarOtp('transfer');
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo enviar el código. Intenta de nuevo.' };
    }
  }, [iniciarOtp]);

  const agregarDestinatario = useCallback(async (input: { name: string; bank: string; accountNumber: string }) => {
    try {
      const created = await payeesApi.create(input);
      const payee = aDestinatarioLocal(created);
      setPayees((p) => [...p, payee]);
      return payee;
    } catch {
      return null;
    }
  }, []);

  const ejecutarTransferencia = useCallback(
    async (payeeId: string, amount: number, concept: string, otpCode: string) => {
      try {
        const res = await transfersApi.execute({ payeeId, amount, concept, otpCode });
        const payee = destinatarios.find((p) => p.id === payeeId) ?? {
          id: payeeId,
          name: res.payee.name,
          bank: res.payee.bank,
          account: res.payee.accountNumber,
          iniciales: inicialesDe(res.payee.name),
        };
        const created = new Date(res.createdAt);
        const receipt: ComprobanteTransferencia = {
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
        refrescarCuenta();
        return { ok: true as const, receipt };
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          const payee = destinatarios.find((p) => p.id === payeeId)!;
          const details = err.details as Record<string, unknown> | undefined;
          const receipt: ComprobanteTransferencia = {
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
    [destinatarios, refrescarCuenta]
  );

  // Ahora solo controla la cuenta regresiva local de reenvío en la
  // interfaz — el código real se envía y se verifica contra el backend
  // (ver authApi.requestPasswordReset / confirmPasswordReset), esto ya no
  // genera un código utilizable por sí mismo.
  const iniciarRecuperacion = useCallback((identifier: string) => {
    iniciarOtp('recover', { identifier });
  }, [iniciarOtp]);

  // Los cambios de campos del perfil (correo/teléfono/contraseña) se
  // confirman con un código real enviado por correo a la dirección actual
  // de la cuenta — esto solo controla la cuenta regresiva local de reenvío
  // en la interfaz, el código en sí se genera y se revisa del lado del
  // servidor.
  const solicitarOtpPerfil = useCallback(async () => {
    try {
      await profileApi.requestOtp();
      iniciarOtp('edit');
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo enviar el código. Intenta de nuevo.' };
    }
  }, [iniciarOtp]);

  const confirmarCambioCorreo = useCallback(async (newEmail: string, otpCode: string) => {
    try {
      const apiUser = await profileApi.updateEmail(newEmail, otpCode);
      setUser((u) => aplicarUsuarioApi(u, apiUser));
      await guardarUltimaCuenta(apiUser.email, apiUser.fullName);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar el correo. Intenta de nuevo.' };
    }
  }, []);

  const confirmarCambioTelefono = useCallback(async (newPhone: string, otpCode: string) => {
    try {
      const apiUser = await profileApi.updatePhone(newPhone, otpCode);
      setUser((u) => aplicarUsuarioApi(u, apiUser));
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo actualizar el teléfono. Intenta de nuevo.' };
    }
  }, []);

  const cambiarContrasena = useCallback(async (currentPassword: string, newPassword: string, otpCode: string) => {
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
  const generarRetiro = useCallback(async (amount: number) => {
    try {
      const w = await withdrawalsApi.create(amount);
      setWithdraw({ id: w.id, code: w.code, qr: `NOVABANK|WD|${w.code}|${w.amount}`, deadline: new Date(w.expiresAt).getTime(), amount: w.amount });
      refrescarCuenta();
      return { ok: true as const };
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const details = err.details as Record<string, unknown> | undefined;
        return { ok: false as const, message: typeof details?.reasonLabel === 'string' ? details.reasonLabel : err.message };
      }
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo generar la clave. Intenta de nuevo.' };
    }
  }, [refrescarCuenta]);

  const cancelarRetiro = useCallback(() => {
    if (!retiro) return;
    const id = retiro.id;
    setWithdraw(null); // optimistic
    withdrawalsApi.cancel(id).then(refrescarCuenta).catch(() => {});
  }, [retiro, refrescarCuenta]);

  const renovarRetiro = useCallback(async () => {
    if (!retiro) return;
    try {
      const w = await withdrawalsApi.renew(retiro.id);
      setWithdraw({ id: w.id, code: w.code, qr: `NOVABANK|WD|${w.code}|${w.amount}`, deadline: new Date(w.expiresAt).getTime(), amount: w.amount });
    } catch {
      // se deja el estado expirado tal cual; el botón sigue disponible para reintentar
    }
  }, [retiro]);

  const pagarRecibo = useCallback(async (billId: string) => {
    try {
      await billsApi.pay(billId);
      refrescarCuenta();
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo pagar el servicio. Intenta de nuevo.' };
    }
  }, [refrescarCuenta]);

  const afiliarServicio = useCallback(async (billerKey: string, supplyNumber: string) => {
    try {
      const bill = await billsApi.affiliate(billerKey, supplyNumber);
      refrescarCuenta(); // pulls the (new or existing) bill into `servicios` too
      return { ok: true as const, bill: aReciboLocal(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo consultar el servicio. Intenta de nuevo.' };
    }
  }, [refrescarCuenta]);

  const suspenderRecibo = useCallback(async (billId: string) => {
    try {
      const bill = await billsApi.suspend(billId);
      refrescarCuenta();
      return { ok: true as const, bill: aReciboLocal(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo suspender el servicio. Intenta de nuevo.' };
    }
  }, [refrescarCuenta]);

  const reanudarRecibo = useCallback(async (billId: string) => {
    try {
      const bill = await billsApi.resume(billId);
      refrescarCuenta();
      return { ok: true as const, bill: aReciboLocal(bill) };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo reactivar el servicio. Intenta de nuevo.' };
    }
  }, [refrescarCuenta]);

  const pagarQr = useCallback(async (merchant: string, amount: number) => {
    try {
      const receipt = await qrApi.pay(merchant, amount);
      refrescarCuenta();
      return { ok: true as const, receipt };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo completar el pago. Intenta de nuevo.' };
    }
  }, [refrescarCuenta]);

  const pagarTarjeta = useCallback(async (amount: number) => {
    try {
      const summary = await accountApi.pagarTarjeta(amount);
      applyAccountSummary(summary);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo procesar el pago. Intenta de nuevo.' };
    }
  }, [applyAccountSummary]);

  const revelarCvv = useCallback(async (otpCode: string) => {
    try {
      const { cvv } = await accountApi.revelarCvv(otpCode);
      return { ok: true as const, cvv };
    } catch (err) {
      return { ok: false as const, message: err instanceof ApiError ? err.message : 'No se pudo verificar el código. Intenta de nuevo.' };
    }
  }, []);

  const marcarTodasNotifLeidas = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, unread: false })));
    notificationsApi.markAllRead().catch(() => {});
  }, []);
  const marcarNotifLeida = useCallback((id: string) => {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, unread: false } : x)));
    notificationsApi.markRead(id).catch(() => {});
  }, []);
  const limpiarNotificaciones = useCallback(() => {
    setNotifications([]); // optimistic
    notificationsApi.deleteAll().catch(() => refrescarCuenta());
  }, [refrescarCuenta]);

  const alternarAlerta = useCallback((key: keyof SecurityAlerts) => {
    saveAlerts({ ...alertas, [key]: !alertas[key] });
  }, [alertas, saveAlerts]);

  return {
    ahora, tocar,
    sesion, setSesion, expirado, setExpirado,
    usuario, usuarioPendiente,
    disponible, retenido, lineaCredito, deudaTarjeta, pagoMinimo, fechaCorte, cargandoCuenta, refrescarCuenta,
    transacciones, destinatarios, notificaciones, servicios,
    tarjetaBloqueada, solicitarBloqueoTarjeta,
    modoPanico, abrirPanico, cerrarPanico,
    intentos, bloqueadoHasta, tiempoBloqueoRestante,
    otp, propositoOtp, otpRestante, contextoOtp, iniciarOtp, reenviarOtp, verificarOtp, setPropositoOtp,
    iniciarRegistro, completarRegistro, verificarCorreoRegistro, otpCorreoVerificado,
    iniciarSesion, iniciarSesionConRostro, cerrarSesion, restaurarSesion,
    solicitarOtpTransferencia, ejecutarTransferencia, agregarDestinatario,
    iniciarRecuperacion,
    solicitarOtpPerfil, confirmarCambioCorreo, confirmarCambioTelefono, cambiarContrasena,
    retiro, retiroRestante, retiroExpirado, generarRetiro, cancelarRetiro, renovarRetiro,
    dniEscaneado, setDniEscaneado,
    fotoFrenteDni, setFotoFrenteDni,
    numeroFrenteDni, setNumeroFrenteDni,
    selfiePendiente, setSelfiePendiente,
    pagarRecibo, pagarQr, pagarTarjeta, revelarCvv, afiliarServicio, suspenderRecibo, reanudarRecibo,
    marcarTodasNotifLeidas, marcarNotifLeida, limpiarNotificaciones,
    limiteEnLinea, setLimiteEnLinea, limiteCajero, setLimiteCajero, geoPeru, setGeoPeru, geoInternacional, setGeoInternacional,
    alertas, alternarAlerta,
    sesiones, cargarSeguridad, guardarLimites, revocarSesion, revocarOtrasSesiones,
  };
}

type AppState = ReturnType<typeof usarEstadoAppInterno>;
const Ctx = createContext<AppState | null>(null);

export function ProveedorEstadoApp({ children }: { children: React.ReactNode }) {
  const value = usarEstadoAppInterno();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usarEstadoApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usarEstadoApp must be used within ProveedorEstadoApp');
  return ctx;
}
