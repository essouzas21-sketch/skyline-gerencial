import {
  ETAPAS_OPERACAO,
  ETAPAS_TRIAGEM,
  GRUPO_RECEBIMENTO,
  RECEBIMENTO_DIA_EXCLUIDO
} from "../api/endpoints";
import { inRange, toLocalDateStr } from "./dates";
import { filled, fold, parseMoney, titleCase } from "./format";
import { GESTAO_PANELS, TEAM_MATCHES } from "./panels";

export function normalizeUserName(name) {
  if (name == null || name === "—") return name ?? "—";
  return titleCase(name);
}

export function matchesUserFilter(user, filters) {
  if (!filters?.length) return true;
  const norm = fold(user);
  return filters.some((u) => norm.includes(fold(u)));
}

export function isAppleDescricao(descricao) {
  return fold(descricao).includes("apple");
}

export function resolveOperacao(raw) {
  if (!raw || typeof raw !== "object") return "";
  return String(raw.operação ?? raw.operacao ?? raw.etapa_origem ?? raw.ETAPA_ORIGEM ?? "")
    .trim()
    .toLowerCase();
}

export function resolveRecebimentoDate(raw) {
  if (!raw || typeof raw !== "object") return null;
  const ni = raw.ni;
  if (ni && typeof ni === "object") {
    const nested = ni.data_recebimento ?? ni.dataRecebimento ?? null;
    if (nested) return nested;
  }
  return raw.data_recebimento ?? raw.dataRecebimento ?? null;
}

export function resolveRecebimentoId(raw) {
  if (!raw || typeof raw !== "object") return null;
  return raw.hu_id ?? raw.nr_item_id ?? raw.numero ?? raw.id ?? raw.hunit ?? null;
}

export function passesRecebimentoRaw(raw, grupoFiltro = GRUPO_RECEBIMENTO) {
  if (!raw || typeof raw !== "object") return false;
  const grupo = String(raw.grupo ?? raw.Grupo ?? raw.p?.grupo ?? "").trim();
  if (grupo !== String(grupoFiltro)) return false;
  const dataHu = resolveRecebimentoDate(raw);
  if (!dataHu) return false;
  if (toLocalDateStr(dataHu) === RECEBIMENTO_DIA_EXCLUIDO) return false;
  return true;
}

export function resolveGestaoDate(raw) {
  if (!raw || typeof raw !== "object") return null;
  return (
    raw.DATA_PEDIDO_SANKHYA ??
    raw.data_pedido_sankhya ??
    raw["Iniciado_Reparo"] ??
    raw.iniciado_reparo ??
    null
  );
}

export function passesTriagemRaw(raw) {
  if (!raw || typeof raw !== "object") return false;
  const dataTriagem = raw["Data Triagem"] || raw.data_triagem || null;
  if (!dataTriagem) return false;
  return ETAPAS_TRIAGEM.has(resolveOperacao(raw));
}

export function passesGestaoRaw(raw) {
  if (!raw || typeof raw !== "object") return false;
  const produtoId = raw.produto_requisitado_id ?? raw.produto_id_requisitado ?? null;
  if (produtoId == null || String(produtoId).trim() === "") return false;
  if (!resolveGestaoDate(raw)) return false;
  if (!ETAPAS_OPERACAO.has(resolveOperacao(raw))) return false;
  const hasLegacyPedido = !!(raw.DATA_PEDIDO_SANKHYA || raw.data_pedido_sankhya);
  if (!hasLegacyPedido && !raw["Usuario Solicitação Peça"]) return false;
  const sankhya = raw.STATUS_SANKHYA ?? raw.status_sankhya ?? null;
  if (
    sankhya != null &&
    String(sankhya).trim() !== "" &&
    String(sankhya).trim().toLowerCase() !== "sucesso"
  ) {
    return false;
  }
  return true;
}

export function distinctById(rows, idField = "id") {
  const map = new Map();
  const noId = [];
  rows.forEach((row) => {
    const rawId = row?.[idField];
    if (rawId == null || String(rawId).trim() === "") {
      noId.push(row);
      return;
    }
    map.set(String(rawId).trim(), row);
  });
  return [...map.values(), ...noId];
}

