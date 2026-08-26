export function todayISO() {
  const d = new Date();
  return toLocalDateStr(d);
}

export function toLocalDateStr(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value);
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
