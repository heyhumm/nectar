"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  CheckCircle,
  Circle,
  FileText,
  MessageSquare,
  UserCheck,
  Zap,
} from "lucide-react";

interface ActivityItemProps {
  activity: Doc<"activities"> & {
    agent?: Doc<"agents"> | null;
    task?: Doc<"tasks"> | null;
    document?: Doc<"documents"> | null;
  };
}

const activityIcons = {
  task_created: Circle,
  task_status_changed: CheckCircle,
  task_assigned: UserCheck,
  message_sent: MessageSquare,
  document_created: FileText,
  agent_status_changed: Zap,
} as const;

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = activityIcons[activity.type];
  const agentInitials = activity.agent
    ? activity.agent.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SY";

  const timeAgo = getTimeAgo(activity.createdAt);

  return (
    <div className="flex gap-3 py-2">
      <div className="relative shrink-0">
        <Avatar className="h-8 w-8">
          {activity.agent?.avatar && (
            <AvatarImage src={activity.agent.avatar} alt={activity.agent.name} />
          )}
          <AvatarFallback className="text-xs">{agentInitials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {activity.agent && (
            <span className="font-medium">{activity.agent.name}</span>
          )}{" "}
          <span className="text-muted-foreground">{activity.message}</span>
        </p>
        {activity.task && (
          <p className="text-xs text-muted-foreground truncate">
            Task: {activity.task.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
