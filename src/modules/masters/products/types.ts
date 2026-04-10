import type {
  CurrencyCode,
  SolutionType,
} from "@/modules/commercial/quotes/types";

export const productCategories = [
  "workstations",
  "servers",
  "networking",
  "software",
  "services",
  "peripherals",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const productSourcingTypes = [
  "stocked",
  "project",
  "service",
  "license",
] as const;

export type ProductSourcingType = (typeof productSourcingTypes)[number];

export const productLifecycleStatuses = [
  "active",
  "draft",
  "discontinued",
] as const;

export type ProductLifecycleStatus = (typeof productLifecycleStatuses)[number];

export const productCategoryLabels: Record<ProductCategory, string> = {
  workstations: "Workstations",
  servers: "Servidores",
  networking: "Networking",
  software: "Software",
  services: "Servicios",
  peripherals: "Perifericos",
};

export const productSourcingTypeLabels: Record<ProductSourcingType, string> = {
  stocked: "Gestionado con stock",
  project: "Compra por proyecto",
  service: "Servicio profesional",
  license: "Licencia digital",
};

export const productLifecycleLabels: Record<ProductLifecycleStatus, string> = {
  active: "Activo",
  draft: "Borrador",
  discontinued: "Descontinuado",
};

export type Product = {
  id: string;
  sku: string;
  productName: string;
  brandName: string;
  category: ProductCategory;
  solutionType: SolutionType;
  sourcingType: ProductSourcingType;
  lifecycleStatus: ProductLifecycleStatus;
  preferredVendor: string;
  costCurrency: CurrencyCode;
  unitCost: number;
  listPrice: number;
  leadTimeDays: number;
  warrantyMonths: number;
  notes: string;
  createdAt: string;
};

export type CreateProductInput = {
  productName: string;
  brandName: string;
  category: ProductCategory;
  solutionType: SolutionType;
  sourcingType: ProductSourcingType;
  lifecycleStatus: ProductLifecycleStatus;
  preferredVendor: string;
  costCurrency: CurrencyCode;
  unitCost: number;
  listPrice: number;
  leadTimeDays: number;
  warrantyMonths: number;
  notes: string;
};

export type ProductFieldName =
  | "productName"
  | "brandName"
  | "category"
  | "solutionType"
  | "sourcingType"
  | "lifecycleStatus"
  | "preferredVendor"
  | "costCurrency"
  | "unitCost"
  | "listPrice"
  | "leadTimeDays"
  | "warrantyMonths"
  | "notes";

export type ProductValidationResult =
  | {
      success: true;
      data: CreateProductInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<ProductFieldName, string>>;
    };

export type ProductsDashboard = {
  totalProductsCount: number;
  activeProductsCount: number;
  stockedProductsCount: number;
  averageLeadTimeDays: number;
};
