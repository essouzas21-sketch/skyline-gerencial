import DateFilters from "./DateFilters";

const VIEWS = [
  { id: "overview", label: "Visão Geral" },
  { id: "faturamento", label: "Faturamento" },
  { id: "producao", label: "Produção" },
  { id: "cqe", label: "CQE" }
];

export default function Sidebar({ view, onView }) {
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
        <DateFilters idPrefix="side-date" />
      </div>
    </aside>
  );
}
