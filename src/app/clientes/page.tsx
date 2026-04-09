import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomersWorkspace } from "@/modules/masters/customers/workspace";
import { getSeedCustomers } from "@/modules/masters/customers/repository";

export const metadata: Metadata = {
  title: "Clientes",
};

export default function CustomersAliasPage() {
  return (
    <Suspense fallback={null}>
      <CustomersWorkspace initialCustomers={getSeedCustomers()} />
    </Suspense>
  );
}
