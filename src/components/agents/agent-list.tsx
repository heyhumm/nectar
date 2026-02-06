"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AgentCard } from "./agent-card";
import { Skeleton } from "@/components/ui/skeleton";

export function AgentList() {
  const agents = useQuery(api.agents.listWithCurrentTasks);

  if (agents === undefined) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No agents registered
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <AgentCard key={agent._id} agent={agent} />
      ))}
    </div>
  );
}
