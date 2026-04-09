"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "@/components/module-shell.module.css";

const modules = [
  {
    href: "/comercial/presupuestos?module=quotes",
    index: "01",
    label: "Comercial / Presupuestos",
    module: "quotes",
  },
  {
    href: "/comercial/presupuestos?module=customers",
    index: "02",
    label: "Maestros / Clientes",
    module: "customers",
  },
  {
    href: "/comercial/presupuestos?module=orders",
    index: "03",
    label: "Ventas / Ordenes",
    module: "orders",
  },
] as const;

export function ModuleNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeModule = searchParams.get("module") ?? "quotes";

  return (
    <nav className={styles.nav}>
      <span className={styles.navTitle}>Mapa inicial del ERP</span>

      <div className={styles.navList}>
        {modules.map((module) => {
          const isActive =
            activeModule === module.module &&
            (pathname === "/" || pathname === "/comercial/presupuestos");

          return (
            <Link
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              href={module.href}
              key={module.href}
            >
              <span className={styles.navIndex}>{module.index}</span>
              <span>{module.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
