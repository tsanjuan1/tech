import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/modules/masters/products/types";
import type { SalesOrder } from "@/modules/sales/orders/types";
import type {
  CreateInventoryAllocationInput,
  CreateInventoryMovementInput,
  InventoryAllocation,
  InventoryAllocationType,
  InventoryDashboard,
  InventoryMovement,
  InventoryMovementType,
  InventorySummaryRow,
  InventoryTimelineEntry,
} from "@/modules/inventory/stock/types";

type InventoryMovementRow = {
  id: string;
  product_id: string;
  warehouse_name: string;
  movement_type: InventoryMovement["movementType"];
  quantity: number;
  reference_note: string;
  created_at: string;
};

type InventoryAllocationRow = {
  id: string;
  sales_order_id: string;
  product_id: string;
  warehouse_name: string;
  allocation_type: InventoryAllocation["allocationType"];
  quantity: number;
  notes: string;
  created_at: string;
};

type InventoryAggregate = {
  onHandQuantity: number;
  reservedQuantity: number;
};

function addDays(baseDate: Date, amount: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toTimestamp(value: Date) {
  return value.toISOString();
}

function movementDelta(type: InventoryMovementType, quantity: number) {
  if (type === "adjustment-out" || type === "dispatch") {
    return -quantity;
  }

  return quantity;
}

function allocationDelta(type: InventoryAllocationType, quantity: number) {
  if (type === "release" || type === "deliver") {
    return -quantity;
  }

  return quantity;
}

const baseDate = new Date("2026-04-10T10:00:00-03:00");

const seedInventoryMovements: InventoryMovement[] = [
  {
    id: "inventory-movement-seed-1",
    productId: "product-seed-1",
    warehouseName: "Deposito Central",
    movementType: "receipt",
    quantity: 15,
    referenceNote: "Ingreso inicial para notebooks corporativas.",
    createdAt: toTimestamp(addDays(baseDate, -6)),
  },
  {
    id: "inventory-movement-seed-2",
    productId: "product-seed-1",
    warehouseName: "Deposito Central",
    movementType: "dispatch",
    quantity: 2,
    referenceNote: "Salida para entrega parcial de recambio comercial.",
    createdAt: toTimestamp(addDays(baseDate, -1)),
  },
  {
    id: "inventory-movement-seed-3",
    productId: "product-seed-2",
    warehouseName: "Deposito Central",
    movementType: "receipt",
    quantity: 4,
    referenceNote: "Recepcion para proyecto de infraestructura.",
    createdAt: toTimestamp(addDays(baseDate, -5)),
  },
  {
    id: "inventory-movement-seed-4",
    productId: "product-seed-3",
    warehouseName: "Deposito Central",
    movementType: "receipt",
    quantity: 12,
    referenceNote: "Ingreso de switches para despliegues medianos.",
    createdAt: toTimestamp(addDays(baseDate, -4)),
  },
  {
    id: "inventory-movement-seed-5",
    productId: "product-seed-3",
    warehouseName: "Deposito Central",
    movementType: "adjustment-out",
    quantity: 1,
    referenceNote: "Ajuste por equipo de demo asignado a preventa.",
    createdAt: toTimestamp(addDays(baseDate, -2)),
  },
  {
    id: "inventory-movement-seed-6",
    productId: "product-seed-4",
    warehouseName: "Licencias Digitales",
    movementType: "receipt",
    quantity: 60,
    referenceNote: "Bloque de licencias anual para clientes activos.",
    createdAt: toTimestamp(addDays(baseDate, -3)),
  },
];

const seedInventoryAllocations: InventoryAllocation[] = [
  {
    id: "inventory-allocation-seed-1",
    salesOrderId: "sales-order-seed-1",
    productId: "product-seed-2",
    warehouseName: "Deposito Central",
    allocationType: "reserve",
    quantity: 1,
    notes: "Reserva para OV-2026-00001.",
    createdAt: toTimestamp(addDays(baseDate, -1)),
  },
  {
    id: "inventory-allocation-seed-2",
    salesOrderId: "sales-order-seed-2",
    productId: "product-seed-4",
    warehouseName: "Licencias Digitales",
    allocationType: "reserve",
    quantity: 25,
    notes: "Reserva inicial para licencias anuales.",
    createdAt: toTimestamp(addDays(baseDate, -1)),
  },
  {
    id: "inventory-allocation-seed-3",
    salesOrderId: "sales-order-seed-3",
    productId: "product-seed-1",
    warehouseName: "Deposito Central",
    allocationType: "reserve",
    quantity: 4,
    notes: "Reserva para notebooks del equipo comercial.",
    createdAt: toTimestamp(baseDate),
  },
];

export function getSeedInventoryMovements() {
  return seedInventoryMovements.map((movement) => ({ ...movement }));
}

export function getSeedInventoryAllocations() {
  return seedInventoryAllocations.map((allocation) => ({ ...allocation }));
}

function mapInventoryMovementRow(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    warehouseName: row.warehouse_name,
    movementType: row.movement_type,
    quantity: Number(row.quantity),
    referenceNote: row.reference_note,
    createdAt: row.created_at,
  };
}

