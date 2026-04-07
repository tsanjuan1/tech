import { QuotesWorkspace } from "@/modules/commercial/quotes/workspace";
import { getSeedQuotes } from "@/modules/commercial/quotes/repository";

export default function Home() {
  return <QuotesWorkspace initialQuotes={getSeedQuotes()} />;
}
