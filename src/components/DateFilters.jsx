import { addDaysISO, startOfMonthISO, todayISO } from "../lib/dates";
import { useData } from "../context/DataContext";

export default function DateFilters({ idPrefix = "date" }) {
  const { dateStart, dateEnd, setDateStart, setDateEnd, faturamento } = useData();
  const span = faturamento?.span;

  return (
    <div className="date-filters">
      <label className="date-filters-field">
        <span>Início</span>
        <input
          id={`${idPrefix}Start`}
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
        />
      </label>
      <label className="date-filters-field">
        <span>Fim</span>
        <input
          id={`${idPrefix}End`}
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
        />
      </label>
      <div className="date-filters-btns">
        <button
          type="button"
          className="btn ghost"
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
          onClick={() => {
            const t = todayISO();
            setDateStart(startOfMonthISO(t));
            setDateEnd(t);
          }}
        >
          Mês
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={!span}
          onClick={() => {
            if (!span) return;
            setDateStart(span.min);
            setDateEnd(span.max);
          }}
        >
          Todos
        </button>
      </div>
    </div>
  );
}
