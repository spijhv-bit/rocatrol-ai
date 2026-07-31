// ============================================================================
// CLIENTE DE LOS ENDPOINTS DE IA — Fase 0 (30-jul-2026)
//
// Un solo lugar donde:
//   1. Se adjunta el token de sesión (los endpoints ya exigen autenticación).
//   2. Se aplica un TIMEOUT real con AbortController — antes, si Anthropic
//      tardaba, el usuario se quedaba con el spinner girando para siempre.
//   3. Se traducen los errores del servidor a mensajes en español.
//
// Uso:  const data = await postIA<MiRespuesta>("/api/preciar", { ... });
// Los errores llegan como `ErrorIA`, con `status` para distinguir 401 de 429.
// ============================================================================

import { supabase } from "@/lib/supabase";

/** Tiempo máximo de espera por endpoint (ms). El Intérprete es el más lento. */
export const TIMEOUTS_IA: Record<string, number> = {
  "/api/interpretar": 90_000,
  "/api/preciar": 60_000,
  "/api/cuantificar": 60_000,
  "/api/precio-insumo": 45_000,
};
const TIMEOUT_DEFAULT = 60_000;

export class ErrorIA extends Error {
  readonly status: number;
  readonly limite?: string;
  constructor(message: string, status: number, limite?: string) {
    super(message);
    this.name = "ErrorIA";
    this.status = status;
    this.limite = limite;
  }
}

export interface OpcionesIA {
  /** Señal externa para cancelar (ej. el usuario cerró el modal). */
  signal?: AbortSignal;
  /** Sobrescribe el timeout por defecto del endpoint. */
  timeoutMs?: number;
}

export async function postIA<T>(
  endpoint: string,
  body: unknown,
  opciones: OpcionesIA = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ErrorIA("Inicia sesión para usar el asistente de IA.", 401);
  }

  const timeoutMs =
    opciones.timeoutMs ?? TIMEOUTS_IA[endpoint] ?? TIMEOUT_DEFAULT;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
  // Si quien llama trae su propia señal, la encadenamos.
  const externa = opciones.signal;
  const alAbortar = () => controlador.abort();
  externa?.addEventListener("abort", alAbortar);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controlador.signal,
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (payload && typeof payload.error === "string" && payload.error) ||
        `El servidor respondió con error ${res.status}.`;
      const limite =
        payload && typeof payload.limite === "string" ? payload.limite : undefined;
      throw new ErrorIA(msg, res.status, limite);
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ErrorIA) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      // Distinguimos "lo canceló el usuario" de "se acabó el tiempo".
      if (externa?.aborted) {
        throw new ErrorIA("Operación cancelada.", 0);
      }
      throw new ErrorIA(
        `La IA tardó más de ${Math.round(
          timeoutMs / 1000
        )} segundos y se canceló. Intenta de nuevo o con menos archivos.`,
        408
      );
    }
    throw new ErrorIA(
      err instanceof Error ? err.message : "No se pudo conectar con el servidor.",
      0
    );
  } finally {
    clearTimeout(temporizador);
    externa?.removeEventListener("abort", alAbortar);
  }
}
