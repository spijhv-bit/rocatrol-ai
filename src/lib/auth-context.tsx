"use client";

// ============================================================================
// AUTH CONTEXT — Proveedor de estado de autenticación Supabase
//
// Envuelve la app y expone `useAuth()` con: { session, user, loading, signOut }.
// Mantiene la sesión sincronizada con cambios (login/logout/refresh token).
//
// Patrón: client-side, sin middleware (regla del proyecto).
// La verificación de "¿estoy logueado?" se hace en cada página protegida.
// ============================================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Cargar sesión inicial con timeout de 3s (regla del proyecto)
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      clearTimeout(timeout);
      setSession(data.session);
      setLoading(false);
    });

    // Suscribirse a cambios (login, logout, refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // window.location en lugar de router.push (regla del proyecto: NO router.replace)
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
