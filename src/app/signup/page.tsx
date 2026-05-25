"use client";

// ============================================================================
// SIGNUP — Pantalla de registro de cuenta nueva
//
// Layout: logo grande a la IZQUIERDA + card a la derecha (desktop).
// Toggle 👁️ para mostrar/ocultar contraseña.
// Al crear cuenta, el trigger SQL handle_new_user (migración 0002) crea
// automáticamente el tenant y asigna al usuario como owner.
// ============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { session, loading: authLoading } = useAuth();
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      window.location.href = "/cotizar";
    }
  }, [session, authLoading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (empresa.trim().length < 2) {
      setError("Escribe el nombre de tu empresa o tu nombre.");
      return;
    }

    setEnviando(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { empresa_nombre: empresa.trim() },
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        window.location.href = "/cotizar";
      } else {
        setExitoso(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos crear tu cuenta. Verifica los datos o intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (exitoso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1f2937] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
          <div className="mb-3 text-5xl">📧</div>
          <h1 className="text-xl font-bold text-gray-900">¡Cuenta creada!</h1>
          <p className="mt-3 text-sm text-gray-600">
            Te enviamos un correo de confirmación a{" "}
            <strong className="text-gray-900">{email}</strong>. Haz click en el
            enlace para activar tu cuenta y empezar a cotizar.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-roca-gold px-5 py-2 text-sm font-semibold text-roca-dark hover:bg-roca-gold-soft"
          >
            Volver al login
          </Link>
        </div>
      </main>
    );
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
            Crea tu cuenta gratis y cotiza{" "}
            <span className="text-roca-gold">como un profesional en minutos</span>.
          </p>
        </div>

        {/* Card de signup */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Crea tu cuenta gratis
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sin tarjeta de crédito. Tu primera cotización en menos de 2 minutos.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="empresa"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  Nombre de tu empresa (o tu nombre)
                </label>
                <input
                  id="empresa"
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  disabled={enviando}
                  placeholder="Ej. Pinturas García LLC"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-roca-gold focus:outline-none focus:ring-1 focus:ring-roca-gold disabled:opacity-60"
                />
              </div>

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
                <label
                  htmlFor="password"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  Contraseña{" "}
                  <span className="text-gray-400">(mínimo 6 caracteres)</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={verPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    minLength={6}
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
                {enviando ? "Creando cuenta…" : "Crear cuenta gratis"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-semibold text-roca-gold-soft hover:underline"
              >
                Inicia sesión
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
