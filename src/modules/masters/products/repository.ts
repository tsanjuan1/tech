import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateProductInput,
  Product,
  ProductsDashboard,
} from "@/modules/masters/products/types";

type ProductRow = {
  id: string;
  sku: string;
  product_name: string;
  brand_name: string;
  category: Product["category"];
  solution_type: Product["solutionType"];
  sourcing_type: Product["sourcingType"];
  lifecycle_status: Product["lifecycleStatus"];
  preferred_vendor: string;
  cost_currency: Product["costCurrency"];
  unit_cost: number;
  list_price: number;
  lead_time_days: number;
  warranty_months: number;
  notes: string;
  created_at: string;
};

function addDays(baseDate: Date, amount: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toTimestamp(value: Date) {
  return value.toISOString();
}

const baseDate = new Date("2026-04-10T10:00:00-03:00");

const seedProducts: Product[] = [
  {
    id: "product-seed-1",
    sku: "PRD-0001",
    productName: "ThinkPad E14 Gen 6",
    brandName: "Lenovo",
    category: "workstations",
    solutionType: "workstations",
    sourcingType: "stocked",
    lifecycleStatus: "active",
    preferredVendor: "Ingram Micro",
    costCurrency: "USD",
    unitCost: 780,
    listPrice: 940,
    leadTimeDays: 7,
    warrantyMonths: 12,
    notes: "Notebook corporativa recomendada para recambios de puestos administrativos.",
    createdAt: toTimestamp(addDays(baseDate, -45)),
  },
  {
    id: "product-seed-2",
    sku: "PRD-0002",
    productName: "PowerEdge T550",
    brandName: "Dell",
    category: "servers",
    solutionType: "infrastructure",
    sourcingType: "project",
    lifecycleStatus: "active",
    preferredVendor: "Elit",
    costCurrency: "USD",
    unitCost: 4820,
    listPrice: 5610,
    leadTimeDays: 18,
    warrantyMonths: 36,
    notes: "Servidor para proyectos de virtualizacion y sucursales con crecimiento sostenido.",
    createdAt: toTimestamp(addDays(baseDate, -32)),
  },
  {
    id: "product-seed-3",
    sku: "PRD-0003",
    productName: "FortiSwitch 148F",
    brandName: "Fortinet",
    category: "networking",
    solutionType: "networking",
    sourcingType: "stocked",
    lifecycleStatus: "active",
    preferredVendor: "Air Computers",
    costCurrency: "USD",
    unitCost: 2100,
    listPrice: 2490,
    leadTimeDays: 10,
    warrantyMonths: 12,
    notes: "Switch capa 3 para despliegues medianos con integracion de seguridad.",
    createdAt: toTimestamp(addDays(baseDate, -24)),
  },
  {
    id: "product-seed-4",
    sku: "PRD-0004",
    productName: "Microsoft 365 Business Premium",
    brandName: "Microsoft",
    category: "software",
    solutionType: "licensing",
    sourcingType: "license",
    lifecycleStatus: "active",
    preferredVendor: "Microsoft CSP",
    costCurrency: "USD",
    unitCost: 18,
    listPrice: 24,
    leadTimeDays: 1,
    warrantyMonths: 0,
    notes: "Licencia anual recomendada para clientes pyme con requisitos de productividad y seguridad.",
    createdAt: toTimestamp(addDays(baseDate, -16)),
  },
  {
    id: "product-seed-5",
    sku: "PRD-0005",
    productName: "Onsite Preventive Support",
    brandName: "Servicio propio",
    category: "services",
    solutionType: "technical-service",
    sourcingType: "service",
    lifecycleStatus: "draft",
    preferredVendor: "Equipo tecnico interno",
    costCurrency: "ARS",
    unitCost: 85000,
    listPrice: 130000,
    leadTimeDays: 3,
    warrantyMonths: 1,
    notes: "Servicio base para contratos de mantenimiento y visitas preventivas.",
    createdAt: toTimestamp(addDays(baseDate, -8)),
  },
];

export function getSeedProducts() {
  return seedProducts.map((product) => ({ ...product }));
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    productName: row.product_name,
    brandName: row.brand_name,
    category: row.category,
    solutionType: row.solution_type,
    sourcingType: row.sourcing_type,
    lifecycleStatus: row.lifecycle_status,
    preferredVendor: row.preferred_vendor,
    costCurrency: row.cost_currency,
    unitCost: Number(row.unit_cost),
    listPrice: Number(row.list_price),
    leadTimeDays: row.lead_time_days,
    warrantyMonths: row.warranty_months,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listSupabaseProducts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, product_name, brand_name, category, solution_type, sourcing_type, lifecycle_status, preferred_vendor, cost_currency, unit_cost, list_price, lead_time_days, warranty_months, notes, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies ProductRow[]).map(mapProductRow);
}

export async function createSupabaseProduct(
  supabase: SupabaseClient,
  input: CreateProductInput,
) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      product_name: input.productName,
      brand_name: input.brandName,
      category: input.category,
      solution_type: input.solutionType,
      sourcing_type: input.sourcingType,
      lifecycle_status: input.lifecycleStatus,
      preferred_vendor: input.preferredVendor,
      cost_currency: input.costCurrency,
      unit_cost: input.unitCost,
      list_price: input.listPrice,
      lead_time_days: input.leadTimeDays,
      warranty_months: input.warrantyMonths,
      notes: input.notes,
    })
    .select(
      "id, sku, product_name, brand_name, category, solution_type, sourcing_type, lifecycle_status, preferred_vendor, cost_currency, unit_cost, list_price, lead_time_days, warranty_months, notes, created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapProductRow(data satisfies ProductRow);
}

export function getProductsDashboard(products: Product[]): ProductsDashboard {
  const averageLeadTimeDays =
    products.length === 0
      ? 0
      : Math.round(
          products.reduce((total, product) => total + product.leadTimeDays, 0) /
            products.length,
        );

  return {
    totalProductsCount: products.length,
    activeProductsCount: products.filter(
      (product) => product.lifecycleStatus === "active",
    ).length,
    stockedProductsCount: products.filter(
      (product) => product.sourcingType === "stocked",
    ).length,
    averageLeadTimeDays,
  };
}
