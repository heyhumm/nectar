"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DocumentViewer } from "./document-viewer";
import { Doc } from "../../../convex/_generated/dataModel";
import { FileText } from "lucide-react";

const typeColors = {
  deliverable: "default",
  research: "secondary",
  protocol: "outline",
  note: "secondary",
} as const;

export function DocumentPanel() {
  const documents = useQuery(api.documents.list);
  const [selectedDocument, setSelectedDocument] = useState<
    (Doc<"documents"> & {
      createdBy?: Doc<"agents"> | null;
      task?: Doc<"tasks"> | null;
    }) | null
  >(null);

  if (documents === undefined) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No documents yet
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1 w-full">
        {documents.map((doc) => (
          <button
            key={doc._id}
            onClick={() => setSelectedDocument(doc)}
            className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors overflow-hidden"
          >
            <div className="flex items-center gap-2 w-full">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1 min-w-0">{doc.title}</span>
              <Badge
                variant={typeColors[doc.type]}
                className="text-[10px] px-1.5 py-0 shrink-0"
              >
                {doc.type}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
        />
      )}
    </>
  );
}
