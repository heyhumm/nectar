"use client";

import { ReactNode } from "react";
import { AgentList } from "@/components/agents/agent-list";
import { DocumentPanel } from "@/components/documents/document-panel";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="w-72 flex-none border-r flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <img src="/nectar_logo.png" alt="Nectar" className="w-8 h-8" />
              <h1 className="text-xl font-semibold">Nectar</h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-sm text-muted-foreground">Task Management</p>
        </div>
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-4 overflow-hidden">
            <h2 className="text-sm font-medium mb-3">Agents</h2>
            <AgentList />
          </div>
          <Separator />
          <div className="p-4 overflow-hidden">
            <h2 className="text-sm font-medium mb-3">Documents</h2>
            <DocumentPanel />
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
