import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "cashier" | "chef";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return (data?.role as AppRole) ?? null;
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        console.log("[Auth] onAuthStateChange:", _event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            const userRole = await fetchRole(session.user.id);
            if (mounted) setRole(userRole);
          } catch (err) {
            console.error("[Auth] fetchRole error:", err);
            if (mounted) setRole(null);
          }
        } else {
          setRole(null);
        }
        if (mounted) setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      console.log("[Auth] getSession:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const userRole = await fetchRole(session.user.id);
          if (mounted) setRole(userRole);
        } catch (err) {
          console.error("[Auth] fetchRole error:", err);
          if (mounted) setRole(null);
        }
      }
      if (mounted) setLoading(false);
    }).catch((err) => {
      console.error("[Auth] getSession error:", err);
      if (mounted) setLoading(false);
    });

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Auth] Timeout - forcing loading=false");
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
