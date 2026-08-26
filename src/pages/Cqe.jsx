import { useMemo } from "react";
import { formatInt, formatPct } from "../lib/format";
import { aggregateCount } from "../lib/rules";
import { useData } from "../context/DataContext";
import Card, { BarList } from "../components/ui";
import Topbar from "../components/Topbar";
import { formatDateBR } from "../lib/dates";

export default function Cqe() {
  const { kpis, loading, error } = useData();
  const rows = kpis.cqe.rows || [];
  const motivos = useMemo(
    () =>
      aggregateCount(
        rows.filter((r) => r.decisao === "reprovado"),
        (r) => r.motivo
      )
        .slice(0, 8)
        .map(([label, value]) => ({ label, value })),
    [rows]
  );
  const tecnicos = useMemo(
    () =>
      aggregateCount(rows, (r) => r.tecnico)
        .slice(0, 8)
        .map(([label, value]) => ({ label, value })),
    [rows]
  );

  return (
    <>
      <Topbar />
      {loading && <div className="loading card">Carregando CQE…</div>}
      {error && <div className="error card">{error}</div>}

      <div className="kpi-row">
        <div className="kpi">
          <div className="lab">Aprovados</div>
          <div className="val">{formatInt(kpis.cqe.aprovado)}</div>
          <div className="hint">{formatPct(kpis.cqe.aprovado, kpis.cqe.total)} do total</div>
        </div>
        <div className="kpi">
          <div className="lab">Reprovados</div>
          <div className="val">{formatInt(kpis.cqe.reprovado)}</div>
          <div className="hint">{formatPct(kpis.cqe.reprovado, kpis.cqe.total)} do total</div>
        </div>
        <div className="kpi">
          <div className="lab">Inspeções</div>
          <div className="val">{formatInt(kpis.cqe.total)}</div>
          <div className="hint">No período</div>
        </div>
        <div className="kpi">
          <div className="lab">Yield</div>
          <div className="val">{formatPct(kpis.cqe.aprovado, kpis.cqe.total)}</div>
          <div className="hint">Aprovado / inspecionado</div>
        </div>
        <div className="kpi">
          <div className="lab">Motivos</div>
          <div className="val">{formatInt(motivos.length)}</div>
          <div className="hint">Top reprova</div>
        </div>
      </div>

      <div className="grid-mid">
        <Card title="Motivos de reprovação">
          <BarList items={motivos} />
        </Card>
        <Card title="Volume por técnico">
          <BarList items={tecnicos} />
        </Card>
      </div>

      <Card title="Inspeções no período">
        <div className="device-table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>NR</th>
                <th>Serial</th>
                <th>Modelo</th>
                <th>Decisão</th>
                <th>Motivo</th>
                <th>Técnico</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r, i) => (
                <tr key={`${r.id}-${i}`}>
                  <td>{r.nr}</td>
                  <td>{r.serial}</td>
                  <td title={r.modelo}>
                    {String(r.modelo).slice(0, 28)}
                    {String(r.modelo).length > 28 ? "…" : ""}
                  </td>
                  <td>{r.decisao}</td>
                  <td title={r.motivo}>
                    {String(r.motivo).slice(0, 36)}
                    {String(r.motivo).length > 36 ? "…" : ""}
                  </td>
                  <td>{r.tecnico}</td>
                  <td>{formatDateBR(r.data_qualidade)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    Nenhuma inspeção no período.
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
