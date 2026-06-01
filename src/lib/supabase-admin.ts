import { createClient } from "@supabase/supabase-js";

// Sistema nuevo de Supabase 2026: sb_secret_* reemplaza al service_role legacy.
// Esta key BYPASSEA RLS — usar SOLO en server-side (API routes), nunca en cliente.
// Aceptamos AMBOS nombres como fallback para tolerar entornos no migrados.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error(
    "Faltan variables de Supabase admin. Define SUPABASE_SECRET_KEY (o el legacy SUPABASE_SERVICE_ROLE_KEY)."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
