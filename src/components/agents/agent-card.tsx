"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Doc } from "../../../convex/_generated/dataModel";

interface AgentCardProps {
  agent: Doc<"agents"> & {
    currentTask?: Doc<"tasks"> | null;
  };
}

const statusColors = {
  idle: "bg-status-neutral",
  active: "bg-status-success",
  blocked: "bg-status-error",
} as const;

const statusBadgeVariants = {
  idle: "secondary",
  active: "default",
  blocked: "destructive",
} as const;

export function AgentCard({ agent }: AgentCardProps) {
  const initials = agent.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-9 w-9">
              {agent.avatar && <AvatarImage src={agent.avatar} alt={agent.name} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${statusColors[agent.status]}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{agent.name}</span>
              <Badge
                variant={statusBadgeVariants[agent.status]}
                className="text-[10px] px-1.5 py-0"
              >
                {agent.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {agent.role}
            </p>
            {agent.currentTask && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Working on: {agent.currentTask.title}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
