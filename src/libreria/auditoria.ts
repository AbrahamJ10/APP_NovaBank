import { auditApi, AuditClientEvent } from './api';

// Telemetría observada por el cliente (vistas de pantalla, toques de
// botón) que el backend no puede ver por sí mismo — se acumula en memoria
// y se envía periódicamente a POST /api/audit/events, que exige una sesión
// autenticada (ver modules/audit en el backend). Mejor esfuerzo: un envío
// fallido simplemente descarta el lote en vez de reintentar para siempre,
// así que esto nunca puede bloquear ni tumbar la app que está
// instrumentando.
const FLUSH_INTERVAL_MS = 8000;
const MAX_QUEUE = 50;

let queue: AuditClientEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let enabled = false;

async function flush() {
  if (!enabled || queue.length === 0) return;
  const batch = queue.splice(0, MAX_QUEUE);
  try {
    await auditApi.sendEvents(batch);
  } catch {
    // Descartado — sin conexión o sesión expirada, no vale la pena reintentar.
  }
}

export function rastrearEvento(action: string, opts?: { screen?: string; success?: boolean; metadata?: Record<string, unknown> }) {
  if (!enabled) return;
  queue.push({ action, screen: opts?.screen, success: opts?.success, metadata: opts?.metadata });
  if (queue.length >= MAX_QUEUE) flush();
}

// Se llama una vez que el usuario está autenticado — no tiene sentido
// encolar eventos (o pegarle a un endpoint que solo va a dar 401) mientras
// está desconectado.
export function iniciarSeguimientoAuditoria() {
  if (enabled) return;
  enabled = true;
  timer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function detenerSeguimientoAuditoria() {
  enabled = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  queue = [];
}
