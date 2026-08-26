import { useData } from "../context/DataContext";
import { addDaysISO, startOfMonthISO, todayISO } from "../lib/dates";

const VIEWS = [
  { id: "overview", label: "Visão Geral" },
  { id: "producao", label: "Produção" },
  { id: "cqe", label: "CQE" },
  { id: "itens", label: "NR Itens" }
];

export default function Sidebar({ view, onView }) {
  const { dateStart, dateEnd, setDateStart, setDateEnd } = useData();

  return (
    <aside className="side">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}skyline-logo-wordmark.png`} alt="Skyline mobile" width="108" height="34" />
      </div>
      <nav className="nav">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={view === v.id ? "active" : ""}
            onClick={() => onView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>
      <div className="side-foot">
        <div>
          <label htmlFor="dateStart">Início</label>
          <input
            id="dateStart"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="dateEnd">Fim</label>
          <input
            id="dateEnd"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="btn ghost"
            style={{ height: 32, padding: "0 10px", fontSize: "0.75rem", flex: 1 }}
            onClick={() => {
              const t = todayISO();
              setDateStart(t);
              setDateEnd(t);
            }}
          >
            Hoje
          </button>
          <button
            type="button"
            className="btn ghost"
            style={{ height: 32, padding: "0 10px", fontSize: "0.75rem", flex: 1 }}
            onClick={() => {
              const t = todayISO();
              setDateStart(addDaysISO(t, -6));
              setDateEnd(t);
            }}
          >
            7d
          </button>
          <button
            type="button"
            className="btn ghost"
            style={{ height: 32, padding: "0 10px", fontSize: "0.75rem", flex: 1 }}
            onClick={() => {
              const t = todayISO();
              setDateStart(startOfMonthISO(t));
              setDateEnd(t);
            }}
          >
            Mês
          </button>
        </div>
      </div>
    </aside>
  );
}
