"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TaskColumn } from "./task-column";
import { TaskDetailSheet } from "./task-detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const columns = [
  { title: "Inbox", status: "inbox" as const },
  { title: "Assigned", status: "assigned" as const },
  { title: "In Progress", status: "in_progress" as const },
  { title: "Review", status: "review" as const },
  { title: "Done", status: "done" as const },
];

export function TaskBoard() {
  const tasks = useQuery(api.tasks.listGroupedByStatus);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(
    null
  );

  if (tasks === undefined) {
    return (
      <div className="flex gap-4 p-4 h-full">
        {columns.map((col) => (
          <div
            key={col.status}
            className="min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg p-3"
          >
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="flex gap-4 p-4 h-full min-h-[calc(100vh-200px)]">
          {columns.map((col) => (
            <TaskColumn
              key={col.status}
              title={col.title}
              status={col.status}
              tasks={tasks[col.status]}
              onTaskClick={setSelectedTaskId}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </>
  );
}
