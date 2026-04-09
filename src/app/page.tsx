import { Suspense } from "react";
import { CommercialWorkspaceRouter } from "@/modules/commercial/quotes/workspace";
import { getSeedQuotes } from "@/modules/commercial/quotes/repository";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <CommercialWorkspaceRouter initialQuotes={getSeedQuotes()} />
    </Suspense>
  );
}
