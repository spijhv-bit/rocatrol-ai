// ============================================================================
// GUARDIÁN DE LOS ENDPOINTS DE IA — Fase 0 (30-jul-2026)
//
// Antes de esta capa, los 4 endpoints de IA no validaban sesión: cualquiera en
// internet podía llamarlos y gastar la ANTHROPIC_API_KEY sin límite.
//
// Cada endpoint de IA debe empezar con:
//     const ctx = await autenticar(req);
//     if (ctx instanceof NextResponse) return ctx;   // 401 / 429
// y terminar con `registrarUso(ctx, {...})`.
//
// Diseño: usamos el JWT DEL USUARIO (no la key secreta que bypassea RLS), así
// el aislamiento entre empresas lo sigue garantizando Postgres. Si un día se
// usa `supabaseAdmin` aquí, hay que filtrar por tenant a mano.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ----------------------------------------------------------------------------
// LÍMITES — generosos para uso real, cortan el abuso.
// Una cotización completa son ~40-50 llamadas, así que 120/hora por usuario
// permite 2-3 cotizaciones seguidas sin estorbar.
// ----------------------------------------------------------------------------
export const LIMITES = {
  llamadasPorUsuarioHora: 120,
  llamadasPorEmpresaHora: 400,
  costoPorEmpresaDiaUSD: 25,
  /** Tamaño máximo del cuerpo de la petición (adjuntos en base64 incluidos). */
  maxBytesCuerpo: 24 * 1024 * 1024, // 24 MB
} as const;

export interface AuthContext {
  userId: string;
  tenantId: string;
  supabase: SupabaseClient;
  endpoint: string;
  agente: string;
  inicioMs: number;
}

function json(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/**
 * Valida sesión, resuelve el tenant y aplica el límite de uso.
 * Devuelve un AuthContext, o un NextResponse listo para retornar si falla.
 */
export async function autenticar(
  req: NextRequest,
  agente: string
): Promise<AuthContext | NextResponse> {
  const inicioMs = Date.now();
  const endpoint = new URL(req.url).pathname;

  if (!supabaseUrl || !publishableKey) {
    console.error("api-auth: faltan variables de Supabase en el servidor");
    return json(500, "Configuración del servidor incompleta.");
  }

  // 1) Token del encabezado Authorization: Bearer <access_token>
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) {
    return json(401, "Inicia sesión para usar el asistente de IA.");
  }

  // 2) Cliente con el JWT del usuario → todas las consultas respetan RLS
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json(401, "Tu sesión expiró. Vuelve a iniciar sesión.");
  }
  const userId = userData.user.id;

  // 3) Tenant del usuario
  const { data: ut, error: utErr } = await supabase
    .from("users_tenants")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (utErr || !ut?.tenant_id) {
    return json(403, "Tu usuario no está asociado a ninguna empresa.");
  }
  const tenantId = ut.tenant_id as string;

  // 4) Límite de uso. Si la consulta de consumo falla, NO bloqueamos al usuario
  //    (mejor dejar pasar que romper el producto), pero lo dejamos en el log.
  const { data: uso, error: usoErr } = await supabase
    .rpc("ai_usage_window", { p_tenant_id: tenantId, p_minutos: 60 })
    .maybeSingle<{
      llamadas_tenant: number;
      llamadas_usuario: number;
      costo_tenant_dia: number;
    }>();

  if (usoErr) {
    console.warn("api-auth: no se pudo leer el consumo:", usoErr.message);
  } else if (uso) {
    const porUsuario = Number(uso.llamadas_usuario ?? 0);
    const porEmpresa = Number(uso.llamadas_tenant ?? 0);
    const costoDia = Number(uso.costo_tenant_dia ?? 0);

    if (porUsuario >= LIMITES.llamadasPorUsuarioHora) {
      return json(
        429,
        `Llegaste al límite de ${LIMITES.llamadasPorUsuarioHora} usos de IA por hora. Intenta de nuevo en un rato.`,
        { limite: "usuario_hora" }
      );
    }
    if (porEmpresa >= LIMITES.llamadasPorEmpresaHora) {
      return json(
        429,
        `Tu empresa llegó al límite de ${LIMITES.llamadasPorEmpresaHora} usos de IA por hora.`,
        { limite: "empresa_hora" }
      );
    }
    if (costoDia >= LIMITES.costoPorEmpresaDiaUSD) {
      return json(
        429,
        `Tu empresa llegó al límite de consumo de IA del día (US$${LIMITES.costoPorEmpresaDiaUSD}). Se reinicia mañana.`,
        { limite: "empresa_dia_usd" }
      );
    }
  }

  return { userId, tenantId, supabase, endpoint, agente, inicioMs };
}

/**
 * Rechaza cuerpos desmedidos ANTES de leerlos. El límite del cliente (4 archivos
 * de 5 MB) es cosmético: sin esto, cualquiera manda 200 MB de base64 y con eso
 * dispara el costo de tokens y tumba la función.
 */
export function cuerpoDemasiadoGrande(req: NextRequest): NextResponse | null {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > LIMITES.maxBytesCuerpo) {
    return json(
      413,
      `Los archivos pesan demasiado (máximo ${Math.round(
        LIMITES.maxBytesCuerpo / 1024 / 1024
      )} MB en total). Sube menos archivos o más ligeros.`
    );
  }
  return null;
}

export interface RegistroUso {
  modelo?: string;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  costo_usd?: number;
  ok?: boolean;
  error_msg?: string;
  quote_id?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Escribe la bitácora de consumo. Nunca lanza: si falla el registro, el usuario
 * ya recibió su resultado y no queremos romper la respuesta por un log.
 */
export async function registrarUso(
  ctx: AuthContext,
  r: RegistroUso
): Promise<void> {
  try {
    await ctx.supabase.from("ai_logs").insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      quote_id: r.quote_id ?? null,
      agente: ctx.agente,
      endpoint: ctx.endpoint,
      modelo: r.modelo ?? null,
      input_tokens: r.input_tokens ?? 0,
      output_tokens: r.output_tokens ?? 0,
      cache_read_tokens: r.cache_read_tokens ?? 0,
      cache_write_tokens: r.cache_write_tokens ?? 0,
      costo_usd: r.costo_usd ?? 0,
      ok: r.ok ?? true,
      error_msg: r.error_msg ?? null,
      latencia_ms: Date.now() - ctx.inicioMs,
      meta: r.meta ?? {},
    });
  } catch (err) {
    console.warn("api-auth: no se pudo registrar el uso de IA:", err);
  }
}
