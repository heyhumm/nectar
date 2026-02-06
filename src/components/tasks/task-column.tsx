"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

type TaskWithAssignees = Doc<"tasks"> & {
  assignees: Doc<"agents">[];
};

interface TaskColumnProps {
  title: string;
  status: Doc<"tasks">["status"];
  tasks: TaskWithAssignees[];
  onTaskClick?: (taskId: Id<"tasks">) => void;
}

const statusColors = {
  inbox: "bg-status-neutral",
  assigned: "bg-status-info",
  in_progress: "bg-status-warning",
  review: "bg-status-pending",
  done: "bg-status-success",
} as const;

export function TaskColumn({
  title,
  status,
  tasks,
  onTaskClick,
}: TaskColumnProps) {
  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg">
      <div className="p-3 border-b flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {tasks.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No tasks
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick?.(task._id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
