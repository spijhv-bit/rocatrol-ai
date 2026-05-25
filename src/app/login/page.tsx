"use client";

// ============================================================================
// LOGIN — Pantalla de inicio de sesión
//
// Layout: en desktop logo grande a la IZQUIERDA + card de login a la derecha.
// En mobile stackeado (logo arriba pequeño + card debajo).
// Toggle 👁️ para mostrar/ocultar contraseña.
// Link "¿Olvidaste tu contraseña?" → /reset-password.
// ============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      window.location.href = "/cotizar";
    }
  }, [session, authLoading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      window.location.href = "/cotizar";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar sesión. Verifica tus datos."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#1f2937]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-4 py-10 md:flex-row md:gap-16 md:px-8">
        {/* Logo grande a la izquierda */}
        <div className="flex w-full max-w-sm flex-col items-center md:max-w-md md:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-rocatrol-ai.png"
            alt="Rocatrol AI — Control inteligente de obra"
            className="h-32 w-auto md:h-48 lg:h-56"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <p className="mt-4 hidden text-center text-sm text-white/60 md:block md:text-left md:text-base">
            Cotizaciones profesionales en español <span className="text-roca-gold">en menos de 60 segundos</span>.
          </p>
        </div>

        {/* Card de login */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-gray-500">
              Bienvenido de vuelta. Continúa tu cotización donde la dejaste.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={enviando}
                  placeholder="tu@correo.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-roca-gold focus:outline-none focus:ring-1 focus:ring-roca-gold disabled:opacity-60"
                />
              </div>

              {/* Password con toggle ver/ocultar */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
                  >
                    Contraseña
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-[11px] font-medium text-roca-gold-soft hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={verPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={enviando}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-roca-gold focus:outline-none focus:ring-1 focus:ring-roca-gold disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    disabled={enviando}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {verPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-md bg-roca-gold py-2.5 text-sm font-semibold text-roca-dark transition hover:bg-roca-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? "Entrando…" : "Entrar"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link
                href="/signup"
                className="font-semibold text-roca-gold-soft hover:underline"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-[10px] text-white/40">
            © 2026 Roca Global Builders LLC · Rocatrol AI
          </p>
        </div>
      </div>
    </main>
  );
}
