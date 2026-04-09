"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModuleNav } from "@/components/module-nav";
import styles from "@/components/module-shell.module.css";
import { SubmitButton } from "@/components/submit-button";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { getSupabaseActionMessage } from "@/lib/supabase/error-message";
import {
  createSupabaseCustomer,
  getCustomersDashboard,
  listSupabaseCustomers,
} from "@/modules/masters/customers/repository";
import type {
  CreditStatus,
  Customer,
  CustomerFieldName,
  CustomerLifecycleStatus,
} from "@/modules/masters/customers/types";
import {
  creditStatusLabels,
  customerLifecycleLabels,
  customerSegmentLabels,
} from "@/modules/masters/customers/types";
import { validateCreateCustomerInput } from "@/modules/masters/customers/validation";

type CustomersWorkspaceProps = {
  initialCustomers: Customer[];
};

type FormState = {
  businessName: string;
  taxId: string;
  segment: string;
  accountManager: string;
  lifecycleStatus: string;
  creditStatus: string;
  paymentTermDays: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const defaultFormState: FormState = {
  businessName: "",
  taxId: "",
  segment: "",
  accountManager: "",
  lifecycleStatus: "prospect",
  creditStatus: "review",
  paymentTermDays: "30",
  email: "",
  phone: "",
  city: "",
  notes: "",
};

const lifecycleStatusTone: Record<CustomerLifecycleStatus, string> = {
  prospect: styles.statusSent,
  active: styles.statusApproved,
  inactive: styles.statusExpired,
};

const creditStatusTone: Record<CreditStatus, string> = {
  approved: styles.statusApproved,
  review: styles.statusDraft,
  blocked: styles.statusRejected,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeFormState(formState: FormState) {
  return {
    businessName: formState.businessName,
    taxId: formState.taxId,
    segment: formState.segment,
    accountManager: formState.accountManager,
    lifecycleStatus: formState.lifecycleStatus,
    creditStatus: formState.creditStatus,
    paymentTermDays: formState.paymentTermDays,
    email: formState.email,
    phone: formState.phone,
    city: formState.city,
    notes: formState.notes,
  };
}

export function CustomersWorkspace({ initialCustomers }: CustomersWorkspaceProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CustomerFieldName, string>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  async function loadCustomers() {
    if (!isSupabaseConfigured()) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setConnectionNotice(
          "Supabase no esta configurado todavia. La app queda mostrando los datos base para que puedas seguir navegando.",
        );
      }

      return;
    }

    try {
      const nextCustomers = await listSupabaseCustomers(getSupabaseBrowserClient());

      if (isMountedRef.current) {
        setCustomers(nextCustomers);
        setConnectionNotice(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setConnectionNotice(getSupabaseActionMessage(error, "customers-read"));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadCustomers();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const dashboard = useMemo(
    () => getCustomersDashboard(customers),
    [customers],
  );

  function handleFieldChange(field: keyof FormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as CustomerFieldName;
    if (fieldErrors[errorField]) {
      setFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateCustomerInput(normalizeFormState(formState));

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setFeedback({
        type: "error",
        message: validation.message,
      });
      return;
    }

    setIsSaving(true);

    try {
      const nextCustomer = await createSupabaseCustomer(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setCustomers((current) => [nextCustomer, ...current]);
      setFormState(defaultFormState);
      setFieldErrors({});
      setFeedback({
        type: "success",
        message: `Cliente ${nextCustomer.code} creado correctamente para ${nextCustomer.businessName}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "customers-write"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRetryConnection() {
    setIsRefreshing(true);
    setFeedback(null);
    await loadCustomers();
  }

  return (
    <main className={styles.shell}>
      <ModuleNav />

      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <span className={styles.eyebrow}>Modulo 02 / Maestros</span>
          <h1 className={styles.heroTitle}>Clientes ordenados para vender mejor</h1>
          <p className={styles.heroText}>
            Este modulo consolida la base comercial. Desde aca vamos a dejar de
            escribir clientes a mano en cada presupuesto y a preparar una
            relacion estable entre cuentas, condiciones comerciales y futuras
            ordenes de venta.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Valor del modulo</span>
              <strong className={styles.calloutValue}>Una sola ficha por cliente</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Persistencia actual</span>
              <strong className={styles.calloutValue}>Supabase en tiempo real</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Siguiente hito</span>
              <strong className={styles.calloutValue}>Orden de venta</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Que resuelve ahora</h2>
            <p className={styles.sidebarText}>
              La empresa ya puede empezar a normalizar razon social, CUIT,
              ejecutivo, condicion comercial y estado crediticio desde un
              maestro central ya persistido en Supabase para toda la operacion.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Comercial</strong>
              <span>Evita cargar mal el cliente en cada presupuesto nuevo.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Administracion</strong>
              <span>Prepara datos limpios para facturacion, cobranzas y analisis.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Escalado futuro</strong>
              <span>Base ya montada sobre PostgreSQL via Supabase.</span>
            </div>
          </div>
        </aside>
      </section>

      {feedback ? (
        <section
          className={`${styles.feedback} ${
            feedback.type === "error"
              ? styles.feedbackError
              : styles.feedbackSuccess
          }`}
        >
          {feedback.message}
        </section>
      ) : null}

      {connectionNotice ? (
        <section className={styles.feedback}>
          <div>{connectionNotice}</div>
          <div className={styles.feedbackActions}>
            <button
              className={styles.secondaryButton}
              onClick={handleRetryConnection}
              type="button"
            >
              {isRefreshing ? "Reintentando..." : "Reintentar conexion"}
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Clientes totales</span>
          <strong className={styles.metricValue}>{dashboard.totalCustomersCount}</strong>
          <p className={styles.metricHint}>
            Maestro comercial inicial para unificar cuentas y condiciones.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Cuentas activas</span>
          <strong className={styles.metricValue}>{dashboard.activeCustomersCount}</strong>
          <p className={styles.metricHint}>
            Clientes listos para ser usados en presupuestos y operaciones.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Prospectos</span>
          <strong className={styles.metricValue}>{dashboard.prospectsCount}</strong>
          <p className={styles.metricHint}>
            Oportunidades todavia no consolidadas como cuentas activas.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Credito bloqueado</span>
          <strong className={styles.metricValue}>{dashboard.creditBlockedCount}</strong>
          <p className={styles.metricHint}>
            Visibilidad temprana para evitar vender sin revisar riesgo.
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Nuevo cliente</h2>
              <p className={styles.panelText}>
                Alta inicial del maestro comercial. La ficha registra datos que
                luego deben reutilizarse en presupuestos, creditos, facturacion
                y seguimiento de la relacion con la cuenta.
              </p>
            </div>
            <span className={styles.stack}>Master data</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Razon social</span>
                <input
                  className={styles.input}
                  name="businessName"
                  onChange={(event) =>
                    handleFieldChange("businessName", event.target.value)}
                  placeholder="Empresa cliente"
                  required
                  type="text"
                  value={formState.businessName}
                />
                {fieldErrors.businessName ? (
                  <span className={styles.secondary}>{fieldErrors.businessName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>CUIT</span>
                <input
                  className={styles.input}
                  name="taxId"
                  onChange={(event) => handleFieldChange("taxId", event.target.value)}
                  placeholder="30XXXXXXXXX"
                  required
                  type="text"
                  value={formState.taxId}
                />
                {fieldErrors.taxId ? (
                  <span className={styles.secondary}>{fieldErrors.taxId}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Segmento</span>
                <select
                  className={styles.select}
                  name="segment"
                  onChange={(event) => handleFieldChange("segment", event.target.value)}
                  required
                  value={formState.segment}
                >
                  <option disabled value="">
                    Seleccionar
                  </option>
                  {Object.entries(customerSegmentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {fieldErrors.segment ? (
                  <span className={styles.secondary}>{fieldErrors.segment}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Ejecutivo de cuenta</span>
                <input
                  className={styles.input}
                  name="accountManager"
                  onChange={(event) =>
                    handleFieldChange("accountManager", event.target.value)}
                  placeholder="Responsable comercial"
                  required
                  type="text"
                  value={formState.accountManager}
                />
                {fieldErrors.accountManager ? (
                  <span className={styles.secondary}>{fieldErrors.accountManager}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Estado comercial</span>
                <select
                  className={styles.select}
                  name="lifecycleStatus"
                  onChange={(event) =>
                    handleFieldChange("lifecycleStatus", event.target.value)}
                  required
                  value={formState.lifecycleStatus}
                >
                  {Object.entries(customerLifecycleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {fieldErrors.lifecycleStatus ? (
                  <span className={styles.secondary}>{fieldErrors.lifecycleStatus}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Estado de credito</span>
                <select
                  className={styles.select}
                  name="creditStatus"
                  onChange={(event) =>
                    handleFieldChange("creditStatus", event.target.value)}
                  required
                  value={formState.creditStatus}
                >
                  {Object.entries(creditStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {fieldErrors.creditStatus ? (
                  <span className={styles.secondary}>{fieldErrors.creditStatus}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Plazo de pago</span>
                <input
                  className={styles.input}
                  min="0"
                  name="paymentTermDays"
                  onChange={(event) =>
                    handleFieldChange("paymentTermDays", event.target.value)}
                  required
                  step="1"
                  type="number"
                  value={formState.paymentTermDays}
                />
                {fieldErrors.paymentTermDays ? (
                  <span className={styles.secondary}>{fieldErrors.paymentTermDays}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input
                  className={styles.input}
                  name="email"
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  placeholder="compras@cliente.com"
                  required
                  type="email"
                  value={formState.email}
                />
                {fieldErrors.email ? (
                  <span className={styles.secondary}>{fieldErrors.email}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Telefono</span>
                <input
                  className={styles.input}
                  name="phone"
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  placeholder="+54 11 4000 0000"
                  required
                  type="text"
                  value={formState.phone}
                />
                {fieldErrors.phone ? (
                  <span className={styles.secondary}>{fieldErrors.phone}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Localidad</span>
                <input
                  className={styles.input}
                  name="city"
                  onChange={(event) => handleFieldChange("city", event.target.value)}
                  placeholder="Ciudad principal"
                  required
                  type="text"
                  value={formState.city}
                />
                {fieldErrors.city ? (
                  <span className={styles.secondary}>{fieldErrors.city}</span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Observaciones</span>
                <textarea
                  className={styles.textarea}
                  name="notes"
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Ejemplo: cliente con foco en renovacion de puestos, aprobacion de credito en revision y contacto principal del area de compras."
                  value={formState.notes}
                />
                {fieldErrors.notes ? (
                  <span className={styles.secondary}>{fieldErrors.notes}</span>
                ) : null}
              </label>
            </div>

            <div className={styles.hintRow}>
              <span>Este maestro ya queda persistido en Supabase para toda la operacion.</span>
              <span>
                {isLoading || isRefreshing
                  ? "Sincronizando datos..."
                  : "Listo para usar desde presupuestos."}
              </span>
            </div>

            <SubmitButton pending={isSaving}>Guardar cliente</SubmitButton>
          </form>

          <p className={styles.note}>
            {connectionNotice
              ? "El modulo ya esta preparado para Supabase. Cuando corras el SQL en tu proyecto, recarga la pagina y pasara a leer la base real."
              : "Este modulo ahora usa Supabase. Si acabas de correr el SQL, recarga la pagina para ver los datos iniciales ya persistidos."}
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Clientes recientes</h2>
              <p className={styles.panelText}>
                Vista operativa para comercial y administracion. Sirve para
                validar credito, contacto, condiciones y estado general de cada
                cuenta antes de cerrar negocios.
              </p>
            </div>
            <span className={styles.stack}>Base comercial</span>
          </div>

          <div className={styles.tableWrap}>
            {customers.length === 0 ? (
              <div className={styles.empty}>Todavia no hay clientes cargados.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Empresa</th>
                    <th>Segmento</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Credito</th>
                    <th>Condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <span className={styles.number}>{customer.code}</span>
                        <span className={styles.secondary}>
                          Alta {formatDate(customer.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>{customer.businessName}</span>
                        <span className={styles.secondary}>{customer.taxId}</span>
                        <span className={styles.secondary}>{customer.city}</span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {customerSegmentLabels[customer.segment]}
                        </span>
                        <span className={styles.secondary}>{customer.email}</span>
                      </td>
                      <td>
                        <span className={styles.number}>{customer.accountManager}</span>
                        <span className={styles.secondary}>{customer.phone}</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${lifecycleStatusTone[customer.lifecycleStatus]}`}
                        >
                          {customerLifecycleLabels[customer.lifecycleStatus]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${creditStatusTone[customer.creditStatus]}`}
                        >
                          {creditStatusLabels[customer.creditStatus]}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {customer.paymentTermDays} dias
                        </span>
                        <span className={styles.secondary}>{customer.notes}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
