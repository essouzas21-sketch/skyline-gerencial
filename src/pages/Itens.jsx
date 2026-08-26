import { useMemo, useState } from "react";
import { formatDateBR } from "../lib/dates";
import { downloadCsv } from "../lib/excel";
import { fold, formatMoney } from "../lib/format";
import { useData } from "../context/DataContext";
import Card, { Chip } from "../components/ui";
import Topbar from "../components/Topbar";

function qualidadeTone(value) {
  const v = fold(value);
  if (v.includes("aprov")) return "ok";
  if (v.includes("reprov")) return "warn";
  return "idle";
}

function etapaTone(step) {
  if (step === "qualidade") return "ok";
  if (step === "reparo") return "info";
  if (step === "gestao") return "warn";
  return "idle";
}

export default function Itens() {
  const { itens, kpis, loading, error, dateStart, dateEnd } = useData();
  const [q, setQ] = useState("");
  const [etapa, setEtapa] = useState("all");
  const [modelo, setModelo] = useState("all");

  const base = kpis.itensPeriodo.length ? kpis.itensPeriodo : itens;

  const etapas = useMemo(
    () => [...new Set(base.map((r) => r.etapa).filter(Boolean))].sort(),
    [base]
  );
  const modelos = useMemo(
    () => [...new Set(base.map((r) => r.modelo).filter((m) => m && m !== "—"))].sort().slice(0, 80),
    [base]
  );

  const filtered = useMemo(() => {
    const needles = String(q || "")
      .split(/[,;]+/)
      .map(fold)
      .filter(Boolean);
    return base.filter((r) => {
      if (etapa !== "all" && r.etapa !== etapa) return false;
      if (modelo !== "all" && r.modelo !== modelo) return false;
      if (!needles.length) return true;
      const blob = fold(`${r.nr} ${r.hu} ${r.serial} ${r.modelo} ${r.tecnico}`);
      return needles.some((n) => blob.includes(n));
    });
  }, [base, q, etapa, modelo]);

  function exportExcel() {
    downloadCsv(
      `nr-itens-${dateStart}-${dateEnd}.csv`,
      ["NR", "HU", "Serial", "Modelo", "Etapa", "Técnico", "Qualidade", "Local", "Recebido", "Custo peças"],
      filtered.map((r) => [
        r.nr,
        r.hu,
        r.serial,
        r.modelo,
        r.etapa,
        r.tecnico,
        r.qualidade,
        r.local,
        formatDateBR(r.recebido),
        r.custoPecas ?? ""
      ])
    );
  }

  return (
    <>
      <Topbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="NR, várias (vírgula) ou HU / IMEI"
        extra={
          <button className="btn ghost" type="button" onClick={exportExcel} disabled={!filtered.length}>
            Excel
          </button>
        }
      />
      {loading && <div className="loading card">Carregando itens da NR…</div>}
      {error && <div className="error card">{error}</div>}

      <div className="search-box" style={{ minWidth: 0 }}>
        <label className="filter-field" style={{ display: "grid", gap: 4, minWidth: 160 }}>
          <span>Etapa atual</span>
          <select value={etapa} onChange={(e) => setEtapa(e.target.value)}>
            <option value="all">Todas as etapas</option>
            {etapas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field" style={{ display: "grid", gap: 4, minWidth: 200 }}>
          <span>Modelo</span>
          <select value={modelo} onChange={(e) => setModelo(e.target.value)}>
            <option value="all">Todos os modelos</option>
            {modelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card>
        <h3>
          Aparelhos da NR{" "}
          <span style={{ fontWeight: 500, color: "var(--muted)", letterSpacing: 0, textTransform: "none", fontFamily: "var(--font-body)", fontSize: "0.78rem", marginLeft: 8 }}>
            · {filtered.length} de {base.length} no período
          </span>
        </h3>
        <div className="device-table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>NR</th>
                <th>HU</th>
                <th>Serial</th>
                <th>Modelo</th>
                <th>Etapa</th>
                <th>Técnico</th>
                <th>Qualidade</th>
                <th>Local</th>
                <th>Recebido</th>
                <th>Custo peças</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((r, i) => (
                <tr key={`${r.hu}-${r.serial}-${i}`}>
                  <td>{r.nr || "—"}</td>
                  <td>{r.hu ?? "—"}</td>
                  <td>{r.serial || "—"}</td>
                  <td title={r.modelo}>
                    {String(r.modelo || "—").slice(0, 26)}
                    {String(r.modelo || "").length > 26 ? "…" : ""}
                  </td>
                  <td>
                    <Chip tone={etapaTone(r.step)}>{r.etapa}</Chip>
                  </td>
                  <td>{r.tecnico || "—"}</td>
                  <td>
                    {r.qualidade && r.qualidade !== "—" ? (
                      <Chip tone={qualidadeTone(r.qualidade)}>{r.qualidade}</Chip>
                    ) : r.hasReparo ? (
                      "—"
                    ) : (
                      <Chip tone="idle">sem join</Chip>
                    )}
                  </td>
                  <td>{r.local || "—"}</td>
                  <td>{formatDateBR(r.recebido)}</td>
                  <td>{formatMoney(r.custoPecas)}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="empty">
                    Nenhum aparelho com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
