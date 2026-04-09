export const customerLifecycleStatuses = [
  "prospect",
  "active",
  "inactive",
] as const;

export type CustomerLifecycleStatus = (typeof customerLifecycleStatuses)[number];

export const creditStatuses = ["approved", "review", "blocked"] as const;

export type CreditStatus = (typeof creditStatuses)[number];

export const customerSegments = [
  "pyme",
  "enterprise",
  "public-sector",
  "partner",
] as const;

export type CustomerSegment = (typeof customerSegments)[number];

export const customerLifecycleLabels: Record<CustomerLifecycleStatus, string> = {
  prospect: "Prospecto",
  active: "Activo",
  inactive: "Inactivo",
};

export const creditStatusLabels: Record<CreditStatus, string> = {
  approved: "Aprobado",
  review: "En revision",
  blocked: "Bloqueado",
};

export const customerSegmentLabels: Record<CustomerSegment, string> = {
  pyme: "Pyme",
  enterprise: "Enterprise",
  "public-sector": "Sector publico",
  partner: "Canal / Partner",
};

export type Customer = {
  id: string;
  code: string;
  businessName: string;
  taxId: string;
  segment: CustomerSegment;
  accountManager: string;
  lifecycleStatus: CustomerLifecycleStatus;
  creditStatus: CreditStatus;
  paymentTermDays: number;
  email: string;
  phone: string;
  city: string;
  notes: string;
  createdAt: string;
};

export type CreateCustomerInput = {
  businessName: string;
  taxId: string;
  segment: CustomerSegment;
  accountManager: string;
  lifecycleStatus: CustomerLifecycleStatus;
  creditStatus: CreditStatus;
  paymentTermDays: number;
  email: string;
  phone: string;
  city: string;
  notes: string;
};

export type CustomerFieldName =
  | "businessName"
  | "taxId"
  | "segment"
  | "accountManager"
  | "lifecycleStatus"
  | "creditStatus"
  | "paymentTermDays"
  | "email"
  | "phone"
  | "city"
  | "notes";

export type CustomerValidationResult =
  | {
      success: true;
      data: CreateCustomerInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<CustomerFieldName, string>>;
    };

export type CustomersDashboard = {
  totalCustomersCount: number;
  activeCustomersCount: number;
  prospectsCount: number;
  creditBlockedCount: number;
};
