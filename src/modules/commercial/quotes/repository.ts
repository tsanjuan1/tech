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

const baseDate = new Date();

const seedQuotes: Quote[] = [
  {
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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

const quoteStore = [...seedQuotes];

function cloneQuote(quote: Quote): Quote {
  return { ...quote };
}

function buildQuoteNumber() {
  const year = new Date().getFullYear();
  const sequence = String(quoteStore.length + 1).padStart(5, "0");
  return `P-${year}-${sequence}`;
}

function getTodayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function sumPipelineByCurrency(quotes: Quote[], currency: CurrencyCode) {
  return quotes
    .filter((quote) => quote.currency === currency && isOpenStatus(quote.status))
    .reduce((total, quote) => total + quote.totalAmount, 0);
}

export async function listQuotes() {
  return quoteStore
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(cloneQuote);
}

export async function createQuote(input: CreateQuoteInput) {
  const createdAt = new Date();
  const quote: Quote = {
    id: crypto.randomUUID(),
    number: buildQuoteNumber(),
    customerName: input.customerName,
    customerTaxId: input.customerTaxId,
    solutionType: input.solutionType,
    sellerName: input.sellerName,
    status: "draft",
    currency: input.currency,
    totalAmount: input.totalAmount,
    validUntil: input.validUntil,
    createdAt: createdAt.toISOString(),
    notes: input.notes,
  };

  quoteStore.unshift(quote);

  return cloneQuote(quote);
}

export async function getQuotesDashboard(): Promise<QuotesDashboard> {
  const today = getTodayDateOnly();
  const nextWeek = addDays(today, 7);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  return {
    openQuotesCount: quoteStore.filter((quote) => isOpenStatus(quote.status)).length,
    expiringThisWeekCount: quoteStore.filter((quote) => {
      if (!isOpenStatus(quote.status)) {
        return false;
      }

      const validUntil = new Date(`${quote.validUntil}T00:00:00`);
      return validUntil >= today && validUntil <= nextWeek;
    }).length,
    pipelineByCurrency: {
      ARS: sumPipelineByCurrency(quoteStore, "ARS"),
      USD: sumPipelineByCurrency(quoteStore, "USD"),
    },
    approvedThisMonthCount: quoteStore.filter((quote) => {
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
