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
  currencies,
  solutionTypeLabels,
  solutionTypes,
  type CurrencyCode,
} from "@/modules/commercial/quotes/types";
import {
  createSupabaseProduct,
  getProductsDashboard,
  listSupabaseProducts,
} from "@/modules/masters/products/repository";
import type {
  Product,
  ProductFieldName,
  ProductLifecycleStatus,
} from "@/modules/masters/products/types";
import {
  productCategories,
  productCategoryLabels,
  productLifecycleLabels,
  productSourcingTypeLabels,
  productSourcingTypes,
} from "@/modules/masters/products/types";
import { validateCreateProductInput } from "@/modules/masters/products/validation";

type ProductsWorkspaceProps = {
  initialProducts: Product[];
};

type FormState = {
  productName: string;
  brandName: string;
  category: string;
  solutionType: string;
  sourcingType: string;
  lifecycleStatus: string;
  preferredVendor: string;
  costCurrency: string;
  unitCost: string;
  listPrice: string;
  leadTimeDays: string;
  warrantyMonths: string;
  notes: string;
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const defaultFormState: FormState = {
  productName: "",
  brandName: "",
  category: "",
  solutionType: "",
  sourcingType: "stocked",
  lifecycleStatus: "active",
  preferredVendor: "",
  costCurrency: "USD",
  unitCost: "",
  listPrice: "",
  leadTimeDays: "7",
  warrantyMonths: "12",
  notes: "",
};

const lifecycleStatusTone: Record<ProductLifecycleStatus, string> = {
  active: styles.statusApproved,
  draft: styles.statusDraft,
  discontinued: styles.statusRejected,
};

const currencyLabels: Record<CurrencyCode, string> = {
  ARS: "ARS",
  USD: "USD",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeFormState(formState: FormState) {
  return {
    productName: formState.productName,
    brandName: formState.brandName,
    category: formState.category,
    solutionType: formState.solutionType,
    sourcingType: formState.sourcingType,
    lifecycleStatus: formState.lifecycleStatus,
    preferredVendor: formState.preferredVendor,
    costCurrency: formState.costCurrency,
    unitCost: formState.unitCost,
    listPrice: formState.listPrice,
    leadTimeDays: formState.leadTimeDays,
    warrantyMonths: formState.warrantyMonths,
    notes: formState.notes,
  };
}

export function ProductsWorkspace({ initialProducts }: ProductsWorkspaceProps) {
  const [products, setProducts] = useState(initialProducts);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ProductFieldName, string>>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  async function loadProducts() {
    if (!isSupabaseConfigured()) {
      if (isMountedRef.current) {
        setIsRefreshing(false);
        setConnectionNotice(
          "Supabase no esta configurado todavia. La app queda mostrando los datos base para que puedas seguir navegando.",
        );
      }

      return;
    }

    try {
      const nextProducts = await listSupabaseProducts(getSupabaseBrowserClient());

      if (isMountedRef.current) {
        setProducts(nextProducts);
        setConnectionNotice(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setConnectionNotice(getSupabaseActionMessage(error, "products-read"));
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadProducts();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const dashboard = useMemo(() => getProductsDashboard(products), [products]);

  function handleFieldChange(field: keyof FormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as ProductFieldName;
    if (fieldErrors[errorField]) {
      setFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateProductInput(normalizeFormState(formState));

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
      const nextProduct = await createSupabaseProduct(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setProducts((current) => [nextProduct, ...current]);
      setFormState(defaultFormState);
      setFieldErrors({});
      setFeedback({
        type: "success",
        message: `Producto ${nextProduct.sku} creado correctamente para ${nextProduct.productName}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "products-write"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRetryConnection() {
    setIsRefreshing(true);
    setFeedback(null);
    await loadProducts();
  }

  return (
    <main className={styles.shell}>
      <ModuleNav />

      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <span className={styles.eyebrow}>Modulo 04 / Maestros</span>
          <h1 className={styles.heroTitle}>Catalogo de productos para crecer sin desorden</h1>
          <p className={styles.heroText}>
            Este modulo consolida SKU, marca, categoria, proveedor preferido,
            costo, precio y estrategia de abastecimiento. Es la base real para
            encadenar compras, stock y armado de soluciones sin volver a cargar
            la misma informacion en cada area.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Valor del modulo</span>
              <strong className={styles.calloutValue}>Catalogo tecnico unificado</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Persistencia actual</span>
              <strong className={styles.calloutValue}>Supabase en tiempo real</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Siguiente hito</span>
              <strong className={styles.calloutValue}>Stock y compras</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Que resuelve ahora</h2>
            <p className={styles.sidebarText}>
              La empresa ya puede empezar a normalizar el catalogo comercial y
              tecnico con una sola ficha por item. Esto evita presupuestos con
              nombres inconsistentes y prepara el terreno para disponibilidad,
              costos y reposicion.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Comercial</strong>
              <span>Ordena precios, categorias y tipo de solucion antes de vender.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Compras</strong>
              <span>Deja lead time y proveedor preferido listos para abastecimiento.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Stock futuro</strong>
              <span>Base estable para reservas, recepciones y movimientos reales.</span>
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
          <span className={styles.metricLabel}>Productos totales</span>
          <strong className={styles.metricValue}>{dashboard.totalProductsCount}</strong>
          <p className={styles.metricHint}>
            Catalogo inicial listo para vincularse despues con presupuestos y stock.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Catalogo activo</span>
          <strong className={styles.metricValue}>{dashboard.activeProductsCount}</strong>
          <p className={styles.metricHint}>
            Items habilitados para usarse en nuevos procesos comerciales y operativos.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Gestionados con stock</span>
          <strong className={styles.metricValue}>{dashboard.stockedProductsCount}</strong>
          <p className={styles.metricHint}>
            Items que despues van a requerir disponibilidad, reserva y reposicion.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Lead time promedio</span>
          <strong className={styles.metricValue}>{dashboard.averageLeadTimeDays} dias</strong>
          <p className={styles.metricHint}>
            Referencia inicial para compromisos comerciales y fechas prometidas.
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Nuevo producto</h2>
              <p className={styles.panelText}>
                Alta inicial del catalogo. Esta ficha va a reutilizarse luego
                en compras, stock, armado de soluciones y listas comerciales.
              </p>
            </div>
            <span className={styles.stack}>Master data</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Nombre</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("productName", event.target.value)
                  }
                  placeholder="Ej. FortiAP 231F"
                  type="text"
                  value={formState.productName}
                />
                {fieldErrors.productName ? (
                  <span className={styles.secondary}>{fieldErrors.productName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Marca</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("brandName", event.target.value)
                  }
                  placeholder="Ej. Fortinet"
                  type="text"
                  value={formState.brandName}
                />
                {fieldErrors.brandName ? (
                  <span className={styles.secondary}>{fieldErrors.brandName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Categoria</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("category", event.target.value)
                  }
                  value={formState.category}
                >
                  <option value="">Selecciona una categoria</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {productCategoryLabels[category]}
                    </option>
                  ))}
                </select>
                {fieldErrors.category ? (
                  <span className={styles.secondary}>{fieldErrors.category}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Tipo de solucion</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("solutionType", event.target.value)
                  }
                  value={formState.solutionType}
                >
                  <option value="">Selecciona una solucion</option>
                  {solutionTypes.map((solutionType) => (
                    <option key={solutionType} value={solutionType}>
                      {solutionTypeLabels[solutionType]}
                    </option>
                  ))}
                </select>
                {fieldErrors.solutionType ? (
                  <span className={styles.secondary}>{fieldErrors.solutionType}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Abastecimiento</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("sourcingType", event.target.value)
                  }
                  value={formState.sourcingType}
                >
                  {productSourcingTypes.map((sourcingType) => (
                    <option key={sourcingType} value={sourcingType}>
                      {productSourcingTypeLabels[sourcingType]}
                    </option>
                  ))}
                </select>
                {fieldErrors.sourcingType ? (
                  <span className={styles.secondary}>{fieldErrors.sourcingType}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Estado del catalogo</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("lifecycleStatus", event.target.value)
                  }
                  value={formState.lifecycleStatus}
                >
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
                {fieldErrors.lifecycleStatus ? (
                  <span className={styles.secondary}>
                    {fieldErrors.lifecycleStatus}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Proveedor preferido</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("preferredVendor", event.target.value)
                  }
                  placeholder="Ej. Ingram Micro"
                  type="text"
                  value={formState.preferredVendor}
                />
                {fieldErrors.preferredVendor ? (
                  <span className={styles.secondary}>
                    {fieldErrors.preferredVendor}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Moneda de costo</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("costCurrency", event.target.value)
                  }
                  value={formState.costCurrency}
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currencyLabels[currency]}
                    </option>
                  ))}
                </select>
                {fieldErrors.costCurrency ? (
                  <span className={styles.secondary}>{fieldErrors.costCurrency}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Costo unitario</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  onChange={(event) =>
                    handleFieldChange("unitCost", event.target.value)
                  }
                  placeholder="0.00"
                  type="text"
                  value={formState.unitCost}
                />
                {fieldErrors.unitCost ? (
                  <span className={styles.secondary}>{fieldErrors.unitCost}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Precio de lista</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  onChange={(event) =>
                    handleFieldChange("listPrice", event.target.value)
                  }
                  placeholder="0.00"
                  type="text"
                  value={formState.listPrice}
                />
                {fieldErrors.listPrice ? (
                  <span className={styles.secondary}>{fieldErrors.listPrice}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Lead time</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  onChange={(event) =>
                    handleFieldChange("leadTimeDays", event.target.value)
                  }
                  placeholder="7"
                  type="text"
                  value={formState.leadTimeDays}
                />
                {fieldErrors.leadTimeDays ? (
                  <span className={styles.secondary}>{fieldErrors.leadTimeDays}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Garantia en meses</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  onChange={(event) =>
                    handleFieldChange("warrantyMonths", event.target.value)
                  }
                  placeholder="12"
                  type="text"
                  value={formState.warrantyMonths}
                />
                {fieldErrors.warrantyMonths ? (
                  <span className={styles.secondary}>
                    {fieldErrors.warrantyMonths}
                  </span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Observaciones</span>
                <textarea
                  className={styles.textarea}
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Detalle tecnico, alcance comercial o criterio interno del catalogo."
                  value={formState.notes}
                />
                <div className={styles.hintRow}>
                  <span>Usa este espacio para aclaraciones tecnicas o comerciales.</span>
                  <span>{formState.notes.length}/500</span>
                </div>
                {fieldErrors.notes ? (
                  <span className={styles.secondary}>{fieldErrors.notes}</span>
                ) : null}
              </label>
            </div>

            <SubmitButton pending={isSaving}>Guardar producto</SubmitButton>
          </form>

          <p className={styles.note}>
            {connectionNotice
              ? "El modulo ya esta preparado para Supabase. Cuando corras el SQL en tu proyecto, recarga la pagina y pasara a leer la base real."
              : "Este modulo queda listo para convertirse despues en stock, compras y componentes de soluciones."}
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Catalogo reciente</h2>
              <p className={styles.panelText}>
                La tabla resume los productos ya cargados y se actualiza al
                instante cuando agregas uno nuevo desde la misma web.
              </p>
            </div>
            <span className={styles.stack}>Catalogo vivo</span>
          </div>

          <div className={styles.tableWrap}>
            {products.length === 0 ? (
              <div className={styles.empty}>Todavia no hay productos cargados.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Categoria</th>
                    <th>Estado</th>
                    <th>Proveedor</th>
                    <th>Valores</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className={styles.number}>{product.sku}</span>
                        <span className={styles.secondary}>
                          Alta {formatDate(product.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>{product.productName}</span>
                        <span className={styles.secondary}>{product.brandName}</span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {productCategoryLabels[product.category]}
                        </span>
                        <span className={styles.secondary}>
                          {solutionTypeLabels[product.solutionType]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${lifecycleStatusTone[product.lifecycleStatus]}`}
                        >
                          {productLifecycleLabels[product.lifecycleStatus]}
                        </span>
                        <span className={styles.secondary}>
                          {productSourcingTypeLabels[product.sourcingType]}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>{product.preferredVendor}</span>
                        <span className={styles.secondary}>
                          Lead time {product.leadTimeDays} dias
                        </span>
                      </td>
                      <td>
                        <span className={styles.money}>
                          {formatMoney(product.listPrice, product.costCurrency)}
                        </span>
                        <span className={styles.secondary}>
                          Costo {formatMoney(product.unitCost, product.costCurrency)} ·
                          Garantia {product.warrantyMonths} meses
                        </span>
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
