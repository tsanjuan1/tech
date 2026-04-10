import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrencyCode } from "@/modules/commercial/quotes/types";
import type { InventorySummaryRow } from "@/modules/inventory/stock/types";
import type { Product } from "@/modules/masters/products/types";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrdersDashboard,
  PurchaseOrderStatus,
  ReplenishmentSuggestion,
} from "@/modules/purchasing/orders/types";

type PurchaseOrderRow = {
  id: string;
  number: string;
  product_id: string;
  sales_order_id: string | null;
  product_snapshot_sku: string;
  product_snapshot_name: string;
  vendor_name: string;
  warehouse_name: string;
  buyer_name: string;
  status: PurchaseOrder["status"];
  currency: PurchaseOrder["currency"];
  quantity: number;
  unit_cost: number;
  expected_receipt_date: string;
  created_at: string;
  notes: string;
  sales_order: { number: string }[] | null;
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

function isOpenStatus(status: PurchaseOrderStatus) {
  return status !== "received" && status !== "cancelled";
}

function sumCommittedByCurrency(
  purchaseOrders: PurchaseOrder[],
  currency: CurrencyCode,
) {
  return purchaseOrders
    .filter(
      (purchaseOrder) =>
        purchaseOrder.currency === currency && isOpenStatus(purchaseOrder.status),
    )
    .reduce((total, purchaseOrder) => total + purchaseOrder.totalAmount, 0);
}

const baseDate = new Date("2026-04-10T10:00:00-03:00");

const seedPurchaseOrders: PurchaseOrder[] = [
  {
    id: "purchase-order-seed-1",
    number: "OC-2026-00001",
    productId: "product-seed-2",
    salesOrderId: "sales-order-seed-1",
    sourceSalesOrderNumber: "OV-2026-00001",
    productSku: "PRD-0002",
    productName: "PowerEdge T550",
    vendorName: "Elit",
    warehouseName: "Deposito Central",
    buyerName: "Equipo de Compras",
    status: "confirmed",
    currency: "USD",
    quantity: 1,
    unitCost: 4820,
    totalAmount: 4820,
    expectedReceiptDate: toDateOnly(addDays(baseDate, 5)),
    createdAt: toTimestamp(addDays(baseDate, -2)),
    notes: "Reposicion puntual para cumplir la orden de infraestructura ya confirmada.",
  },
  {
    id: "purchase-order-seed-2",
    number: "OC-2026-00002",
    productId: "product-seed-1",
    salesOrderId: "sales-order-seed-3",
    sourceSalesOrderNumber: "OV-2026-00003",
    productSku: "PRD-0001",
    productName: "ThinkPad E14 Gen 6",
    vendorName: "Ingram Micro",
    warehouseName: "Deposito Central",
    buyerName: "Equipo de Compras",
    status: "sent",
    currency: "USD",
    quantity: 6,
    unitCost: 780,
    totalAmount: 4680,
    expectedReceiptDate: toDateOnly(addDays(baseDate, 8)),
    createdAt: toTimestamp(addDays(baseDate, -1)),
    notes: "Reposicion preventiva para notebooks comerciales y recambio rapido.",
  },
  {
    id: "purchase-order-seed-3",
    number: "OC-2026-00003",
    productId: "product-seed-4",
    salesOrderId: null,
    sourceSalesOrderNumber: null,
    productSku: "PRD-0004",
    productName: "Microsoft 365 Business Premium",
    vendorName: "Microsoft CSP",
    warehouseName: "Licencias Digitales",
    buyerName: "Equipo de Compras",
    status: "draft",
    currency: "USD",
    quantity: 30,
    unitCost: 18,
    totalAmount: 540,
    expectedReceiptDate: toDateOnly(addDays(baseDate, 2)),
    createdAt: toTimestamp(baseDate),
    notes: "Reaprovisionamiento de licencias para pipeline de renovaciones.",
  },
];

export function getSeedPurchaseOrders() {
  return seedPurchaseOrders.map((purchaseOrder) => ({ ...purchaseOrder }));
}

function mapPurchaseOrderRow(row: PurchaseOrderRow): PurchaseOrder {
  return {
    id: row.id,
    number: row.number,
    productId: row.product_id,
    salesOrderId: row.sales_order_id,
    sourceSalesOrderNumber: row.sales_order?.[0]?.number ?? null,
    productSku: row.product_snapshot_sku,
    productName: row.product_snapshot_name,
    vendorName: row.vendor_name,
    warehouseName: row.warehouse_name,
    buyerName: row.buyer_name,
    status: row.status,
    currency: row.currency,
    quantity: Number(row.quantity),
    unitCost: Number(row.unit_cost),
    totalAmount: Number(row.quantity) * Number(row.unit_cost),
    expectedReceiptDate: row.expected_receipt_date,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

export async function listSupabasePurchaseOrders(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, number, product_id, sales_order_id, product_snapshot_sku, product_snapshot_name, vendor_name, warehouse_name, buyer_name, status, currency, quantity, unit_cost, expected_receipt_date, created_at, notes, sales_order:sales_orders(number)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies PurchaseOrderRow[]).map(mapPurchaseOrderRow);
}

export async function createSupabasePurchaseOrder(
  supabase: SupabaseClient,
  input: CreatePurchaseOrderInput,
) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      product_id: input.productId,
      sales_order_id: input.salesOrderId,
      vendor_name: input.vendorName,
      warehouse_name: input.warehouseName,
      buyer_name: input.buyerName,
      status: input.status,
      currency: input.currency,
      quantity: input.quantity,
      unit_cost: input.unitCost,
      expected_receipt_date: input.expectedReceiptDate,
      notes: input.notes,
    })
    .select(
      "id, number, product_id, sales_order_id, product_snapshot_sku, product_snapshot_name, vendor_name, warehouse_name, buyer_name, status, currency, quantity, unit_cost, expected_receipt_date, created_at, notes, sales_order:sales_orders(number)",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapPurchaseOrderRow(data satisfies PurchaseOrderRow);
}

