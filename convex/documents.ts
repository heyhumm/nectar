import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();

    return await Promise.all(
      documents.map(async (doc) => {
        const createdBy = doc.createdByAgentId
          ? await ctx.db.get(doc.createdByAgentId)
          : null;
        const task = doc.taskId ? await ctx.db.get(doc.taskId) : null;
        return { ...doc, createdBy, task };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) return null;

    const createdBy = document.createdByAgentId
      ? await ctx.db.get(document.createdByAgentId)
      : null;
    const task = document.taskId ? await ctx.db.get(document.taskId) : null;

    return { ...document, createdBy, task };
  },
});

export const listByType = query({
  args: {
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("note")
    ),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    return await Promise.all(
      documents.map(async (doc) => {
        const createdBy = doc.createdByAgentId
          ? await ctx.db.get(doc.createdByAgentId)
          : null;
        return { ...doc, createdBy };
      })
    );
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();

    return await Promise.all(
      documents.map(async (doc) => {
        const createdBy = doc.createdByAgentId
          ? await ctx.db.get(doc.createdByAgentId)
          : null;
        return { ...doc, createdBy };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("note")
    ),
    taskId: v.optional(v.id("tasks")),
    createdByAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      taskId: args.taskId,
      createdByAgentId: args.createdByAgentId,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "document_created",
      agentId: args.createdByAgentId,
      taskId: args.taskId,
      documentId,
      message: `created document "${args.title}"`,
      createdAt: now,
    });

    return documentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("deliverable"),
        v.literal("research"),
        v.literal("protocol"),
        v.literal("note")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Document not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
