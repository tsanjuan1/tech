import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomersWorkspace } from "@/modules/masters/customers/workspace";
import { getSeedCustomers } from "@/modules/masters/customers/repository";

export const metadata: Metadata = {
  title: "Maestros y Clientes",
};

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersWorkspace initialCustomers={getSeedCustomers()} />
    </Suspense>
  );
}
