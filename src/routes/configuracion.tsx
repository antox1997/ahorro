import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/configuracion")({
  component: SettingsPage,
});

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-6">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  return (
    <AppShell>
      <PageHeader title="Configuración" description="Personaliza tu experiencia." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Perfil" description="Información básica de tu cuenta.">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue="Usuario Demo" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} readOnly />
          </div>
        </Section>

        <Section title="Preferencias" description="Idioma y moneda predeterminados.">
          <div className="grid gap-2">
            <Label>Idioma</Label>
            <Select defaultValue="es">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Moneda</Label>
            <Select defaultValue="usd">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD - Dólar</SelectItem>
                <SelectItem value="mxn">MXN - Peso Mexicano</SelectItem>
                <SelectItem value="eur">EUR - Euro</SelectItem>
                <SelectItem value="cop">COP - Peso Colombiano</SelectItem>
                <SelectItem value="ars">ARS - Peso Argentino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="start">Balance inicial</Label>
            <Input id="start" type="number" defaultValue={1000} />
          </div>
        </Section>

        <Section title="Apariencia">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Modo oscuro</div>
              <div className="text-xs text-muted-foreground">Cambia el tema desde el encabezado.</div>
            </div>
            <Switch defaultChecked={typeof document !== "undefined" && document.documentElement.classList.contains("dark")} />
          </div>
        </Section>

        <Section title="Integraciones" description="Estado de la conexión con tu backend.">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Supabase</div>
              <div className="text-xs text-muted-foreground">
                {isSupabaseConfigured
                  ? "Credenciales configuradas en el entorno."
                  : "Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY reales en .env."}
              </div>
            </div>
            <Button
              variant={isSupabaseConfigured ? "default" : "outline"}
              size="sm"
              onClick={() =>
                toast.info(
                  isSupabaseConfigured
                    ? "Supabase está configurado."
                    : "Agrega las credenciales reales de Supabase en .env."
                )
              }
            >
              {isSupabaseConfigured ? "Conectado" : "Pendiente"}
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Autenticación</div>
              <div className="text-xs text-muted-foreground">Registro, inicio de sesión y sesión persistente con Supabase Auth.</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info(email ? "Sesión activa." : "Sin sesión activa.")}>
              Verificar
            </Button>
          </div>
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <Button className="rounded-full gradient-primary text-primary-foreground" onClick={() => toast.success("Cambios guardados (demo).")}>
          Guardar cambios
        </Button>
      </div>
    </AppShell>
  );
}