export function filterByDateField(rows, start, end, field) {
  return rows.filter((r) => inRange(r[field], start, end));
}

export function filterByAnyDateField(rows, start, end, fields) {
  return rows.filter((r) => fields.some((field) => inRange(r[field], start, end)));
}

export function dedupeGestaoRows(rows) {
  const seen = new Set();
  const out = [];
  rows.forEach((row, i) => {
    const os = row.id != null && String(row.id).trim() !== "" ? String(row.id).trim() : `row:${i}`;
    const produto = String(row.produto_requisitado_id || "").trim();
    const dia = toLocalDateStr(row.data_pedido_sankhya) || "";
    if (!produto || !dia) return;
    const key = `${os}|${produto}|${dia}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  });
  return out;
}

function isCqeMotivoIgnorado(motivo) {
  const norm = fold(motivo)
    .replace(/[.,;:!?\-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return false;
  if (norm === "teste") return true;
  return norm === "retorno ao tecnico" || norm.includes("retorno ao tecnico");
}

export function resolveCqeQualidadeDate(raw, decisao = null) {
  const qualidade = raw?.Data_qualidade ?? raw?.data_qualidade ?? raw?.DATA_QUALIDADE ?? null;
  if (qualidade) return qualidade;
  const fim = raw?.["Fim do Reparo"] || null;
  const sankhya = raw?.DATA_PEDIDO_SANKHYA || raw?.data_pedido_sankhya || null;
  let dec = String(decisao || "").trim().toLowerCase();
  if (!dec && raw?.decisao) {
    const v = String(raw.decisao).trim().toLowerCase();
    if (v.includes("reprov")) dec = "reprovado";
    else if (v.includes("aprov")) dec = "aprovado";
  }
  if (dec === "reprovado") return fim || sankhya || null;
  return sankhya || fim || null;
}

export function mapCqe(raw) {
  const v = String(raw.decisao || "").trim().toLowerCase();
  let decisao = null;
  if (v.includes("reprov")) decisao = "reprovado";
  else if (v.includes("aprov")) decisao = "aprovado";
  if (!decisao) return null;
  return {
    id: raw.id ?? null,
    data_qualidade: resolveCqeQualidadeDate(raw, decisao),
    decisao,
    motivo: String(raw.motivo_reprovacao || "").trim() || "Sem motivo informado",
    tecnico: normalizeUserName(raw["Usuario final"] || raw["Usuário reparo"] || raw["Usuario inicio"] || "—"),
    modelo: String(raw.descricao || "—").trim() || "—",
    serial: String(raw.serial || "—").trim() || "—",
    nr: String(raw.NR || raw.nr || "—").trim() || "—"
  };
}

export function processCqeRows(rows) {
  const seen = new Set();
  const result = [];
  rows.forEach((row) => {
    if (row.decisao === "reprovado" && isCqeMotivoIgnorado(row.motivo)) return;
    const id = row.id != null && String(row.id).trim() !== "" ? String(row.id).trim() : null;
    if (id) {
      const day = toLocalDateStr(row.data_qualidade);
      const key = `${id}|${day}|${row.decisao}`;
      if (seen.has(key)) return;
      seen.add(key);
    }
    result.push(row);
  });
  return result;
}

function maxFilledPause(raw) {
  for (let n = 3; n >= 1; n--) {
    if (filled(raw[`${n} Pausa`])) return n;
  }
  return 0;
}

function maxFilledRetorno(raw) {
  for (let n = 3; n >= 1; n--) {
    if (filled(raw[`${n} Retorno`])) return n;
  }
  return 0;
}

export function classifyReparo(raw) {
  if (filled(raw["Fim do Reparo"])) {
    return { status: "finalizado", user: raw["Usuario final"] || "—" };
  }
  const mp = maxFilledPause(raw);
  if (mp && !filled(raw[`${mp} Retorno`])) {
    return { status: "pausado", user: raw[`Usuario ${mp} pausa`] || "—" };
  }
  const mr = maxFilledRetorno(raw);
  if (mr) {
    return { status: "andamento", user: raw[`Usuario ${mr} retorno`] || "—" };
  }
  return { status: "andamento", user: raw["Usuario inicio"] || "—" };
}

const PROD_DATE_FIELDS = ["iniciado_reparo", "retorno_1", "retorno_2", "retorno_3"];

export function mapProducaoRow(raw) {
  const { status, user } = classifyReparo(raw);
  return {
    id: raw.id ?? null,
    iniciado_reparo: raw["Iniciado_Reparo"] || null,
    retorno_1: raw["1 Retorno"] || null,
    retorno_2: raw["2 Retorno"] || null,
    retorno_3: raw["3 Retorno"] || null,
    fim: raw["Fim do Reparo"] || null,
    descricao: raw.descricao || "—",
    serial: raw.serial || "—",
    hu: String(raw.hu || raw.HU_certa || raw.hu_id || "—").trim() || "—",
    nr: String(raw.NR || raw.nr || "—").trim() || "—",
    peca: String(raw.peca_requisitada || "—").trim() || "—",
    custo: parseMoney(raw.custo_total ?? raw.custo_pecas),
    status,
    user: normalizeUserName(user || "—"),
    raw
  };
}

export function loadProducaoRows(reparoRaw) {
  const mapped = reparoRaw
    .map(mapProducaoRow)
    .filter((r) => PROD_DATE_FIELDS.some((f) => r[f]));
  return distinctById(mapped, "id");
}

export function filterProducao(allRows, start, end, linha = "all") {
  let filtered = filterByAnyDateField(allRows, start, end, PROD_DATE_FIELDS);
  if (TEAM_MATCHES.length) {
    filtered = filtered.filter((row) => matchesUserFilter(row.user, TEAM_MATCHES));
  }
  if (linha === "iphone") {
    filtered = filtered.filter((row) => isAppleDescricao(row.descricao));
  } else if (linha === "android") {
    filtered = filtered.filter((row) => !isAppleDescricao(row.descricao));
  }
  return filtered;
}

export function computeStatusTotals(rows) {
  const totals = { finalizado: 0, andamento: 0, pausado: 0, total: 0 };
  rows.forEach((row) => {
    if (totals[row.status] != null) totals[row.status] += 1;
    totals.total += 1;
  });
  return totals;
}

export function loadRecebimentoRows(recRaw) {
  const mapped = recRaw.filter((raw) => passesRecebimentoRaw(raw)).map((raw) => ({
    id: resolveRecebimentoId(raw),
    hu_id: raw.hu_id ?? null,
    serial: raw.serial ?? null,
    descricao: raw.descricao || "—",
    numero: String(raw.numero || raw.NR || ""),
    data_recebimento: resolveRecebimentoDate(raw),
    usuario_recebimento: raw.usuario_recebimento || "—",
    endereco: raw.endereco || "—",
    grupo: String(raw.grupo ?? raw.Grupo ?? ""),
    custoAquisicao: parseMoney(raw.custo_aquisicao ?? raw.custoAquisicao ?? raw.valor_aquisicao),
    grade: String(raw.grade ?? raw.qualidade ?? "").trim(),
    raw
  }));
  return distinctById(mapped, "id");
}

export function loadTriagemRows(reparoRaw) {
  return reparoRaw.filter(passesTriagemRaw).map((raw) => ({
    id: raw.id ?? null,
    data_triagem: raw["Data Triagem"] || raw.data_triagem || null,
    operacao: resolveOperacao(raw)
  }));
}

export function loadGestaoRows(reparoRaw) {
  const mapped = reparoRaw
    .filter(passesGestaoRaw)
    .map((raw) => {
      const produtoId = raw.produto_requisitado_id ?? raw.produto_id_requisitado ?? null;
      return {
        id: raw.id ?? null,
        data_pedido_sankhya: resolveGestaoDate(raw),
        produto_requisitado_id: produtoId != null ? String(produtoId).trim() : null
      };
    })
    .filter((r) => r.data_pedido_sankhya && r.produto_requisitado_id);
  return dedupeGestaoRows(mapped);
}

export function loadCqeMapped(reparoRaw) {
  return reparoRaw.map(mapCqe).filter(Boolean).filter((r) => r.data_qualidade);
}

function huKey(raw) {
  const hu = raw.HU_certa ?? raw.HU_certo ?? raw.hu_certa ?? raw.hu_certo ?? raw.hu ?? raw.hu_id;
  if (hu != null && String(hu).trim()) return String(hu).trim();
  return null;
}

function indexReparo(reparoRaw) {
  const byHu = new Map();
  const bySerial = new Map();
  reparoRaw.forEach((raw) => {
    const hu = huKey(raw);
    if (hu) {
      if (!byHu.has(hu)) byHu.set(hu, []);
      byHu.get(hu).push(raw);
    }
    const serial = String(raw.serial || "").trim();
    if (serial) {
      if (!bySerial.has(serial)) bySerial.set(serial, []);
      bySerial.get(serial).push(raw);
    }
  });
  return { byHu, bySerial };
}

function latestReparo(rows) {
  if (!rows?.length) return null;
  return [...rows].sort((a, b) => {
    const da = new Date(a["Fim do Reparo"] || a["Iniciado_Reparo"] || a["Data Triagem"] || 0).getTime();
    const db = new Date(b["Fim do Reparo"] || b["Iniciado_Reparo"] || b["Data Triagem"] || 0).getTime();
    return db - da;
  })[0];
}

function mapEtapa(reparo) {
  if (!reparo) return { step: "recebimento", label: "Recebimento" };
  const v = String(reparo.decisao || "").trim().toLowerCase();
  if (v.includes("aprov") || v.includes("reprov")) {
    return { step: "qualidade", label: v.includes("aprov") ? "CQE aprovado" : "CQE reprovado" };
  }
  const { status } = classifyReparo(reparo);
  if (status === "pausado") return { step: "reparo", label: "Pausa" };
  if (filled(reparo["Iniciado_Reparo"]) && !filled(reparo["Fim do Reparo"])) {
    return { step: "reparo", label: "Reparo" };
  }
  if (filled(reparo.peca_requisitada) || filled(reparo.produto_requisitado_id)) {
    return { step: "gestao", label: "Gestão de peças" };
  }
  if (filled(reparo["Data Triagem"])) return { step: "triagem", label: "Triagem" };
  if (filled(reparo["Fim do Reparo"])) return { step: "reparo", label: "Finalizado" };
  return { step: "recebimento", label: "Recebimento" };
}

function indexPecas(pecasRaw) {
  const bySerial = new Map();
  const byId = new Map();
  pecasRaw.forEach((raw) => {
    const serial = String(raw.serial || "").trim();
    if (serial) {
      if (!bySerial.has(serial)) bySerial.set(serial, []);
      bySerial.get(serial).push(raw);
    }
    if (raw?.id != null && String(raw.id).trim() !== "") {
      byId.set(String(raw.id), raw);
    }
  });
  return { bySerial, byId };
}

function pecaCost(reparo, pecas, serial) {
  if (reparo?.id != null && pecas.byId.has(String(reparo.id))) {
    return parseMoney(pecas.byId.get(String(reparo.id)).valor_total);
  }
  const list = pecas.bySerial.get(String(serial || "").trim()) || [];
  const vals = list.map((p) => parseMoney(p.valor_total)).filter((n) => n != null);
  if (!vals.length) return parseMoney(reparo?.custo_total ?? reparo?.custo_pecas);
  return vals.reduce((a, b) => a + b, 0);
}

export function buildItens(recRows, reparoRaw, pecasRaw = []) {
  const reparoIdx = indexReparo(reparoRaw);
  const pecas = indexPecas(pecasRaw);
  const seen = new Set();
  const items = [];

  recRows.forEach((rec) => {
    const hu = rec.hu_id != null ? String(rec.hu_id) : "";
    const serial = String(rec.serial || "").trim();
    const key = hu || serial;
    if (!key || seen.has(key)) return;
    seen.add(key);

    const reparoRows =
      (hu && reparoIdx.byHu.get(hu)) ||
      (serial && reparoIdx.bySerial.get(serial)) ||
      [];
    const reparo = latestReparo(reparoRows);
    const etapa = mapEtapa(reparo);
    const decisao = String(reparo?.decisao || "").trim();
    const { status, user } = reparo ? classifyReparo(reparo) : { status: "—", user: rec.usuario_recebimento };
    const custoPecas = pecaCost(reparo, pecas, serial || reparo?.serial);

    items.push({
      nr: rec.numero || String(reparo?.NR || reparo?.nr || "—"),
      hu: rec.hu_id ?? hu ?? "—",
      serial: serial || reparo?.serial || "—",
      modelo: rec.descricao || reparo?.descricao || "—",
      etapa: etapa.label,
      step: etapa.step,
      tecnico: normalizeUserName(user || "—"),
      qualidade: decisao || "—",
      local: rec.endereco || "—",
      recebido: rec.data_recebimento,
      status,
      hasReparo: Boolean(reparo),
      custoAquisicao: rec.custoAquisicao,
      custoPecas,
      custoTotal: (rec.custoAquisicao || 0) + (custoPecas || 0) || null,
      peca: String(reparo?.peca_requisitada || "—"),
      grade: rec.grade || "—"
    });
  });

  return items;
}

export function kpiSnapshot({ recRows, triRows, gestaoRows, prodRows, cqeRows, itens, start, end }) {
  const rec = filterByDateField(recRows, start, end, "data_recebimento");
  const tri = distinctById(filterByDateField(triRows, start, end, "data_triagem"), "id");
  const gestao = filterByDateField(gestaoRows, start, end, "data_pedido_sankhya");
  const android = filterProducao(prodRows, start, end, "android");
  const iphone = filterProducao(prodRows, start, end, "iphone");
  const cqe = processCqeRows(filterByDateField(cqeRows, start, end, "data_qualidade"));
  const itensPeriodo = itens.filter((it) => inRange(it.recebido, start, end));

  let custoAquisicao = 0;
  let custoPecas = 0;
  let aqCount = 0;
  let pecCount = 0;
  itensPeriodo.forEach((it) => {
    if (it.custoAquisicao != null) {
      custoAquisicao += it.custoAquisicao;
      aqCount += 1;
    }
    if (it.custoPecas != null) {
      custoPecas += it.custoPecas;
      pecCount += 1;
    }
  });

  const byStep = {};
  itensPeriodo.forEach((it) => {
    byStep[it.etapa] = (byStep[it.etapa] || 0) + 1;
  });

  return {
    recebimento: rec.length,
    triagem: tri.length,
    gestao: gestao.length,
    gestaoAparelhos: distinctById(gestao, "id").length,
    android: computeStatusTotals(android),
    iphone: computeStatusTotals(iphone),
    producao: computeStatusTotals([...android, ...iphone]),
    cqe: {
      aprovado: cqe.filter((r) => r.decisao === "aprovado").length,
      reprovado: cqe.filter((r) => r.decisao === "reprovado").length,
      total: cqe.length,
      rows: cqe
    },
    custos: {
      aquisicao: custoAquisicao,
      pecas: custoPecas,
      total: custoAquisicao + custoPecas,
      aqCount,
      pecCount
    },
    byStep,
    itensPeriodo,
    androidRows: android,
    iphoneRows: iphone
  };
}

export function producaoByPanel(prodRows, start, end) {
  return GESTAO_PANELS.map((panel) => {
    const matches = panel.users.map((u) => u.match);
    const rows = filterProducao(prodRows, start, end, "all").filter((r) =>
      matchesUserFilter(r.user, matches)
    );
    const techs = panel.users.map((u) => {
      const techRows = rows.filter((r) => matchesUserFilter(r.user, [u.match]));
      return { label: u.label, ...computeStatusTotals(techRows) };
    });
    return { ...panel, ...computeStatusTotals(rows), techs };
  });
}

export function aggregateCount(rows, keyFn) {
  const map = new Map();
  rows.forEach((r) => {
    const key = keyFn(r) || "—";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
