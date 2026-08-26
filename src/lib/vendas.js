import { inRange } from "./dates";
import { parseMoney } from "./format";

export const CANAIS = {
  1130: { id: "ml", code: 1130, label: "Mercado Livre" },
  1191: { id: "loja", code: 1191, label: "Loja" }
};

export function parseEmissao(raw) {
  const s = String(raw || "").trim();
  const compact = s.match(/^(\d{2})(\d{2})(\d{4})/);
  if (compact) return `${compact[3]}-${compact[2]}-${compact[1]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return "";
}

function pickValorTotal(item) {
  if (!item || typeof item !== "object") return 0;
  const raw =
    item.valor_total ??
    item["valor total"] ??
    item["Valor Total"] ??
    item.ValorTotal ??
    item.vlrtot ??
    item.VLRNOTA;
  const n = parseMoney(raw);
  return n != null ? n : 0;
}

export function mapNota(raw) {
  if (!raw || typeof raw !== "object") return null;
  const code = Number(raw.codtipoper ?? raw.CODTIPOPER ?? raw["tipo de operacao"] ?? raw.tipo_operacao);
  const canal = CANAIS[code];
  if (!canal) return null;
  const itens = Array.isArray(raw.itens) ? raw.itens : [];
  const valor = itens.reduce((sum, item) => sum + pickValorTotal(item), 0);
  const qtde = itens.reduce((sum, item) => {
    const n = Number(String(item?.qtde ?? 1).replace(",", "."));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  return {
    nunota: raw.nunota ?? raw.NUNOTA ?? null,
    numnota: raw.numnota ?? raw.NUMNOTA ?? null,
    codtipoper: code,
    canal: canal.id,
    canalLabel: canal.label,
    data: parseEmissao(raw.data_emissao ?? raw.DTNEG ?? raw.DTFATUR ?? raw.data),
    valor,
    qtde,
    itens: itens.length
  };
}

export function loadVendas(rawRows) {
  return (rawRows || []).map(mapNota).filter((n) => n && n.data);
}

export function kpiVendas(notas, start, end) {
  const inPeriod = (notas || []).filter((n) => inRange(n.data, start, end));
  const empty = { valor: 0, notas: 0, qtde: 0, itens: 0 };
  const ml = { ...empty };
  const loja = { ...empty };
  const byDayMap = new Map();

  inPeriod.forEach((n) => {
    const target = n.canal === "ml" ? ml : n.canal === "loja" ? loja : null;
    if (!target) return;
    target.valor += n.valor;
    target.notas += 1;
    target.qtde += n.qtde;
    target.itens += n.itens;
    if (!byDayMap.has(n.data)) {
      byDayMap.set(n.data, {
        date: n.data,
        ml: 0,
        loja: 0,
        total: 0,
        notas: 0,
        qtde: 0
      });
    }
    const day = byDayMap.get(n.data);
    day[n.canal] += n.valor;
    day.total += n.valor;
    day.notas += 1;
    day.qtde += n.qtde;
  });

  const byDay = [...byDayMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  return {
    ml,
    loja,
    total: {
      valor: ml.valor + loja.valor,
      notas: ml.notas + loja.notas,
      qtde: ml.qtde + loja.qtde,
      itens: ml.itens + loja.itens
    },
    byDay,
    rows: inPeriod
  };
}
