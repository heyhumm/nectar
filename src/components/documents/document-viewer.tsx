"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Doc } from "../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";

interface DocumentViewerProps {
  document: Doc<"documents"> & {
    createdBy?: Doc<"agents"> | null;
    task?: Doc<"tasks"> | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeColors = {
  deliverable: "default",
  research: "secondary",
  protocol: "outline",
  note: "secondary",
} as const;

export function DocumentViewer({
  document,
  open,
  onOpenChange,
}: DocumentViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{document.title}</DialogTitle>
            <Badge variant={typeColors[document.type]}>{document.type}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {document.createdBy && <span>By {document.createdBy.name}</span>}
            {document.task && <span>Task: {document.task.title}</span>}
            <span>
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{document.content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
