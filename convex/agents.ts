import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithCurrentTask = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) return null;

    const currentTask = agent.currentTaskId
      ? await ctx.db.get(agent.currentTaskId)
      : null;

    return {
      ...agent,
      currentTask,
    };
  },
});

export const listByStatus = query({
  args: {
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const listWithCurrentTasks = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();

    return await Promise.all(
      agents.map(async (agent) => {
        const currentTask = agent.currentTaskId
          ? await ctx.db.get(agent.currentTaskId)
          : null;
        return { ...agent, currentTask };
      })
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.string(),
    status: v.optional(
      v.union(v.literal("idle"), v.literal("active"), v.literal("blocked"))
    ),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      sessionKey: args.sessionKey,
      status: args.status ?? "idle",
      avatar: args.avatar,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "agent_status_changed",
      agentId,
      message: `${args.name} joined as ${args.role}`,
      createdAt: Date.now(),
    });

    return agentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Agent not found");

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Agent not found");

    const oldStatus = existing.status;

    await ctx.db.patch(args.id, {
      status: args.status,
      currentTaskId: args.currentTaskId,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "agent_status_changed",
      agentId: args.id,
      taskId: args.currentTaskId,
      message: `status changed from ${oldStatus} to ${args.status}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
