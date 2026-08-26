import { useData } from "../context/DataContext";
import { formatDateTimeBR, formatPeriodBR } from "../lib/dates";

export default function Topbar({ search, onSearch, searchPlaceholder, extra }) {
  const { lastUpdate, loading, reload, dateStart, dateEnd } = useData();

  return (
    <div className="topbar">
      <form
        className="search-box"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {onSearch && (
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder || "Buscar NR, HU ou IMEI"}
            autoComplete="off"
          />
        )}
        <button className="btn" type="button" onClick={reload} disabled={loading}>
          {loading ? "Carregando…" : "Atualizar"}
        </button>
        {extra}
      </form>
      <div className="meta-right">
        <strong>GERENCIAL</strong>
        <div>
          {lastUpdate
            ? `${formatPeriodBR(dateStart, dateEnd)} · ${formatDateTimeBR(lastUpdate.toISOString())}`
            : "Carregando…"}
        </div>
      </div>
    </div>
  );
}