function mapInventoryAllocationRow(row: InventoryAllocationRow): InventoryAllocation {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    productId: row.product_id,
    warehouseName: row.warehouse_name,
    allocationType: row.allocation_type,
    quantity: Number(row.quantity),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listSupabaseInventoryMovements(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      "id, product_id, warehouse_name, movement_type, quantity, reference_note, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies InventoryMovementRow[]).map(mapInventoryMovementRow);
}

export async function listSupabaseInventoryAllocations(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("inventory_allocations")
    .select(
      "id, sales_order_id, product_id, warehouse_name, allocation_type, quantity, notes, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies InventoryAllocationRow[]).map(mapInventoryAllocationRow);
}

export async function createSupabaseInventoryMovement(
  supabase: SupabaseClient,
  input: CreateInventoryMovementInput,
) {
  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      product_id: input.productId,
      warehouse_name: input.warehouseName,
      movement_type: input.movementType,
      quantity: input.quantity,
      reference_note: input.referenceNote,
    })
    .select(
      "id, product_id, warehouse_name, movement_type, quantity, reference_note, created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapInventoryMovementRow(data satisfies InventoryMovementRow);
}

export async function createSupabaseInventoryAllocation(
  supabase: SupabaseClient,
  input: CreateInventoryAllocationInput,
) {
  const { data, error } = await supabase
    .from("inventory_allocations")
    .insert({
      sales_order_id: input.salesOrderId,
      product_id: input.productId,
      warehouse_name: input.warehouseName,
      allocation_type: input.allocationType,
      quantity: input.quantity,
      notes: input.notes,
    })
    .select(
      "id, sales_order_id, product_id, warehouse_name, allocation_type, quantity, notes, created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapInventoryAllocationRow(data satisfies InventoryAllocationRow);
}

function buildInventoryAggregate(
  movements: InventoryMovement[],
  allocations: InventoryAllocation[],
) {
  const aggregate = new Map<string, InventoryAggregate>();

  function ensureEntry(key: string) {
    const current =
      aggregate.get(key) ?? { onHandQuantity: 0, reservedQuantity: 0 };
    aggregate.set(key, current);
    return current;
  }

  for (const movement of movements) {
    const key = `${movement.productId}::${movement.warehouseName}`;
    const current = ensureEntry(key);
    current.onHandQuantity += movementDelta(movement.movementType, movement.quantity);
  }

  for (const allocation of allocations) {
    const key = `${allocation.productId}::${allocation.warehouseName}`;
    const current = ensureEntry(key);
    current.reservedQuantity += allocationDelta(
      allocation.allocationType,
      allocation.quantity,
    );
  }

  return aggregate;
}

export function getInventoryDashboard(
  movements: InventoryMovement[],
  allocations: InventoryAllocation[],
): InventoryDashboard {
  const aggregate = buildInventoryAggregate(movements, allocations);

  let onHandUnits = 0;
  let reservedUnits = 0;
  let availableUnits = 0;

  for (const entry of aggregate.values()) {
    onHandUnits += entry.onHandQuantity;
    reservedUnits += Math.max(entry.reservedQuantity, 0);
    availableUnits += entry.onHandQuantity - entry.reservedQuantity;
  }

  return {
    trackedPositionsCount: aggregate.size,
    onHandUnits,
    reservedUnits,
    availableUnits,
  };
}

export function getInventorySummaryRows(
  products: Product[],
  movements: InventoryMovement[],
  allocations: InventoryAllocation[],
): InventorySummaryRow[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const aggregate = buildInventoryAggregate(movements, allocations);

  const rows = Array.from(aggregate.entries())
    .map(([key, entry]) => {
      const [productId, warehouseName] = key.split("::");
      const product = productsById.get(productId);

      if (!product) {
        return null;
      }

      return {
        key,
        productId,
        sku: product.sku,
        productName: product.productName,
        brandName: product.brandName,
        warehouseName,
        onHandQuantity: entry.onHandQuantity,
        reservedQuantity: Math.max(entry.reservedQuantity, 0),
        availableQuantity: entry.onHandQuantity - entry.reservedQuantity,
        sourcingType: product.sourcingType,
        preferredVendor: product.preferredVendor,
      } satisfies InventorySummaryRow;
    })
    .filter((row): row is InventorySummaryRow => row !== null);

  return rows.sort((left, right) => {
    if (left.warehouseName !== right.warehouseName) {
      return left.warehouseName.localeCompare(right.warehouseName, "es");
    }

    return left.productName.localeCompare(right.productName, "es");
  });
}

export function getInventoryTimelineEntries(
  products: Product[],
  salesOrders: SalesOrder[],
  movements: InventoryMovement[],
  allocations: InventoryAllocation[],
): InventoryTimelineEntry[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const ordersById = new Map(salesOrders.map((order) => [order.id, order]));

  const movementEntries = movements.map((movement) => {
    const product = productsById.get(movement.productId);

    return {
      id: `movement-${movement.id}`,
      createdAt: movement.createdAt,
      kind: "movement" as const,
      warehouseName: movement.warehouseName,
      productSku: product?.sku ?? "Sin SKU",
      productName: product?.productName ?? "Producto sin catalogo",
      quantity: movement.quantity,
      label: inventoryMovementLabel(movement.movementType),
      referenceText: movement.referenceNote || "Movimiento sin referencia",
    };
  });

  const allocationEntries = allocations.map((allocation) => {
    const product = productsById.get(allocation.productId);
    const order = ordersById.get(allocation.salesOrderId);
    const orderText = order
      ? `${order.number} · ${order.customerName}`
      : "Orden sin referencia";

    return {
      id: `allocation-${allocation.id}`,
      createdAt: allocation.createdAt,
      kind: "allocation" as const,
      warehouseName: allocation.warehouseName,
      productSku: product?.sku ?? "Sin SKU",
      productName: product?.productName ?? "Producto sin catalogo",
      quantity: allocation.quantity,
      label: inventoryAllocationLabel(allocation.allocationType),
      referenceText: allocation.notes
        ? `${orderText} · ${allocation.notes}`
        : orderText,
    };
  });

  return [...movementEntries, ...allocationEntries].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

function inventoryMovementLabel(type: InventoryMovementType) {
  switch (type) {
    case "receipt":
      return "Ingreso";
    case "adjustment-in":
      return "Ajuste positivo";
    case "adjustment-out":
      return "Ajuste negativo";
    case "dispatch":
      return "Despacho";
    case "return":
      return "Devolucion";
  }
}

function inventoryAllocationLabel(type: InventoryAllocationType) {
  switch (type) {
    case "reserve":
      return "Reserva";
    case "release":
      return "Liberacion";
    case "deliver":
      return "Entrega logica";
  }
}
