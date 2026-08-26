import { FETCH_TIMEOUT_MS } from "./endpoints";

export function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = Object.keys(payload);
  for (const key of keys) {
    const k = String(key).trim().toLowerCase();
    if (k === "data" || k.startsWith("data ")) {
      if (Array.isArray(payload[key])) return payload[key];
    }
  }
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

export async function fetchWebhook(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const sep = url.includes("?") ? "&" : "?";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}${sep}_t=${Date.now()}`, {
      cache: "no-store",
      mode: "cors",
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Resposta inválida (não é JSON)");
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Timeout ao carregar dados (${Math.round(timeoutMs / 1000)}s)`);
    }
    if (String(err.message || err).includes("Failed to fetch")) {
      throw new Error("Falha de rede ou CORS — verifique a conexão e atualize a página");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRows(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const json = await fetchWebhook(url, timeoutMs);
  return normalizeRows(json);
}
