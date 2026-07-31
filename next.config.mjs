/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El binario de Chrome para los PDF no debe empaquetarse con webpack:
  // se resuelve en runtime (Fase 3, /api/pdf-cotizacion).
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
