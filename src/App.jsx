import { useState } from "react";
import { DataProvider } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Producao from "./pages/Producao";
import Cqe from "./pages/Cqe";

const PAGES = {
  overview: Overview,
  producao: Producao,
  cqe: Cqe
};

const PAGE_LABELS = {
  overview: "Visão Geral",
  producao: "Produção",
  cqe: "CQE"
};

function Shell() {
  const [view, setView] = useState("overview");
  const Page = PAGES[view] || Overview;

  return (
    <div className="app-shell">
      <Sidebar view={view} onView={setView} />
      <main className="main">
        <div className="mobile-nav">
          {Object.keys(PAGES).map((id) => (
            <button
              key={id}
              type="button"
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
            >
              {PAGE_LABELS[id]}
            </button>
          ))}
        </div>
        <Page />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}
