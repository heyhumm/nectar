import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listGroupedByStatus = query({
  args: {},
  handler: async (ctx) => {
    const allTasks = await ctx.db.query("tasks").collect();

    // Enrich tasks with assignee data
    const tasksWithAssignees = await Promise.all(
      allTasks.map(async (task) => {
        const assignees = await Promise.all(
          task.assigneeIds.map((id) => ctx.db.get(id))
        );
        return { ...task, assignees: assignees.filter(Boolean) };
      })
    );

    return {
      inbox: tasksWithAssignees.filter((t) => t.status === "inbox"),
      assigned: tasksWithAssignees.filter((t) => t.status === "assigned"),
      in_progress: tasksWithAssignees.filter((t) => t.status === "in_progress"),
      review: tasksWithAssignees.filter((t) => t.status === "review"),
      done: tasksWithAssignees.filter((t) => t.status === "done"),
    };
  },
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done")
      )
    ),
    includeScheduled: v.optional(v.boolean()), // If true, include scheduled tasks regardless of scheduledAt
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const now = Date.now();

    // Filter out future-dated tasks unless includeScheduled is true
    if (!args.includeScheduled) {
      tasks = tasks.filter((t) => !t.scheduledAt || t.scheduledAt <= now);
    }

    if (args.status) {
      return tasks.filter((t) => t.status === args.status);
    }
    return tasks;
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    includeScheduled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const now = Date.now();

    // Filter out future-dated tasks unless includeScheduled is true
    if (!args.includeScheduled) {
      tasks = tasks.filter((t) => !t.scheduledAt || t.scheduledAt <= now);
    }

    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await Promise.all(
          task.assigneeIds.map((id) => ctx.db.get(id))
        );
        return { ...task, assignees: assignees.filter(Boolean) };
      })
    );

    return tasksWithAssignees;
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithDetails = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return null;

    const assignees = await Promise.all(
      task.assigneeIds.map((id) => ctx.db.get(id))
    );

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.id))
      .collect();

    const messagesWithAgents = await Promise.all(
      messages.map(async (msg) => {
        const agent = await ctx.db.get(msg.fromAgentId);
        return { ...msg, agent };
      })
    );

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.id))
      .collect();

    return {
      ...task,
      assignees: assignees.filter(Boolean),
      messages: messagesWithAgents,
      documents,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done")
      )
    ),
    assigneeIds: v.optional(v.array(v.id("agents"))),
    createdByAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.status ?? "inbox",
      assigneeIds: args.assigneeIds ?? [],
      createdByAgentId: args.createdByAgentId,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "task_created",
      taskId,
      agentId: args.createdByAgentId,
      message: `created task "${args.title}"`,
      createdAt: now,
    });

    return taskId;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const oldStatus = existing.status;
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "task_status_changed",
      taskId: args.id,
      agentId: args.agentId,
      message: `changed status from ${oldStatus} to ${args.status}`,
      createdAt: now,
    });

    return args.id;
  },
});

export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assigneeIds: v.array(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const now = Date.now();

    await ctx.db.patch(args.id, {
      assigneeIds: args.assigneeIds,
      status: args.assigneeIds.length > 0 && existing.status === "inbox"
        ? "assigned"
        : existing.status,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "task_assigned",
      taskId: args.id,
      message: `assigned to ${args.assigneeIds.length} agent(s)`,
      createdAt: now,
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const schedule = mutation({
  args: {
    id: v.id("tasks"),
    scheduledAt: v.number(), // Unix timestamp in milliseconds
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const now = Date.now();
    const scheduledDate = new Date(args.scheduledAt).toISOString();

    await ctx.db.patch(args.id, {
      scheduledAt: args.scheduledAt,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "task_status_changed",
      taskId: args.id,
      agentId: args.agentId,
      message: `scheduled task for ${scheduledDate}`,
      createdAt: now,
    });

    return args.id;
  },
});

export const unschedule = mutation({
  args: {
    id: v.id("tasks"),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const now = Date.now();

    await ctx.db.patch(args.id, {
      scheduledAt: undefined,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("activities", {
      type: "task_status_changed",
      taskId: args.id,
      agentId: args.agentId,
      message: "removed task schedule",
      createdAt: now,
    });

    return args.id;
  },
});

export const listScheduled = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_scheduledAt")
      .filter((q) => q.gt(q.field("scheduledAt"), now))
      .order("asc")
      .collect();

    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await Promise.all(
          task.assigneeIds.map((id) => ctx.db.get(id))
        );
        return { ...task, assignees: assignees.filter(Boolean) };
      })
    );

    return tasksWithAssignees;
  },
});
