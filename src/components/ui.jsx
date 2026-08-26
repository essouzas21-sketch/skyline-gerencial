export default function Card({ title, children, style }) {
  return (
    <article className="card" style={style}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </article>
  );
}

export function StatusPill({ tone = "info", children }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function Chip({ tone = "info", children }) {
  const colors = {
    ok: { background: "var(--green-dim)", color: "var(--green)" },
    warn: { background: "var(--gold-dim)", color: "var(--gold)" },
    bad: { background: "rgba(224,49,49,0.12)", color: "var(--red)" },
    info: { background: "var(--cyan-dim)", color: "var(--cyan)" },
    idle: { background: "rgba(91,107,127,0.12)", color: "var(--muted)" }
  };
  return (
    <span className="chip" style={colors[tone] || colors.info}>
      {children}
    </span>
  );
}

export function BarList({ items, max }) {
  const top = max || Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bars">
      {items.length ? (
        items.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i style={{ width: `${Math.round((item.value / top) * 100)}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))
      ) : (
        <div className="empty" style={{ padding: 12 }}>
          Sem dados no período.
        </div>
      )}
    </div>
  );
}
