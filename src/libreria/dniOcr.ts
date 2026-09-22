import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';

export type AnalisisFrenteDni = {
  dni: string | null;
  birthDate: string | null; // normalizado DD/MM/YYYY
  age: number | null;
};

// Acepta "DD MM YYYY" (DNI electrónico), "DD/MM/YYYY" o "DD-MM-YYYY" (DNI
// azul / variación del OCR).
const DATE_RE = /\b(\d{2})[\s\/\-.](\d{2})[\s\/\-.](\d{4})\b/g;
const EIGHT_DIGITS_RE = /\b\d{8}\b/;
const DNI_LABEL_RE = /\bCUI\b|\bDNI\b/i;

function linesInReadingOrder(result: TextRecognitionResult): string[] {
  const lines: string[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) lines.push(line.text);
  }
  return lines;
}

type ParsedDate = { raw: string; dd: number; mm: number; yyyy: number };

function findAllValidDates(text: string): ParsedDate[] {
  const dates: ParsedDate[] = [];
  const nowYear = new Date().getFullYear();
  let match: RegExpExecArray | null;
  DATE_RE.lastIndex = 0;
  while ((match = DATE_RE.exec(text))) {
    const dd = Number(match[1]);
    const mm = Number(match[2]);
    const yyyy = Number(match[3]);
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) continue;
    if (yyyy < nowYear - 120 || yyyy > nowYear + 20) continue;
    dates.push({ raw: match[0], dd, mm, yyyy });
  }
  return dates;
}

// El orden de bloques/líneas de ML Kit no es un orden de lectura confiable
// en diseños de identificación a varias columnas — la fecha de nacimiento
// puede aparecer textualmente lejos de su propia etiqueta, o incluso antes.
// En vez de perseguir la etiqueta "NACIMIENTO" (que también sale con
// acentos raros en el OCR, ej. "nacimíento"), se recolecta todo valor con
// forma de fecha en la tarjeta y se clasifica por año: el DNI siempre trae
// exactamente tres fechas — nacimiento (la más antigua), emisión (reciente),
// vencimiento (futura) — sin importar dónde haya caído el texto.
function pickBirthDate(dates: ParsedDate[]): ParsedDate | null {
  const nowYear = new Date().getFullYear();
  const plausible = dates.filter((d) => d.yyyy <= nowYear);
  if (plausible.length === 0) return null;
  return plausible.reduce((oldest, d) => (d.yyyy < oldest.yyyy ? d : oldest));
}

function findDniNumber(lines: string[], excludeDigits: Set<string>): string | null {
  // Se prefiere un número que esté en la misma línea que la etiqueta CUI/DNI.
  for (const line of lines) {
    if (!DNI_LABEL_RE.test(line)) continue;
    const match = line.match(EIGHT_DIGITS_RE);
    if (match && !excludeDigits.has(match[0])) return match[0];
  }
  // Como respaldo, cualquier secuencia de 8 dígitos que no sea una de las fechas de la tarjeta.
  for (const line of lines) {
    const match = line.match(EIGHT_DIGITS_RE);
    if (match && !excludeDigits.has(match[0])) return match[0];
  }
  return null;
}

export function calcularEdad(dateStr: string): number | null {
  const match = new RegExp(DATE_RE.source).exec(dateStr);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const birth = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

// El anverso tanto del DNI azul (manual) como del electrónico peruano
// imprime el número de documento de 8 dígitos y la fecha de nacimiento en
// letra grande — se lee con OCR en el propio dispositivo para no depender
// solo del código de barras PDF417 del reverso, y poder exigir 18+ años
// para el registro.
export async function analizarFrenteDni(uri: string): Promise<AnalisisFrenteDni> {
  try {
    const result = await TextRecognition.recognize(uri);
    const lines = linesInReadingOrder(result);

    const dates = findAllValidDates(result.text);
    const birth = pickBirthDate(dates);

    const dateDigitStrings = new Set(dates.map((d) => `${String(d.dd).padStart(2, '0')}${String(d.mm).padStart(2, '0')}${d.yyyy}`));
    const dni = findDniNumber(lines, dateDigitStrings);

    const birthDate = birth ? `${String(birth.dd).padStart(2, '0')}/${String(birth.mm).padStart(2, '0')}/${birth.yyyy}` : null;
    const age = birthDate ? calcularEdad(birthDate) : null;

    console.log('[dniOcr] raw text:', JSON.stringify(result.text));
    console.log('[dniOcr] dates:', dates, '-> birth:', birth, '-> dni:', dni, '-> age:', age);

    return { dni, birthDate, age };
  } catch (e) {
    console.log('[dniOcr] error:', e);
    return { dni: null, birthDate: null, age: null };
  }
}
