import { Suspense } from "react";
import type { Metadata } from "next";
import { CommercialWorkspaceRouter } from "@/modules/commercial/quotes/workspace";
import { getSeedQuotes } from "@/modules/commercial/quotes/repository";

export const metadata: Metadata = {
  title: "Comercial y Presupuestos",
};

export default function QuotesPage() {
  return (
    <Suspense fallback={null}>
      <CommercialWorkspaceRouter initialQuotes={getSeedQuotes()} />
    </Suspense>
  );
}