export function getPurchaseOrdersDashboard(
  purchaseOrders: PurchaseOrder[],
  replenishmentSignalsCount: number,
): PurchaseOrdersDashboard {
  const today = new Date("2026-04-10T00:00:00-03:00");
  const nextWeek = addDays(today, 7);

  return {
    openPurchaseOrdersCount: purchaseOrders.filter((purchaseOrder) =>
      isOpenStatus(purchaseOrder.status),
    ).length,
    dueThisWeekCount: purchaseOrders.filter((purchaseOrder) => {
      if (!isOpenStatus(purchaseOrder.status)) {
        return false;
      }

      const expectedReceiptDate = new Date(
        `${purchaseOrder.expectedReceiptDate}T00:00:00`,
      );

      return expectedReceiptDate >= today && expectedReceiptDate <= nextWeek;
    }).length,
    replenishmentSignalsCount,
    committedByCurrency: {
      ARS: sumCommittedByCurrency(purchaseOrders, "ARS"),
      USD: sumCommittedByCurrency(purchaseOrders, "USD"),
    },
  };
}

export function getReplenishmentSuggestions(
  products: Product[],
  inventorySummaryRows: InventorySummaryRow[],
): ReplenishmentSuggestion[] {
  const rowsByProductId = new Map<string, InventorySummaryRow[]>();

  for (const row of inventorySummaryRows) {
    const current = rowsByProductId.get(row.productId) ?? [];
    current.push(row);
    rowsByProductId.set(row.productId, current);
  }

  const suggestions: ReplenishmentSuggestion[] = [];

  for (const product of products) {
    if (product.lifecycleStatus !== "active" || product.sourcingType !== "stocked") {
      continue;
    }

    const rows = rowsByProductId.get(product.id);

    if (!rows || rows.length === 0) {
      suggestions.push({
        key: `${product.id}::Deposito Central`,
        productId: product.id,
        sku: product.sku,
        productName: product.productName,
        warehouseName: "Deposito Central",
        availableQuantity: 0,
        reservedQuantity: 0,
        suggestedQuantity: 5,
        preferredVendor: product.preferredVendor,
        leadTimeDays: product.leadTimeDays,
      });
      continue;
    }

    for (const row of rows) {
      if (row.availableQuantity > 3) {
        continue;
      }

      suggestions.push({
        key: row.key,
        productId: row.productId,
        sku: row.sku,
        productName: row.productName,
        warehouseName: row.warehouseName,
        availableQuantity: row.availableQuantity,
        reservedQuantity: row.reservedQuantity,
        suggestedQuantity: Math.max(5 - row.availableQuantity, 1),
        preferredVendor: row.preferredVendor,
        leadTimeDays: product.leadTimeDays,
      });
    }
  }

  return suggestions.sort((left, right) => {
    if (left.availableQuantity !== right.availableQuantity) {
      return left.availableQuantity - right.availableQuantity;
    }

    return right.leadTimeDays - left.leadTimeDays;
  });
}
