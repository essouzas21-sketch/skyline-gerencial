export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function validParts(year, month, day) {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

export function toLocalDateStr(value) {
  if (!value) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const s = String(value).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return validParts(year, month, day) ? `${iso[1]}-${iso[2]}-${iso[3]}` : "";
  }
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    const year = Number(br[3]);
    return validParts(year, month, day) ? `${br[3]}-${br[2]}-${br[1]}` : "";
  }
  // Sankhya DDMMYYYY ("02072026 00:00:00") — never pass this to new Date()
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 8) {
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    if (validParts(year, month, day)) return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

export function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toLocalDateStr(dt);
}

export function startOfMonthISO(iso = todayISO()) {
  const [y, m] = iso.split("-");
  return `${y}-${m}-01`;
}

export function formatDateBR(iso) {
  if (!iso) return "—";
  const local = toLocalDateStr(iso);
  if (!local) return "—";
  const [y, m, d] = local.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatDateBR(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatPeriodBR(start, end) {
  return `${formatDateBR(start)} a ${formatDateBR(end)}`;
}

export function inRange(value, start, end) {
  const local = toLocalDateStr(value);
  if (!local || !start || !end) return false;
  return local >= start && local <= end;
}
