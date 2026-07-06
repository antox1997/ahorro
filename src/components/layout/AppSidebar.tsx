import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Wallet,
  Calendar,
  PieChart,
  Target,
  CreditCard,
  FolderTree,
  Repeat,
  BarChart3,
  Brain,
  Settings,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Transacciones", url: "/transacciones", icon: Wallet },
  { title: "Calendario", url: "/calendario", icon: Calendar },
  { title: "Presupuesto", url: "/presupuesto", icon: PieChart },
  { title: "Metas de ahorro", url: "/metas", icon: Target },
];

const managementItems = [
  { title: "Cuentas", url: "/cuentas", icon: CreditCard },
  { title: "Categorías", url: "/categorias", icon: FolderTree },
  { title: "Gastos recurrentes", url: "/recurrentes", icon: Repeat },
];

const analysisItems = [
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
  { title: "Análisis financiero", url: "/analisis", icon: Brain },
];

const settingsItems = [{ title: "Configuración", url: "/configuracion", icon: Settings }];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold">Control de Gastos</div>
            <div className="truncate text-xs text-muted-foreground">Diarios</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Gestión", managementItems)}
        {renderGroup("Análisis", analysisItems)}
        {renderGroup("Sistema", settingsItems)}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          v1.0 · Modo demo
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
