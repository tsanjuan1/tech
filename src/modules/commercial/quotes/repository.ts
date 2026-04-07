import type {
  CreateQuoteInput,
  CurrencyCode,
  Quote,
  QuoteStatus,
  QuotesDashboard,
} from "./types";

function addDays(baseDate: Date, amount: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toTimestamp(value: Date) {
  return value.toISOString();
}

function isOpenStatus(status: QuoteStatus) {
  return status === "draft" || status === "sent" || status === "approved";
}

function sumPipelineByCurrency(quotes: Quote[], currency: CurrencyCode) {
  return quotes
    .filter((quote) => quote.currency === currency && isOpenStatus(quote.status))
    .reduce((total, quote) => total + quote.totalAmount, 0);
}

function buildQuoteId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `quote-${Date.now()}`;
}

const baseDate = new Date("2026-04-07T12:00:00-03:00");

const seedQuotes: Quote[] = [
  {
    id: "quote-seed-1",
    number: "P-2026-00001",
    customerName: "Grupo Delta",
    customerTaxId: "30715432109",
    solutionType: "infrastructure",
    sellerName: "Lucia Perez",
    status: "approved",
    currency: "USD",
    totalAmount: 12450,
    validUntil: toDateOnly(addDays(baseDate, 8)),
    createdAt: toTimestamp(addDays(baseDate, -3)),
    notes: "Renovacion de servidores y switching para casa central.",
  },
  {
    id: "quote-seed-2",
    number: "P-2026-00002",
    customerName: "Boreal Pharma",
    customerTaxId: "30698211457",
    solutionType: "licensing",
    sellerName: "Santiago Torres",
    status: "sent",
    currency: "ARS",
    totalAmount: 18750000,
    validUntil: toDateOnly(addDays(baseDate, 3)),
    createdAt: toTimestamp(addDays(baseDate, -1)),
    notes: "Suscripcion anual, onboarding y soporte premium.",
  },
  {
    id: "quote-seed-3",
    number: "P-2026-00003",
    customerName: "Alfa Servicios",
    customerTaxId: "30711888361",
    solutionType: "workstations",
    sellerName: "Martina Gomez",
    status: "draft",
    currency: "USD",
    totalAmount: 5920,
    validUntil: toDateOnly(addDays(baseDate, 11)),
    createdAt: toTimestamp(baseDate),
    notes: "Armado de notebooks y docking stations para equipo comercial.",
  },
  {
    id: "quote-seed-4",
    number: "P-2026-00004",
    customerName: "Nexo Retail",
    customerTaxId: "30555888991",
    solutionType: "technical-service",
    sellerName: "Lucia Perez",
    status: "rejected",
    currency: "USD",
    totalAmount: 3400,
    validUntil: toDateOnly(addDays(baseDate, 2)),
    createdAt: toTimestamp(addDays(baseDate, -6)),
    notes: "Mantenimiento preventivo y reparaciones puntuales.",
  },
];

export function getSeedQuotes() {
  return seedQuotes.map((quote) => ({ ...quote }));
}

export function getQuotesDashboard(quotes: Quote[]): QuotesDashboard {
  const today = new Date("2026-04-07T00:00:00-03:00");
  const nextWeek = addDays(today, 7);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  return {
    openQuotesCount: quotes.filter((quote) => isOpenStatus(quote.status)).length,
    expiringThisWeekCount: quotes.filter((quote) => {
      if (!isOpenStatus(quote.status)) {
        return false;
      }

      const validUntil = new Date(`${quote.validUntil}T00:00:00`);
      return validUntil >= today && validUntil <= nextWeek;
    }).length,
    pipelineByCurrency: {
      ARS: sumPipelineByCurrency(quotes, "ARS"),
      USD: sumPipelineByCurrency(quotes, "USD"),
    },
    approvedThisMonthCount: quotes.filter((quote) => {
      if (quote.status !== "approved") {
        return false;
      }

      const createdAt = new Date(quote.createdAt);
      return (
        createdAt.getFullYear() === currentYear &&
        createdAt.getMonth() === currentMonth
      );
    }).length,
  };
}

export function createBrowserQuote(input: CreateQuoteInput, currentQuotes: Quote[]) {
  const year = new Date().getFullYear();
  const sequence = String(currentQuotes.length + 1).padStart(5, "0");

  return {
    id: buildQuoteId(),
    number: `P-${year}-${sequence}`,
    customerName: input.customerName,
    customerTaxId: input.customerTaxId,
    solutionType: input.solutionType,
    sellerName: input.sellerName,
    status: "draft" as const,
    currency: input.currency,
    totalAmount: input.totalAmount,
    validUntil: input.validUntil,
    createdAt: new Date().toISOString(),
    notes: input.notes,
  };
}
