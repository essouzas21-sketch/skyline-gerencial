/** Mesmos webhooks do Skyline Dashboard / NR Timeline. */
export const API = {
  REPARO: "https://automacao.skylinemobile.com.br/webhook/fi",
  RECEBIMENTO:
    "https://automacao.skylinemobile.com.br/webhook/f16be280-a545-440c-80f4-9481b1dd06f6",
  MOVIMENTACOES:
    "https://automacao.skylinemobile.com.br/webhook/480761e2-45b0-45d4-a849-82a991ebe7a9",
  PECAS:
    "https://automacao.skylinemobile.com.br/webhook/873620b8-7633-4e79-99fe-39c8b504b9a4",
  LISTA_PRECOS: "https://automacao.skylinemobile.com.br/webhook/listaprecos",
  /** Notas de venda (codtipoper, data_emissao, itens.valor_total) */
  VENDAS: "https://automacao.skylinemobile.com.br/webhook/Vendas"
};

export const FETCH_TIMEOUT_MS = 300000;
export const GRUPO_RECEBIMENTO = "6151";
export const RECEBIMENTO_DIA_EXCLUIDO = "2026-06-16";
export const ETAPAS_OPERACAO = new Set(["reparo", "gestao_pecas"]);
export const ETAPAS_TRIAGEM = new Set(["reparo", "gestao_pecas", "limpeza"]);
