"use client";

// ============================================================================
// RESET PASSWORD — Recuperar / crear contraseña por primera vez
//
// Tiene 2 modos según el contexto:
//   1. Sin sesión PASSWORD_RECOVERY: pide email para enviar el link de reset
//   2. Con sesión PASSWORD_RECOVERY (llegó por el email): permite establecer
//      una contraseña nueva
//
// Supabase Auth maneja el flujo: resetPasswordForEmail() envía el correo,
// el link redirige aquí con un token en el hash, supabase detecta el evento
// PASSWORD_RECOVERY automáticamente.
// ============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  // Modo: 'pedir' = pide email, 'cambiar' = establece nueva contraseña
  const [modo, setModo] = useState<"pedir" | "cambiar">("pedir");

  // Modo pedir
  const [email, setEmail] = useState("");
  const [enviadoEmail, setEnviadoEmail] = useState(false);

  // Modo cambiar
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cambioExitoso, setCambioExitoso] = useState(false);

  // Compartido
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Supabase dispara el evento PASSWORD_RECOVERY cuando el usuario llega
  // desde el link del email. En ese momento cambiamos a modo "cambiar".
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setModo("cambiar");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function pedirReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );
      if (resetError) throw resetError;
      setEnviadoEmail(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos enviar el correo. Verifica el email e intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setCambioExitoso(true);
      // Esperar 1.5s para que el usuario vea el mensaje, luego al wizard
      setTimeout(() => {
        window.location.href = "/cotizar";
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos cambiar la contraseña."
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
            alt="Rocatrol AI"
            className="h-32 w-auto md:h-48 lg:h-56"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            {/* === MODO 1: pedir email === */}
            {modo === "pedir" && !enviadoEmail && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  Recuperar contraseña
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Te enviaremos un correo con un enlace seguro para que
                  establezcas una contraseña nueva.
                </p>

                <form onSubmit={pedirReset} className="mt-6 space-y-4">
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
                    {enviando ? "Enviando…" : "Enviar correo de recuperación"}
                  </button>
                </form>
              </>
            )}

            {/* === MODO 1.5: confirmación de email enviado === */}
            {modo === "pedir" && enviadoEmail && (
              <div className="text-center">
                <div className="mb-3 text-5xl">📧</div>
                <h1 className="text-xl font-bold text-gray-900">
                  Revisa tu correo
                </h1>
                <p className="mt-3 text-sm text-gray-600">
                  Te enviamos un enlace a{" "}
                  <strong className="text-gray-900">{email}</strong>. Haz click
                  en el enlace para crear una nueva contraseña.
                </p>
                <p className="mt-3 text-[11px] text-gray-400">
                  Si no lo encuentras, revisa la carpeta de spam.
                </p>
              </div>
            )}

            {/* === MODO 2: cambiar contraseña (después del link del email) === */}
            {modo === "cambiar" && !cambioExitoso && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  Nueva contraseña
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Crea una contraseña nueva para tu cuenta.
                </p>

                <form onSubmit={cambiarPassword} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      Nueva contraseña{" "}
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
                        title={verPassword ? "Ocultar" : "Mostrar"}
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
                    {enviando ? "Guardando…" : "Guardar contraseña nueva"}
                  </button>
                </form>
              </>
            )}

            {/* === MODO 2.5: cambio exitoso === */}
            {modo === "cambiar" && cambioExitoso && (
              <div className="text-center">
                <div className="mb-3 text-5xl">✅</div>
                <h1 className="text-xl font-bold text-gray-900">
                  ¡Contraseña actualizada!
                </h1>
                <p className="mt-3 text-sm text-gray-600">
                  Te llevamos a tu wizard de cotizaciones en un momento…
                </p>
              </div>
            )}

            {/* Footer común */}
            <p className="mt-5 text-center text-xs text-gray-500">
              <Link
                href="/login"
                className="font-semibold text-roca-gold-soft hover:underline"
              >
                ← Volver al login
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
