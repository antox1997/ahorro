import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "../common/TransactionDialog";

export function AppShell({ children }: { children: ReactNode }) {
  const [txOpen, setTxOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
        <Button
          onClick={() => setTxOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg gradient-primary text-primary-foreground hover:opacity-95 cursor-pointer flex items-center justify-center"
          aria-label="Agregar transacción"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <TransactionDialog isOpen={txOpen} onOpenChange={setTxOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
