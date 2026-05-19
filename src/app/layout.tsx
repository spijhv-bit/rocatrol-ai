import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rocatrol AI — Cotizaciones inteligentes para contratistas",
  description:
    "Sube tu plano, recibe tu cotización en 60 segundos. Bilingüe español/inglés.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
