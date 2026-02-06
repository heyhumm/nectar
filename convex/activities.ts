import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);

    return await Promise.all(
      activities.map(async (activity) => {
        const agent = activity.agentId
          ? await ctx.db.get(activity.agentId)
          : null;
        const task = activity.taskId
          ? await ctx.db.get(activity.taskId)
          : null;
        const document = activity.documentId
          ? await ctx.db.get(activity.documentId)
          : null;

        return {
          ...activity,
          agent,
          task,
          document,
        };
      })
    );
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const allActivities = await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const taskActivities = allActivities.filter(
      (a) => a.taskId === args.taskId
    );

    return await Promise.all(
      taskActivities.map(async (activity) => {
        const agent = activity.agentId
          ? await ctx.db.get(activity.agentId)
          : null;
        return { ...activity, agent };
      })
    );
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const allActivities = await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const agentActivities = allActivities.filter(
      (a) => a.agentId === args.agentId
    );

    return await Promise.all(
      agentActivities.map(async (activity) => {
        const task = activity.taskId
          ? await ctx.db.get(activity.taskId)
          : null;
        return { ...activity, task };
      })
    );
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_status_changed"),
      v.literal("task_assigned"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_status_changed")
    ),
    message: v.string(),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    documentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      message: args.message,
      agentId: args.agentId,
      taskId: args.taskId,
      documentId: args.documentId,
      createdAt: Date.now(),
    });

    return activityId;
  },
});
