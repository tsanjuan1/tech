import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "B2B Tech ERP",
    template: "%s | B2B Tech ERP",
  },
  description:
    "ERP modular para ventas, presupuestos, stock, facturacion y finanzas en una Pyme B2B de tecnologia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
