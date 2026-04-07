import type { Metadata } from "next";
import { QuotesWorkspace } from "@/modules/commercial/quotes/workspace";
import { getSeedQuotes } from "@/modules/commercial/quotes/repository";

export const metadata: Metadata = {
  title: "Comercial y Presupuestos",
};

export default function QuotesPage() {
  return <QuotesWorkspace initialQuotes={getSeedQuotes()} />;
}
