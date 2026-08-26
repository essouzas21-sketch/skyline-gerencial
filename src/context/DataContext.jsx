import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API } from "../api/endpoints";
import { fetchRows } from "../api/client";
import { startOfMonthISO, todayISO } from "../lib/dates";
import {
  buildItens,
  kpiSnapshot,
  loadCqeMapped,
  loadGestaoRows,
  loadProducaoRows,
  loadRecebimentoRows,
  loadTriagemRows,
  producaoByPanel
} from "../lib/rules";
import { kpiVendas, loadVendas, vendasSpan } from "../lib/vendas";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [dateStart, setDateStart] = useState(() => startOfMonthISO());
  const [dateEnd, setDateEnd] = useState(() => todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [recRaw, setRecRaw] = useState([]);
  const [repRaw, setRepRaw] = useState([]);
  const [pecasRaw, setPecasRaw] = useState([]);
  const [vendasRaw, setVendasRaw] = useState([]);
  const [vendasError, setVendasError] = useState("");
  const [status, setStatus] = useState("Conectando aos webhooks…");
  const fittedVendas = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setVendasError("");
    setStatus("Rastreando recebimento + reparo + peças + vendas…");
    try {
      const pecasPromise = fetchRows(API.PECAS).catch(() => []);
      const vendasPromise = fetchRows(API.VENDAS).then(
        (rows) => ({ rows, error: "" }),
        (err) => ({ rows: [], error: err.message || String(err) })
      );
      const [rec, rep, pecas, vendasResult] = await Promise.all([
        fetchRows(API.RECEBIMENTO),
        fetchRows(API.REPARO),
        pecasPromise,
        vendasPromise
      ]);
      setRecRaw(rec);
      setRepRaw(rep);
      setPecasRaw(pecas);
      setVendasRaw(vendasResult.rows);
      setVendasError(vendasResult.error);
      setLastUpdate(new Date());
      setStatus("");
    } catch (err) {
      setError(err.message || String(err));
      setStatus("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recRows = useMemo(() => loadRecebimentoRows(recRaw), [recRaw]);
  const triRows = useMemo(() => loadTriagemRows(repRaw), [repRaw]);
  const gestaoRows = useMemo(() => loadGestaoRows(repRaw), [repRaw]);
  const prodRows = useMemo(() => loadProducaoRows(repRaw), [repRaw]);
  const cqeRows = useMemo(() => loadCqeMapped(repRaw), [repRaw]);
  const itens = useMemo(
    () => buildItens(recRows, repRaw, pecasRaw),
    [recRows, repRaw, pecasRaw]
  );
  const vendasNotas = useMemo(() => loadVendas(vendasRaw), [vendasRaw]);
  const faturamento = useMemo(
    () => kpiVendas(vendasNotas, dateStart, dateEnd),
    [vendasNotas, dateStart, dateEnd]
  );

  useEffect(() => {
    if (fittedVendas.current || !vendasNotas.length) return;
    const span = vendasSpan(vendasNotas);
    if (!span) return;
    fittedVendas.current = true;
    setDateStart(span.min);
    setDateEnd(span.max);
  }, [vendasNotas]);

  const kpis = useMemo(
    () =>
      kpiSnapshot({
        recRows,
        triRows,
        gestaoRows,
        prodRows,
        cqeRows,
        itens,
        start: dateStart,
        end: dateEnd
      }),
    [recRows, triRows, gestaoRows, prodRows, cqeRows, itens, dateStart, dateEnd]
  );

  const panels = useMemo(
    () => producaoByPanel(prodRows, dateStart, dateEnd),
    [prodRows, dateStart, dateEnd]
  );

  const value = {
    dateStart,
    dateEnd,
    setDateStart,
    setDateEnd,
    loading,
    error,
    status,
    lastUpdate,
    reload: load,
    vendasError,
    recRows,
    triRows,
    gestaoRows,
    prodRows,
    cqeRows,
    itens,
    kpis,
    faturamento,
    panels,
    counts: {
      recebimento: recRaw.length,
      reparo: repRaw.length,
      pecas: pecasRaw.length,
      vendas: vendasRaw.length
    }
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData precisa estar dentro de DataProvider");
  return ctx;
}
