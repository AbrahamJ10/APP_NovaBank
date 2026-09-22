import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';

export type DniFrontAnalysis = {
  dni: string | null;
  birthDate: string | null; // normalized DD/MM/YYYY
  age: number | null;
};

// Accepts "DD MM YYYY" (electronic DNI), "DD/MM/YYYY" or "DD-MM-YYYY" (blue
// DNI / re-OCR variance).
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

// ML Kit's block/line order is not reliable reading order on multi-column ID
// layouts — the birth date can appear textually far from its own label, or
// even before it. Instead of hunting for the "NACIMIENTO" label (which also
// gets OCR'd with stray accents, e.g. "nacimíento"), collect every date-like
// value on the card and classify by year: DNI always carries exactly three
// dates — birth (oldest), issuance (recent), expiry (future) — regardless of
// where the text landed.
function pickBirthDate(dates: ParsedDate[]): ParsedDate | null {
  const nowYear = new Date().getFullYear();
  const plausible = dates.filter((d) => d.yyyy <= nowYear);
  if (plausible.length === 0) return null;
  return plausible.reduce((oldest, d) => (d.yyyy < oldest.yyyy ? d : oldest));
}

function findDniNumber(lines: string[], excludeDigits: Set<string>): string | null {
  // Prefer a number sitting on the same line as the CUI/DNI label.
  for (const line of lines) {
    if (!DNI_LABEL_RE.test(line)) continue;
    const match = line.match(EIGHT_DIGITS_RE);
    if (match && !excludeDigits.has(match[0])) return match[0];
  }
  // Fall back to any 8-digit run that isn't one of the card's dates.
  for (const line of lines) {
    const match = line.match(EIGHT_DIGITS_RE);
    if (match && !excludeDigits.has(match[0])) return match[0];
  }
  return null;
}

export function calculateAge(dateStr: string): number | null {
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

// The front of both the blue (manual) and electronic Peruvian DNI prints the
// 8-digit document number and the birth date in large type — read with
// on-device OCR so we don't depend solely on the back's PDF417 barcode, and
// can gate registration on being 18+.
export async function analyzeDniFront(uri: string): Promise<DniFrontAnalysis> {
  try {
    const result = await TextRecognition.recognize(uri);
    const lines = linesInReadingOrder(result);

    const dates = findAllValidDates(result.text);
    const birth = pickBirthDate(dates);

    const dateDigitStrings = new Set(dates.map((d) => `${String(d.dd).padStart(2, '0')}${String(d.mm).padStart(2, '0')}${d.yyyy}`));
    const dni = findDniNumber(lines, dateDigitStrings);

    const birthDate = birth ? `${String(birth.dd).padStart(2, '0')}/${String(birth.mm).padStart(2, '0')}/${birth.yyyy}` : null;
    const age = birthDate ? calculateAge(birthDate) : null;

    console.log('[dniOcr] raw text:', JSON.stringify(result.text));
    console.log('[dniOcr] dates:', dates, '-> birth:', birth, '-> dni:', dni, '-> age:', age);

    return { dni, birthDate, age };
  } catch (e) {
    console.log('[dniOcr] error:', e);
    return { dni: null, birthDate: null, age: null };
  }
}
