import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pizza, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { signIn } = useAuth();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        console.log("[Login] Checking setup-admin...");
        const res = await supabase.functions.invoke("setup-admin", {
          body: { action: "check" },
        });
        console.log("[Login] setup-admin response:", res);
        if (res.error) {
          console.error("[Login] setup-admin error:", res.error);
          setIsSetup(true); // Default to login on error
        } else if (res.data?.admin_exists) {
          setIsSetup(true);
        } else {
          setIsSetup(false);
        }
      } catch (err) {
        console.error("[Login] setup-admin catch:", err);
        setIsSetup(true); // Default to login
      }
    };
    checkSetup();
  }, []);

  // If already logged in, redirect immediately without waiting for setup check
  if (!authLoading && session) return <Navigate to="/" replace />;

  if (authLoading || isSetup === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isSetup) {
      // First-time setup: create admin
      const { data, error } = await supabase.functions.invoke("setup-admin", {
        body: { email, password },
      });
      if (data?.error) {
        toast({ title: "Setup failed", description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (error) {
        toast({ title: "Setup failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Admin created!", description: "Signing you in..." });
      // Now sign in
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        toast({ title: "Sign in failed", description: signInError.message, variant: "destructive" });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Pizza className="h-9 w-9 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">LiveSync Pizza POS</CardTitle>
          <CardDescription>
            {isSetup ? "Sign in to your account" : "Create your admin account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@livesyncpizza.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSetup ? "Sign In" : "Create Admin & Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
