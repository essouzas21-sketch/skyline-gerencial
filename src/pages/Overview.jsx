import { formatInt, formatMoney, formatPct } from "../lib/format";
import { formatPeriodBR } from "../lib/dates";
import { useData } from "../context/DataContext";
import Card, { BarList, StatusPill } from "../components/ui";
import Topbar from "../components/Topbar";

export default function Overview() {
  const { kpis, faturamento, dateStart, dateEnd, loading, error, status, counts } = useData();
  const prod = kpis.producao;
  const cqeRate = formatPct(kpis.cqe.aprovado, kpis.cqe.total);
  const stageItems = Object.entries(kpis.byStep)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
  const dominant = stageItems[0]?.label || "—";

  return (
    <>
      <Topbar />
      {loading && <div className="loading card">{status || "Carregando webhooks…"}</div>}
      {error && <div className="error card">{error}</div>}

      <div className="kpi-row kpi-row-4">
        <div className="kpi">
          <div className="lab">Faturamento diário</div>
          <div className="val money">{formatMoney(faturamento.total.valor)}</div>
          <div className="hint">{formatPeriodBR(dateStart, dateEnd)} · valor total</div>
        </div>
        <div className="kpi">
          <div className="lab">Mercado Livre · 1130</div>
          <div className="val money">{formatMoney(faturamento.ml.valor)}</div>
          <div className="hint">
            {formatInt(faturamento.ml.notas)} notas · {formatPct(faturamento.ml.valor, faturamento.total.valor)}
          </div>
        </div>
        <div className="kpi">
          <div className="lab">Loja · 1191</div>
          <div className="val money">{formatMoney(faturamento.loja.valor)}</div>
          <div className="hint">
            {formatInt(faturamento.loja.notas)} notas · {formatPct(faturamento.loja.valor, faturamento.total.valor)}
          </div>
        </div>
        <div className="kpi">
          <div className="lab">Notas</div>
          <div className="val">{formatInt(faturamento.total.notas)}</div>
          <div className="hint">{formatInt(faturamento.total.qtde)} itens</div>
        </div>
      </div>

      <div className="hero hero-nr">
        <Card>
          <h2>Missão · operação</h2>
          <h1 className="device-title">Visão geral gerencial</h1>
          <div className="kv kv-nr">
            <div>
              <span>Recebidos</span>
              <strong>{formatInt(kpis.recebimento)}</strong>
            </div>
            <div>
              <span>Triagem</span>
              <strong>{formatInt(kpis.triagem)}</strong>
            </div>
            <div>
              <span>Peças pedidas</span>
              <strong>{formatInt(kpis.gestao)}</strong>
            </div>
            <div>
              <span>Etapa dominante</span>
              <strong>{dominant}</strong>
            </div>
            <div>
              <span>Período</span>
              <strong>{formatPeriodBR(dateStart, dateEnd)}</strong>
            </div>
            <div>
              <span>Linhas API</span>
              <strong>{formatInt(counts.reparo)} reparo</strong>
            </div>
            <div className="kv-cost">
              <span>Custo aquisição</span>
              <strong>{formatMoney(kpis.custos.aquisicao)}</strong>
            </div>
            <div className="kv-cost">
              <span>Custo peças</span>
              <strong>{formatMoney(kpis.custos.pecas)}</strong>
            </div>
            <div className="kv-cost">
              <span>Custo total</span>
              <strong>{formatMoney(kpis.custos.total)}</strong>
            </div>
            <div className="kv-cost">
              <span>HUs c/ aquisição · peças</span>
              <strong>
                {kpis.custos.aqCount}/{kpis.itensPeriodo.length} · {kpis.custos.pecCount}/
                {kpis.itensPeriodo.length}
              </strong>
            </div>
          </div>
        </Card>

        <Card title="Status da missão">
          <div className="hero-stats">
            <div className="stat">
              <div className="lab">Etapa dominante</div>
              <div className="val">{dominant}</div>
              <div className="sub">{kpis.itensPeriodo.length} aparelhos no período</div>
            </div>
            <div className="stat">
              <div className="lab">Produção finalizada</div>
              <div className="val">{formatInt(prod.finalizado)}</div>
              <div className="sub">
                {formatInt(prod.andamento)} em reparo · {formatInt(prod.pausado)} pausa
              </div>
            </div>
            <div className="stat">
              <div className="lab">Yield CQE</div>
              <div className="val">{cqeRate}</div>
              <div className="sub">
                {formatInt(kpis.cqe.aprovado)} aprov. · {formatInt(kpis.cqe.reprovado)} reprov.
              </div>
            </div>
            <div className="stat">
              <div className="lab">Funil</div>
              <div className="val">
                <StatusPill tone={kpis.recebimento ? "ok" : "idle"}>pipeline</StatusPill>
              </div>
              <div className="sub">Recebimento → CQE</div>
            </div>
          </div>
        </Card>

        <Card title="Progresso CQE">
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>{cqeRate}</div>
            <div className="stat sub" style={{ marginTop: 6 }}>
              aprovados sobre inspecionados
            </div>
          </div>
        </Card>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="lab">Recebimento</div>
          <div className="val">{formatInt(kpis.recebimento)}</div>
          <div className="hint">HUs no período</div>
        </div>
        <div className="kpi">
          <div className="lab">Triagem</div>
          <div className="val">{formatInt(kpis.triagem)}</div>
          <div className="hint">Aparelhos distintos</div>
        </div>
        <div className="kpi">
          <div className="lab">Android fin.</div>
          <div className="val">{formatInt(kpis.android.finalizado)}</div>
          <div className="hint">{formatInt(kpis.android.total)} no período</div>
        </div>
        <div className="kpi">
          <div className="lab">iPhone fin.</div>
          <div className="val">{formatInt(kpis.iphone.finalizado)}</div>
          <div className="hint">{formatInt(kpis.iphone.total)} no período</div>
        </div>
        <div className="kpi">
          <div className="lab">CQE</div>
          <div className="val">{formatInt(kpis.cqe.total)}</div>
          <div className="hint">Inspeções no período</div>
        </div>
      </div>

      <div className="grid-mid">
        <Card title="Agora · estão na etapa">
          <BarList items={stageItems.slice(0, 8)} />
        </Card>
        <Card title="Linhas · Android vs iPhone">
          <div className="stage-cards">
            <div className="stage-card">
              <div className="n">{formatInt(kpis.android.finalizado)}</div>
              <div className="l">Android finalizado</div>
            </div>
            <div className="stage-card">
              <div className="n">{formatInt(kpis.iphone.finalizado)}</div>
              <div className="l">iPhone finalizado</div>
            </div>
            <div className="stage-card">
              <div className="n">{formatInt(kpis.gestaoAparelhos)}</div>
              <div className="l">Aparelhos c/ peça</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
