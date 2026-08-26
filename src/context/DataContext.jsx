import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  const [status, setStatus] = useState("Conectando aos webhooks…");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setStatus("Rastreando recebimento + reparo + peças…");
    try {
      const pecasPromise = fetchRows(API.PECAS).catch(() => []);
      const [rec, rep, pecas] = await Promise.all([
        fetchRows(API.RECEBIMENTO),
        fetchRows(API.REPARO),
        pecasPromise
      ]);
      setRecRaw(rec);
      setRepRaw(rep);
      setPecasRaw(pecas);
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
    recRows,
    triRows,
    gestaoRows,
    prodRows,
    cqeRows,
    itens,
    kpis,
    panels,
    counts: {
      recebimento: recRaw.length,
      reparo: repRaw.length,
      pecas: pecasRaw.length
    }
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData precisa estar dentro de DataProvider");
  return ctx;
}
