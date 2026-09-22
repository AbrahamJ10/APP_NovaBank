import { auditApi, AuditClientEvent } from './api';

// Client-observed telemetry (screen views, button taps) the backend can't
// see for itself — batched in memory and flushed periodically to
// POST /api/audit/events, which requires an authenticated session (see
// modules/audit on the backend). Best-effort: a failed flush just drops the
// batch rather than retrying forever, so this can never block or crash the
// app it's instrumenting.
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
    // Dropped — offline or session expired, not worth retrying.
  }
}

export function trackEvent(action: string, opts?: { screen?: string; success?: boolean; metadata?: Record<string, unknown> }) {
  if (!enabled) return;
  queue.push({ action, screen: opts?.screen, success: opts?.success, metadata: opts?.metadata });
  if (queue.length >= MAX_QUEUE) flush();
}

// Called once the user is authenticated — no point queuing events (or
// hitting an endpoint that will just 401) while logged out.
export function startAuditTracking() {
  if (enabled) return;
  enabled = true;
  timer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function stopAuditTracking() {
  enabled = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  queue = [];
}
