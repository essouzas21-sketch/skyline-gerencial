import { formatInt } from "../lib/format";
import { useData } from "../context/DataContext";
import Card from "../components/ui";
import Topbar from "../components/Topbar";

export default function Producao() {
  const { panels, kpis, loading, error } = useData();

  return (
    <>
      <Topbar />
      {loading && <div className="loading card">Carregando produção…</div>}
      {error && <div className="error card">{error}</div>}

      <div className="kpi-row">
        <div className="kpi">
          <div className="lab">Finalizados</div>
          <div className="val">{formatInt(kpis.producao.finalizado)}</div>
          <div className="hint">Equipes 1–6</div>
        </div>
        <div className="kpi">
          <div className="lab">Em reparo</div>
          <div className="val">{formatInt(kpis.producao.andamento)}</div>
          <div className="hint">Andamento</div>
        </div>
        <div className="kpi">
          <div className="lab">Pausa</div>
          <div className="val">{formatInt(kpis.producao.pausado)}</div>
          <div className="hint">No período</div>
        </div>
        <div className="kpi">
          <div className="lab">Android</div>
          <div className="val">{formatInt(kpis.android.finalizado)}</div>
          <div className="hint">{formatInt(kpis.android.total)} total</div>
        </div>
        <div className="kpi">
          <div className="lab">iPhone</div>
          <div className="val">{formatInt(kpis.iphone.finalizado)}</div>
          <div className="hint">{formatInt(kpis.iphone.total)} total</div>
        </div>
      </div>

      <div className="panel-grid">
        {panels.map((panel) => (
          <Card key={panel.id} title={`${panel.title} · ${panel.subtitle}`}>
            <table className="sheet tech-table">
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Fin.</th>
                  <th>Reparo</th>
                  <th>Pausa</th>
                  <th>Σ</th>
                </tr>
              </thead>
              <tbody>
                {panel.techs.map((t) => (
                  <tr key={t.label}>
                    <td>{t.label}</td>
                    <td>{t.finalizado}</td>
                    <td>{t.andamento}</td>
                    <td>{t.pausado}</td>
                    <td style={{ fontWeight: 700 }}>{t.total}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 800 }}>Total</td>
                  <td>{panel.finalizado}</td>
                  <td>{panel.andamento}</td>
                  <td>{panel.pausado}</td>
                  <td style={{ fontWeight: 800 }}>{panel.total}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </>
  );
}
