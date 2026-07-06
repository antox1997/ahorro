import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Moon, Plus, Search, Sun, LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { TransactionDialog } from "../common/TransactionDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications } from "@/services/api";
import { toast } from "sonner";

export function AppHeader() {
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [txOpen, setTxOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: Boolean(user),
  });

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);

    // Get current user session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    toast.success("Sesión cerrada");
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger />
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar transacciones, categorías, cuentas..."
          className="h-10 rounded-full border-transparent bg-muted pl-10"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="hidden gap-2 rounded-full sm:inline-flex cursor-pointer"
          onClick={() => setTxOpen(true)}
        >
          <Plus className="h-4 w-4" /> Agregar
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.message}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold uppercase text-primary">
                  {user.email?.charAt(0) ?? "U"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <TransactionDialog isOpen={txOpen} onOpenChange={setTxOpen} />
    </header>
  );
}
