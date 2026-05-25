import { createClient } from "@supabase/supabase-js";

// Sistema nuevo de Supabase 2026: sb_secret_* reemplaza al service_role legacy.
// Esta key BYPASSEA RLS — usar SOLO en server-side (API routes), nunca en cliente.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error(
    "Faltan variables de Supabase admin. Verifica SUPABASE_SECRET_KEY en .env.local."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
