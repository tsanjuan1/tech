import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrencyCode } from "@/modules/commercial/quotes/types";
import type {
  CreateSalesOrderInput,
  SalesOrder,
  SalesOrdersDashboard,
  SalesOrderStatus,
} from "@/modules/sales/orders/types";

type SalesOrderRow = {
  id: string;
  number: string;
  customer_id: string;
  quote_id: string | null;
  customer_snapshot_name: string;
  customer_snapshot_tax_id: string;
  solution_type: SalesOrder["solutionType"];
  seller_name: string;
  status: SalesOrder["status"];
  currency: SalesOrder["currency"];
  total_amount: number;
  requested_delivery_date: string;
  created_at: string;
  notes: string;
  quote: { number: string }[] | null;
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

function isOpenStatus(status: SalesOrderStatus) {
  return status !== "delivered";
}

function sumCommittedByCurrency(orders: SalesOrder[], currency: CurrencyCode) {
  return orders
    .filter((order) => order.currency === currency && isOpenStatus(order.status))
    .reduce((total, order) => total + order.totalAmount, 0);
}

const baseDate = new Date("2026-04-09T12:00:00-03:00");

const seedSalesOrders: SalesOrder[] = [
  {
    id: "sales-order-seed-1",
    number: "OV-2026-00001",
    customerId: "customer-seed-1",
    quoteId: "quote-seed-1",
    sourceQuoteNumber: "P-2026-00001",
    customerName: "Grupo Delta",
    customerTaxId: "30715432109",
    solutionType: "infrastructure",
    sellerName: "Lucia Perez",
    status: "ready-fulfillment",
    currency: "USD",
    totalAmount: 12450,
    requestedDeliveryDate: toDateOnly(addDays(baseDate, 4)),
    createdAt: toTimestamp(addDays(baseDate, -2)),
    notes: "Orden aprobada para preparar servidores, switching y coordinacion de entrega.",
  },
  {
    id: "sales-order-seed-2",
    number: "OV-2026-00002",
    customerId: "customer-seed-2",
    quoteId: "quote-seed-2",
    sourceQuoteNumber: "P-2026-00002",
    customerName: "Boreal Pharma",
    customerTaxId: "30698211457",
    solutionType: "licensing",
    sellerName: "Santiago Torres",
    status: "credit-check",
    currency: "ARS",
    totalAmount: 18750000,
    requestedDeliveryDate: toDateOnly(addDays(baseDate, 2)),
    createdAt: toTimestamp(addDays(baseDate, -1)),
    notes: "Pendiente validacion administrativa final antes de activar licencias y onboarding.",
  },
  {
    id: "sales-order-seed-3",
    number: "OV-2026-00003",
    customerId: "customer-seed-5",
    quoteId: null,
    sourceQuoteNumber: null,
    customerName: "Alfa Servicios",
    customerTaxId: "30711888361",
    solutionType: "workstations",
    sellerName: "Martina Gomez",
    status: "entered",
    currency: "USD",
    totalAmount: 5920,
    requestedDeliveryDate: toDateOnly(addDays(baseDate, 7)),
    createdAt: toTimestamp(baseDate),
    notes: "Orden manual para reservas de notebooks, docks y accesorios comerciales.",
  },
];

export function getSeedSalesOrders() {
  return seedSalesOrders.map((order) => ({ ...order }));
}

function mapSalesOrderRow(row: SalesOrderRow): SalesOrder {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    quoteId: row.quote_id,
    sourceQuoteNumber: row.quote?.[0]?.number ?? null,
    customerName: row.customer_snapshot_name,
    customerTaxId: row.customer_snapshot_tax_id,
    solutionType: row.solution_type,
    sellerName: row.seller_name,
    status: row.status,
    currency: row.currency,
    totalAmount: Number(row.total_amount),
    requestedDeliveryDate: row.requested_delivery_date,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

export async function listSupabaseSalesOrders(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, number, customer_id, quote_id, customer_snapshot_name, customer_snapshot_tax_id, solution_type, seller_name, status, currency, total_amount, requested_delivery_date, created_at, notes, quote:quotes(number)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies SalesOrderRow[]).map(mapSalesOrderRow);
}

export async function createSupabaseSalesOrder(
  supabase: SupabaseClient,
  input: CreateSalesOrderInput,
) {
  const { data, error } = await supabase
    .from("sales_orders")
    .insert({
      customer_id: input.customerId,
      quote_id: input.quoteId,
      solution_type: input.solutionType,
      seller_name: input.sellerName,
      status: input.status,
      currency: input.currency,
      total_amount: input.totalAmount,
      requested_delivery_date: input.requestedDeliveryDate,
      notes: input.notes,
    })
    .select(
      "id, number, customer_id, quote_id, customer_snapshot_name, customer_snapshot_tax_id, solution_type, seller_name, status, currency, total_amount, requested_delivery_date, created_at, notes, quote:quotes(number)",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapSalesOrderRow(data satisfies SalesOrderRow);
}

export function getSalesOrdersDashboard(
  salesOrders: SalesOrder[],
): SalesOrdersDashboard {
  const today = new Date("2026-04-09T00:00:00-03:00");
  const nextWeek = addDays(today, 7);

  return {
    openOrdersCount: salesOrders.filter((order) => isOpenStatus(order.status)).length,
    dueThisWeekCount: salesOrders.filter((order) => {
      if (!isOpenStatus(order.status)) {
        return false;
      }

      const requestedDeliveryDate = new Date(
        `${order.requestedDeliveryDate}T00:00:00`,
      );

      return requestedDeliveryDate >= today && requestedDeliveryDate <= nextWeek;
    }).length,
    onHoldCount: salesOrders.filter((order) => order.status === "on-hold").length,
    committedByCurrency: {
      ARS: sumCommittedByCurrency(salesOrders, "ARS"),
      USD: sumCommittedByCurrency(salesOrders, "USD"),
    },
  };
}
