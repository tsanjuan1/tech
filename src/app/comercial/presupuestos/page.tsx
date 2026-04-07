import type { Metadata } from "next";
import { SubmitButton } from "@/components/submit-button";
import { createQuoteAction } from "@/modules/commercial/quotes/actions";
import {
  getQuotesDashboard,
  listQuotes,
} from "@/modules/commercial/quotes/repository";
import type { CurrencyCode, QuoteStatus } from "@/modules/commercial/quotes/types";
import {
  solutionTypeLabels,
  statusLabels,
} from "@/modules/commercial/quotes/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comercial y Presupuestos",
};

const statusClassNames: Record<QuoteStatus, string> = {
  draft: styles.statusDraft,
  sent: styles.statusSent,
  approved: styles.statusApproved,
  rejected: styles.statusRejected,
  expired: styles.statusExpired,
};

const currencyLabels: Record<CurrencyCode, string> = {
  ARS: "ARS",
  USD: "USD",
};

function readSingleValue(value?: string | string[]) {
  return typeof value === "string" ? value : undefined;
}

function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getDaysUntil(value: string) {
  const dueDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const diff = dueDate.getTime() - startOfToday.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function QuotesPage(props: {
  searchParams: Promise<{
    feedback?: string | string[];
    type?: string | string[];
  }>;
}) {
  const searchParams = await props.searchParams;
  const feedback = readSingleValue(searchParams.feedback);
  const feedbackType = readSingleValue(searchParams.type) === "error"
    ? "error"
    : "success";

  const [quotes, dashboard] = await Promise.all([
    listQuotes(),
    getQuotesDashboard(),
  ]);

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <span className={styles.eyebrow}>Modulo 01 / Comercial</span>
          <h1 className={styles.heroTitle}>Presupuestos que ordenan toda la operacion</h1>
          <p className={styles.heroText}>
            Empezamos por el punto donde nace el negocio: el presupuesto.
            Desde aca vamos a convertir a orden de venta, controlar pipeline,
            medir margen y preparar la integracion con stock, facturacion y
            cobranzas.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Enfoque inicial</span>
              <strong className={styles.calloutValue}>Ventas B2B de tecnologia</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Persistencia actual</span>
              <strong className={styles.calloutValue}>Repositorio en memoria</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Siguiente hito</span>
              <strong className={styles.calloutValue}>Orden de venta</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Software y lenguajes elegidos</h2>
            <p className={styles.sidebarText}>
              TypeScript end-to-end para acelerar construccion, reforzar el
              tipado y colaborar mejor con Claude/Codex. UI y backend viven en
              un mismo monolito modular, listo para evolucionar.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Frontend + BFF</strong>
              <span>Next.js 16, React 19, App Router y Server Actions</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Herramientas de equipo</strong>
              <span>VS Code, GitHub, Bruno, DBeaver y convenciones en CLAUDE.md</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Escalado previsto</strong>
              <span>PostgreSQL, auth por roles, stock y facturacion ARCA</span>
            </div>
          </div>
        </aside>
      </section>

      {feedback ? (
        <section
          className={`${styles.feedback} ${
            feedbackType === "error"
              ? styles.feedbackError
              : styles.feedbackSuccess
          }`}
        >
          {feedback}
        </section>
      ) : null}

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Presupuestos activos</span>
          <strong className={styles.metricValue}>{dashboard.openQuotesCount}</strong>
          <p className={styles.metricHint}>
            Incluye borradores, enviados y aprobados todavia no convertidos a
            venta.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Vencen en 7 dias</span>
          <strong className={styles.metricValue}>{dashboard.expiringThisWeekCount}</strong>
          <p className={styles.metricHint}>
            Este indicador ayuda a priorizar seguimiento comercial inmediato.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Pipeline USD</span>
          <strong className={styles.metricValue}>
            {formatMoney(dashboard.pipelineByCurrency.USD, "USD")}
          </strong>
          <p className={styles.metricHint}>
            Separamos moneda para no mezclar gestion comercial con conversiones
            artificiales.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Pipeline ARS</span>
          <strong className={styles.metricValue}>
            {formatMoney(dashboard.pipelineByCurrency.ARS, "ARS")}
          </strong>
          <p className={styles.metricHint}>
            Valor operativo local listo para futuras reglas de margen e
            impuestos.
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Nuevo presupuesto</h2>
              <p className={styles.panelText}>
                Primera captura estructurada del negocio. Este alta ya deja
                cliente, vendedor, moneda y tipo de solucion listos para
                evolucionar a una orden de venta formal.
              </p>
            </div>
            <span className={styles.stack}>Server Action</span>
          </div>

          <form action={createQuoteAction} className={styles.form}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Cliente</span>
                <input
                  className={styles.input}
                  name="customerName"
                  placeholder="Empresa cliente"
                  required
                  type="text"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>CUIT</span>
                <input
                  className={styles.input}
                  name="customerTaxId"
                  placeholder="30XXXXXXXXX"
                  required
                  type="text"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Tipo de solucion</span>
                <select className={styles.select} defaultValue="" name="solutionType" required>
                  <option disabled value="">
                    Seleccionar
                  </option>
                  {Object.entries(solutionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Vendedor</span>
                <input
                  className={styles.input}
                  name="sellerName"
                  placeholder="Responsable comercial"
                  required
                  type="text"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Moneda</span>
                <select className={styles.select} defaultValue="USD" name="currency" required>
                  {Object.entries(currencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Total</span>
                <input
                  className={styles.input}
                  min="0"
                  name="totalAmount"
                  placeholder="0"
                  required
                  step="0.01"
                  type="number"
                />
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Valido hasta</span>
                <input className={styles.input} name="validUntil" required type="date" />
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Alcance comercial</span>
                <textarea
                  className={styles.textarea}
                  name="notes"
                  placeholder="Ejemplo: renovacion de notebooks para 45 usuarios, licencias M365 e instalacion inicial."
                />
              </label>
            </div>

            <div className={styles.hintRow}>
              <span>Version inicial preparada para sumar aprobaciones, items y margen.</span>
              <span>No mezcla datos fiscales con datos comerciales.</span>
            </div>

            <SubmitButton>Guardar presupuesto</SubmitButton>
          </form>

          <p className={styles.note}>
            La API publica de este modulo ya esta disponible en
            <code> /api/commercial/quotes</code> para integraciones y pruebas.
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Presupuestos recientes</h2>
              <p className={styles.panelText}>
                Vista operativa para comercial y gerencia. El objetivo es que
                cada presupuesto tenga contexto suficiente para seguimiento y
                futura conversion.
              </p>
            </div>
            <span className={styles.stack}>JSON + UI</span>
          </div>

          <div className={styles.tableWrap}>
            {quotes.length === 0 ? (
              <div className={styles.empty}>Todavia no hay presupuestos cargados.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Cliente</th>
                    <th>Solucion</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => {
                    const daysUntil = getDaysUntil(quote.validUntil);

                    return (
                      <tr key={quote.id}>
                        <td>
                          <span className={styles.number}>{quote.number}</span>
                          <span className={styles.secondary}>
                            Creado {formatDate(quote.createdAt.slice(0, 10))}
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>{quote.customerName}</span>
                          <span className={styles.secondary}>{quote.customerTaxId}</span>
                        </td>
                        <td>
                          <span className={styles.number}>
                            {solutionTypeLabels[quote.solutionType]}
                          </span>
                          <span className={styles.secondary}>{quote.notes}</span>
                        </td>
                        <td>
                          <span className={styles.number}>{quote.sellerName}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${statusClassNames[quote.status]}`}
                          >
                            {statusLabels[quote.status]}
                          </span>
                        </td>
                        <td>
                          <span className={styles.money}>
                            {formatMoney(quote.totalAmount, quote.currency)}
                          </span>
                          <span className={styles.secondary}>{quote.currency}</span>
                        </td>
                        <td>
                          <span className={styles.number}>{formatDate(quote.validUntil)}</span>
                          <span className={styles.secondary}>
                            {daysUntil > 0
                              ? `Vence en ${daysUntil} dias`
                              : daysUntil === 0
                                ? "Vence hoy"
                                : "Ya vencido"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
