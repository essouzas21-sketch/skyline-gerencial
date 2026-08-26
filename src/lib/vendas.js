import { parseMoney } from "./format";

export const CANAIS = {
  1130: { id: "ml", code: 1130, label: "Mercado Livre" },
  1191: { id: "loja", code: 1191, label: "Loja" }
};

function pickField(raw, names) {
  if (!raw || typeof raw !== "object") return undefined;
  for (const name of names) {
    if (raw[name] != null && raw[name] !== "") return raw[name];
  }
  const wanted = names.map((n) => String(n).trim().toLowerCase());
  for (const key of Object.keys(raw)) {
    if (wanted.includes(String(key).trim().toLowerCase())) {
      const v = raw[key];
      if (v != null && v !== "") return v;
    }
  }
  return undefined;
}

function isValidYmd(year, month, day) {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

/** Sankhya `data_emissao`: "02072026 00:00:00" → ISO 2026-07-02 */
export function parseEmissao(raw) {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim();
  if (!s) return "";

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return isValidYmd(year, month, day) ? `${iso[1]}-${iso[2]}-${iso[3]}` : "";
  }

  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    const year = Number(br[3]);
    return isValidYmd(year, month, day) ? `${br[3]}-${br[2]}-${br[1]}` : "";
  }

  const digits = s.replace(/\D/g, "");
  if (digits.length >= 8) {
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    if (isValidYmd(year, month, day)) return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

export function formatEmissaoBR(rawOrIso) {
  const s = String(rawOrIso ?? "").trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : parseEmissao(s);
  if (!iso) return s || "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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

function pickQtde(item) {
  const n = Number(String(item?.qtde ?? 1).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function mapItemLine(item) {
  if (!item || typeof item !== "object") return null;
  const pn = String(item.pn ?? item.PN ?? "").trim();
  const codprod = item.codprod ?? item.CODPROD ?? null;
  return {
    codprod,
    pn: pn || "—",
    descricao: String(item.descricao ?? item.DESCRICAO ?? "").trim() || "—",
    qtde: pickQtde(item),
    valor: pickValorTotal(item)
  };
}

export function produtoKey(item) {
  if (item?.pn && item.pn !== "—") return `pn:${item.pn}`;
  if (item?.codprod != null && String(item.codprod).trim() !== "") return `cod:${item.codprod}`;
  return `desc:${String(item?.descricao || "").trim().toLowerCase()}`;
}

export function rankProdutos(notas, limit = 20) {
  const map = new Map();
  (notas || []).forEach((n) => {
    const notaId = String(n.nunota ?? n.numnota ?? "");
    (n.linhas || []).forEach((item) => {
      const key = produtoKey(item);
      if (!map.has(key)) {
        map.set(key, {
          key,
          pn: item.pn || "—",
          codprod: item.codprod,
          descricao: item.descricao || "—",
          qtde: 0,
          valor: 0,
          ml: 0,
          loja: 0,
          notaIds: new Set()
        });
      }
      const row = map.get(key);
      row.qtde += item.qtde;
      row.valor += item.valor;
      if (n.canal === "ml") row.ml += item.valor;
      if (n.canal === "loja") row.loja += item.valor;
      if (notaId) row.notaIds.add(notaId);
      if (row.descricao === "—" && item.descricao && item.descricao !== "—") {
        row.descricao = item.descricao;
      }
    });
  });

  const list = [...map.values()].map((row) => {
    const { notaIds, ...rest } = row;
    return {
      ...rest,
      notas: notaIds.size,
      ticket: row.qtde ? row.valor / row.qtde : 0
    };
  });

  const byQtde = [...list].sort((a, b) => b.qtde - a.qtde || b.valor - a.valor);
  const byValor = [...list].sort((a, b) => b.valor - a.valor || b.qtde - a.qtde);
  return {
    byQtde: byQtde.slice(0, limit),
    byValor: byValor.slice(0, limit),
    produtos: list.length
  };
}

export function mapNota(raw) {
  if (!raw || typeof raw !== "object") return null;
  const code = Number(
    pickField(raw, ["codtipoper", "CODTIPOPER", "tipo de operacao", "tipo_operacao"])
  );
  const canal = CANAIS[code];
  if (!canal) return null;
  const itens = Array.isArray(raw.itens) ? raw.itens : [];
  const linhas = itens.map(mapItemLine).filter(Boolean);
  const valor = linhas.reduce((sum, item) => sum + item.valor, 0);
  const qtde = linhas.reduce((sum, item) => sum + item.qtde, 0);
  const dataEmissao = pickField(raw, ["data_emissao", "DATA_EMISSAO"]) ?? "";
  return {
    nunota: raw.nunota ?? raw.NUNOTA ?? null,
    numnota: raw.numnota ?? raw.NUMNOTA ?? null,
    codtipoper: code,
    canal: canal.id,
    canalLabel: canal.label,
    data: parseEmissao(dataEmissao),
    dataEmissao,
    valor,
    qtde,
    itens: linhas.length,
    linhas
  };
}

export function loadVendas(rawRows) {
  return (rawRows || []).map(mapNota).filter(Boolean);
}

export function vendasSpan(notas) {
  const dates = (notas || []).map((n) => n.data).filter(Boolean).sort();
  if (!dates.length) return null;
  return { min: dates[0], max: dates[dates.length - 1] };
}

export function kpiVendas(notas, start, end) {
  const all = notas || [];
  const inPeriod = all.filter((n) => n.data && n.data >= start && n.data <= end);
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
        label: formatEmissaoBR(n.dataEmissao || n.data),
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
  const span = vendasSpan(all);
  const ranked = rankProdutos(inPeriod, 20);

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
    rows: inPeriod,
    topQtde: ranked.byQtde,
    topValor: ranked.byValor,
    produtos: ranked.produtos,
    loaded: all.length,
    semData: all.filter((n) => !n.data).length,
    foraDoPeriodo: all.filter((n) => n.data && (n.data < start || n.data > end)).length,
    span
  };
}
