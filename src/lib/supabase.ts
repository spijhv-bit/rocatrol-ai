import { createClient } from "@supabase/supabase-js";

// Sistema nuevo de Supabase 2026: sb_publishable_* (frontend) y sb_secret_* (server).
// Reemplaza al sistema legacy de JWT (anon + service_role). Aceptamos AMBOS
// nombres para tolerar entornos que aún no migraron las variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    "Faltan variables de Supabase. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o el legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  );
}

export const supabase = createClient(supabaseUrl, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
