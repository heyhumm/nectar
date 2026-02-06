"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doc } from "../../../convex/_generated/dataModel";

interface TaskCardProps {
  task: Doc<"tasks"> & {
    assignees: Doc<"agents">[];
  };
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const assigneeCount = task.assignees.length;

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {assigneeCount > 0 ? (
              <>
                {task.assignees.slice(0, 3).map((agent) => {
                  const initials = agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <Avatar key={agent._id} className="h-6 w-6 border-2 border-background">
                      {agent.avatar && <AvatarImage src={agent.avatar} alt={agent.name} />}
                      <AvatarFallback className="text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {assigneeCount > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                    +{assigneeCount - 3}
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
