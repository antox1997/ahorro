import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Sparkles, Mail, Lock } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: "/" });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("¡Sesión iniciada con éxito!");
        navigate({ to: "/" });
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // If email confirmation is enabled, user might need to verify, but let's notify
        if (data.session) {
          toast.success("¡Usuario registrado e inicio de sesión exitoso!");
          navigate({ to: "/" });
        } else {
          toast.success("¡Registro exitoso! Por favor verifica tu correo electrónico.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background gradients */}
      <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-success/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="card-elevated flex flex-col gap-6 p-8 backdrop-blur-sm bg-card/90">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Ingresa tus credenciales para acceder a tu panel"
                : "Comienza a tomar el control inteligente de tu dinero"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Funcionalidad demo: Contacta al administrador para restablecer tu contraseña.")
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl gradient-primary text-primary-foreground font-semibold py-6 shadow-md transition-all duration-200 hover:opacity-95"
            >
              {loading ? "Procesando..." : isLogin ? "Iniciar sesión" : "Registrarse"}
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <div className="text-center text-sm">
            {isLogin ? (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-semibold text-primary hover:underline"
                >
                  Regístrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-semibold text-primary hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
