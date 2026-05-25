import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
