import { Suspense } from "react";
import { QuotesWorkspace } from "@/modules/commercial/quotes/workspace";
import { getSeedQuotes } from "@/modules/commercial/quotes/repository";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <QuotesWorkspace initialQuotes={getSeedQuotes()} />
    </Suspense>
  );
}
