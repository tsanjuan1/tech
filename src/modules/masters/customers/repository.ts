import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateCustomerInput,
  Customer,
  CustomersDashboard,
} from "./types";

type CustomerRow = {
  id: string;
  code: string;
  business_name: string;
  tax_id: string;
  segment: Customer["segment"];
  account_manager: string;
  lifecycle_status: Customer["lifecycleStatus"];
  credit_status: Customer["creditStatus"];
  payment_term_days: number;
  email: string;
  phone: string;
  city: string;
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

function buildCustomerId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `customer-${Date.now()}`;
}

const baseDate = new Date("2026-04-07T12:00:00-03:00");

const seedCustomers: Customer[] = [
  {
    id: "customer-seed-1",
    code: "CLI-0001",
    businessName: "Grupo Delta",
    taxId: "30715432109",
    segment: "enterprise",
    accountManager: "Lucia Perez",
    lifecycleStatus: "active",
    creditStatus: "approved",
    paymentTermDays: 30,
    email: "compras@grupodelta.com.ar",
    phone: "+54 11 5263 8890",
    city: "Buenos Aires",
    notes: "Cliente estrategico de infraestructura y renovacion de data center.",
    createdAt: toTimestamp(addDays(baseDate, -90)),
  },
  {
    id: "customer-seed-2",
    code: "CLI-0002",
    businessName: "Boreal Pharma",
    taxId: "30698211457",
    segment: "enterprise",
    accountManager: "Santiago Torres",
    lifecycleStatus: "active",
    creditStatus: "review",
    paymentTermDays: 45,
    email: "it.procurement@borealpharma.com",
    phone: "+54 11 4120 7766",
    city: "Pilar",
    notes: "Cuenta con alto potencial en software, licenciamiento y soporte.",
    createdAt: toTimestamp(addDays(baseDate, -52)),
  },
  {
    id: "customer-seed-3",
    code: "CLI-0003",
    businessName: "Municipalidad de San Andres",
    taxId: "30700333123",
    segment: "public-sector",
    accountManager: "Martina Gomez",
    lifecycleStatus: "prospect",
    creditStatus: "review",
    paymentTermDays: 60,
    email: "modernizacion@sanandres.gob.ar",
    phone: "+54 11 4982 1140",
    city: "San Andres",
    notes: "Prospecto para networking y renovacion de puestos administrativos.",
    createdAt: toTimestamp(addDays(baseDate, -18)),
  },
  {
    id: "customer-seed-4",
    code: "CLI-0004",
    businessName: "Nexo Retail",
    taxId: "30555888991",
    segment: "pyme",
    accountManager: "Lucia Perez",
    lifecycleStatus: "inactive",
    creditStatus: "blocked",
    paymentTermDays: 0,
    email: "finanzas@nexoretail.com",
    phone: "+54 341 445 2208",
    city: "Rosario",
    notes: "Cuenta pausada hasta regularizar pagos y renovar condiciones comerciales.",
    createdAt: toTimestamp(addDays(baseDate, -130)),
  },
  {
    id: "customer-seed-5",
    code: "CLI-0005",
    businessName: "Alfa Servicios",
    taxId: "30711888361",
    segment: "pyme",
    accountManager: "Martina Gomez",
    lifecycleStatus: "prospect",
    creditStatus: "approved",
    paymentTermDays: 21,
    email: "compras@alfaservicios.com.ar",
    phone: "+54 11 4322 9911",
    city: "Buenos Aires",
    notes: "Cuenta en desarrollo para renovacion de notebooks y perifericos.",
    createdAt: toTimestamp(addDays(baseDate, -12)),
  },
];

export function getSeedCustomers() {
  return seedCustomers.map((customer) => ({ ...customer }));
}

function mapCustomerRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    code: row.code,
    businessName: row.business_name,
    taxId: row.tax_id,
    segment: row.segment,
    accountManager: row.account_manager,
    lifecycleStatus: row.lifecycle_status,
    creditStatus: row.credit_status,
    paymentTermDays: row.payment_term_days,
    email: row.email,
    phone: row.phone,
    city: row.city,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listSupabaseCustomers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, code, business_name, tax_id, segment, account_manager, lifecycle_status, credit_status, payment_term_days, email, phone, city, notes, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data satisfies CustomerRow[]).map(mapCustomerRow);
}

export async function createSupabaseCustomer(
  supabase: SupabaseClient,
  input: CreateCustomerInput,
) {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_name: input.businessName,
      tax_id: input.taxId,
      segment: input.segment,
      account_manager: input.accountManager,
      lifecycle_status: input.lifecycleStatus,
      credit_status: input.creditStatus,
      payment_term_days: input.paymentTermDays,
      email: input.email,
      phone: input.phone,
      city: input.city,
      notes: input.notes,
    })
    .select(
      "id, code, business_name, tax_id, segment, account_manager, lifecycle_status, credit_status, payment_term_days, email, phone, city, notes, created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapCustomerRow(data satisfies CustomerRow);
}

export function getCustomersDashboard(customers: Customer[]): CustomersDashboard {
  return {
    totalCustomersCount: customers.length,
    activeCustomersCount: customers.filter(
      (customer) => customer.lifecycleStatus === "active",
    ).length,
    prospectsCount: customers.filter(
      (customer) => customer.lifecycleStatus === "prospect",
    ).length,
    creditBlockedCount: customers.filter(
      (customer) => customer.creditStatus === "blocked",
    ).length,
  };
}

export function createBrowserCustomer(
  input: CreateCustomerInput,
  currentCustomers: Customer[],
) {
  const sequence = String(currentCustomers.length + 1).padStart(4, "0");

  return {
    id: buildCustomerId(),
    code: `CLI-${sequence}`,
    businessName: input.businessName,
    taxId: input.taxId,
    segment: input.segment,
    accountManager: input.accountManager,
    lifecycleStatus: input.lifecycleStatus,
    creditStatus: input.creditStatus,
    paymentTermDays: input.paymentTermDays,
    email: input.email,
    phone: input.phone,
    city: input.city,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
}
