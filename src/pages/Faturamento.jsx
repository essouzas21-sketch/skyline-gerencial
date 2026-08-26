import { formatPeriodBR } from "../lib/dates";
import { formatInt, formatMoney, formatPct } from "../lib/format";
import { formatEmissaoBR } from "../lib/vendas";
import { useData } from "../context/DataContext";
import Card from "../components/ui";
import Topbar from "../components/Topbar";

export default function Faturamento() {
  const { faturamento, dateStart, dateEnd, setDateStart, setDateEnd, loading, error, vendasError } = useData();
  const { ml, loja, total, byDay, rows, loaded, foraDoPeriodo, semData, span } = faturamento;

  return (
    <>
      <Topbar />
      {loading && <div className="loading card">Carregando vendas…</div>}
      {error && <div className="error card">{error}</div>}
      {vendasError && <div className="error card">Vendas: {vendasError}</div>}

      <div className="kpi-row kpi-row-4">
        <div className="kpi">
          <div className="lab">Total</div>
          <div className="val money">{formatMoney(total.valor)}</div>
          <div className="hint">{formatPeriodBR(dateStart, dateEnd)}</div>
        </div>
        <div className="kpi">
          <div className="lab">Mercado Livre · 1130</div>
          <div className="val money">{formatMoney(ml.valor)}</div>
          <div className="hint">
            {formatInt(ml.notas)} notas · {formatPct(ml.valor, total.valor)}
          </div>
        </div>
        <div className="kpi">
          <div className="lab">Loja · 1191</div>
          <div className="val money">{formatMoney(loja.valor)}</div>
          <div className="hint">
            {formatInt(loja.notas)} notas · {formatPct(loja.valor, total.valor)}
          </div>
        </div>
        <div className="kpi">
          <div className="lab">Itens faturados</div>
          <div className="val">{formatInt(total.qtde)}</div>
          <div className="hint">{formatInt(total.notas)} notas no período</div>
        </div>
      </div>

      <Card title="Faturamento diário · canais de venda">
        <div className="device-table-wrap">
          <table className="sheet tech-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Mercado Livre</th>
                <th>Loja</th>
                <th>Total</th>
                <th>Notas</th>
                <th>Qtde</th>
              </tr>
            </thead>
            <tbody>
              {byDay.map((d) => (
                <tr key={d.date}>
                  <td>{d.label || formatEmissaoBR(d.date)}</td>
                  <td>{formatMoney(d.ml)}</td>
                  <td>{formatMoney(d.loja)}</td>
                  <td style={{ fontWeight: 800 }}>{formatMoney(d.total)}</td>
                  <td>{d.notas}</td>
                  <td>{d.qtde}</td>
                </tr>
              ))}
              {byDay.length > 0 && (
                <tr>
                  <td style={{ fontWeight: 800 }}>Total</td>
                  <td style={{ fontWeight: 800 }}>{formatMoney(ml.valor)}</td>
                  <td style={{ fontWeight: 800 }}>{formatMoney(loja.valor)}</td>
                  <td style={{ fontWeight: 800 }}>{formatMoney(total.valor)}</td>
                  <td style={{ fontWeight: 800 }}>{total.notas}</td>
                  <td style={{ fontWeight: 800 }}>{total.qtde}</td>
                </tr>
              )}
              {!byDay.length && (
                <tr>
                  <td colSpan={6} className="empty">
                    Nenhuma nota 1130/1191 no período {formatPeriodBR(dateStart, dateEnd)}.
                    {loaded ? ` ${loaded} nota(s) na API` : " Nenhuma nota carregada."}
                    {foraDoPeriodo ? ` · ${foraDoPeriodo} fora do filtro.` : ""}
                    {semData ? ` · ${semData} sem data_emissao válida.` : ""}
                    {span ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          className="btn ghost"
                          style={{ height: 28, padding: "0 10px", fontSize: "0.75rem" }}
                          onClick={() => {
                            setDateStart(span.min);
                            setDateEnd(span.max);
                          }}
                        >
                          Ver {formatEmissaoBR(span.min)} a {formatEmissaoBR(span.max)}
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Notas no período">
        <div className="device-table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Data</th>
                <th>Nota</th>
                <th>Canal</th>
                <th>TOP</th>
                <th>Itens</th>
                <th>Qtde</th>
                <th>Valor total</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((n, i) => (
                <tr key={`${n.nunota}-${i}`}>
                  <td title={String(n.dataEmissao || "")}>{formatEmissaoBR(n.dataEmissao || n.data)}</td>
                  <td>{n.numnota ?? n.nunota ?? "—"}</td>
                  <td>{n.canalLabel}</td>
                  <td>{n.codtipoper}</td>
                  <td>{n.itens}</td>
                  <td>{n.qtde}</td>
                  <td>{formatMoney(n.valor)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    Sem notas no filtro.
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
