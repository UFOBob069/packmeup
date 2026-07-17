import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { assertSupabaseConfigured, supabase } from "./supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      assertSupabaseConfigured();
    } catch (cause) {
      console.error(cause);
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url.startsWith("com.packforvacation.app://auth/callback")) return;
      const code = new URL(url).searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        await Browser.close();
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative
      ? "com.packforvacation.app://auth/callback"
      : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });

    if (error) throw error;
    if (isNative && data.url) {
      await Browser.open({ url: data.url, presentationStyle: "popover" });
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, loading, signInWithGoogle, signOut }),
    [session, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
