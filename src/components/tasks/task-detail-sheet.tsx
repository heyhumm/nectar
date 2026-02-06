"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../convex/_generated/dataModel";
import { FileText, MessageSquare, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface TaskDetailSheetProps {
  taskId: Id<"tasks"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusVariants = {
  inbox: "secondary",
  assigned: "default",
  in_progress: "default",
  review: "default",
  done: "default",
} as const;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }) + ", " + date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const task = useQuery(
    api.tasks.getWithDetails,
    taskId ? { id: taskId } : "skip"
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col overflow-hidden">
        {task === undefined ? (
          <SheetHeader className="p-6 pr-12 pb-4 border-b">
            <SheetTitle>
              <Skeleton className="h-6 w-3/4" />
            </SheetTitle>
            <div className="pt-2">
              <Skeleton className="h-5 w-20" />
            </div>
          </SheetHeader>
        ) : task === null ? (
          <SheetHeader className="p-6 pr-12 pb-4 border-b">
            <SheetTitle>Task not found</SheetTitle>
          </SheetHeader>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pr-12 pb-4 border-b">
              <SheetTitle className="text-lg leading-tight">
                {task.title}
              </SheetTitle>
              <div className="pt-2">
                <Badge
                  variant={statusVariants[task.status]}
                  className="capitalize"
                >
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </SheetHeader>

            {/* Scrollable content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* Description */}
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Description
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{task.description}</ReactMarkdown>
                  </div>
                </section>

                <Separator />

                {/* Assignees */}
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Assignees
                  </h4>
                  {task.assignees.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((agent) => (
                        <div
                          key={agent?._id}
                          className="flex items-center gap-2 bg-muted/60 pl-1 pr-3 py-1 rounded-full"
                        >
                          <Avatar className="h-6 w-6">
                            {agent?.avatar && (
                              <AvatarImage src={agent.avatar} alt={agent.name} />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(agent?.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{agent?.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <Separator />

                {/* Messages */}
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Messages ({task.messages.length})
                  </h4>
                  {task.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No messages</p>
                  ) : (
                    <div className="space-y-4">
                      {task.messages.map((msg) => (
                        <div key={msg._id} className="relative pl-10">
                          {/* Avatar positioned absolutely */}
                          <Avatar className="h-7 w-7 absolute left-0 top-0">
                            {msg.agent?.avatar && (
                              <AvatarImage src={msg.agent.avatar} alt={msg.agent.name} />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(msg.agent?.name || "")}
                            </AvatarFallback>
                          </Avatar>

                          {/* Message content */}
                          <div>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-semibold">
                                {msg.agent?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Documents */}
                {task.documents.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        Documents ({task.documents.length})
                      </h4>
                      <div className="space-y-2">
                        {task.documents.map((doc) => (
                          <div
                            key={doc._id}
                            className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg border border-border/50"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm flex-1 truncate">{doc.title}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {doc.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Footer with metadata */}
            <div className="border-t px-6 py-3 text-xs text-muted-foreground flex justify-between">
              <span>Created {formatTime(task.createdAt)}</span>
              <span>Updated {formatTime(task.updatedAt)}</span>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
