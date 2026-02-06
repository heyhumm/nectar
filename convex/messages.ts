import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        const agent = await ctx.db.get(msg.fromAgentId);
        const attachments = await Promise.all(
          msg.attachments.map((docId) => ctx.db.get(docId))
        );
        return {
          ...msg,
          agent,
          attachmentDocs: attachments.filter(Boolean),
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    if (!message) return null;

    const agent = await ctx.db.get(message.fromAgentId);
    const attachments = await Promise.all(
      message.attachments.map((docId) => ctx.db.get(docId))
    );

    return {
      ...message,
      agent,
      attachmentDocs: attachments.filter(Boolean),
    };
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      fromAgentId: args.fromAgentId,
      content: args.content,
      attachments: args.attachments ?? [],
      createdAt: Date.now(),
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "message_sent",
      agentId: args.fromAgentId,
      taskId: args.taskId,
      message: "sent a message",
      createdAt: Date.now(),
    });

    return messageId;
  },
});
