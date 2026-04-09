import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateQuoteInput,
  CurrencyCode,
  Quote,
  QuoteStatus,
  QuotesDashboard,
} from "./types";

type QuoteRow = {
  id: string;
  number: string;
  customer_id: string;
  customer_snapshot_name: string;
  customer_snapshot_tax_id: string;
  solution_type: Quote["solutionType"];
  seller_name: string;
  status: Quote["status"];
  currency: Quote["currency"];
  total_amount: number;
  valid_until: string;
  created_at: string;
  notes: string;
};

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
    customerId: "customer-seed-1",
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
    customerId: "customer-seed-2",
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
    customerId: "customer-seed-5",
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
    customerId: "customer-seed-4",
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

function mapQuoteRow(row: QuoteRow): Quote {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    customerName: row.customer_snapshot_name,
    customerTaxId: row.customer_snapshot_tax_id,
    solutionType: row.solution_type,
    sellerName: row.seller_name,
    status: row.status,
    currency: row.currency,
    totalAmount: Number(row.total_amount),
    validUntil: row.valid_until,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

export async function listSupabaseQuotes(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, number, customer_id, customer_snapshot_name, customer_snapshot_tax_id, solution_type, seller_name, status, currency, total_amount, valid_until, created_at, notes",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies QuoteRow[]).map(mapQuoteRow);
}

export async function createSupabaseQuote(
  supabase: SupabaseClient,
  input: CreateQuoteInput,
) {
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      customer_id: input.customerId,
      solution_type: input.solutionType,
      seller_name: input.sellerName,
      status: "draft",
      currency: input.currency,
      total_amount: input.totalAmount,
      valid_until: input.validUntil,
      notes: input.notes,
    })
    .select(
      "id, number, customer_id, customer_snapshot_name, customer_snapshot_tax_id, solution_type, seller_name, status, currency, total_amount, valid_until, created_at, notes",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapQuoteRow(data satisfies QuoteRow);
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
    customerId: input.customerId,
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
