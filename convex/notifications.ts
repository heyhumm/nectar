import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listUndelivered = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_mentionedAgentId_delivered", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();

    return await Promise.all(
      notifications.map(async (notif) => {
        const task = notif.taskId ? await ctx.db.get(notif.taskId) : null;
        return { ...notif, task };
      })
    );
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const allNotifications = await ctx.db.query("notifications").collect();

    const agentNotifications = allNotifications.filter(
      (n) => n.mentionedAgentId === args.agentId
    );

    return await Promise.all(
      agentNotifications.map(async (notif) => {
        const task = notif.taskId ? await ctx.db.get(notif.taskId) : null;
        return { ...notif, task };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) return null;

    const task = notification.taskId
      ? await ctx.db.get(notification.taskId)
      : null;
    const agent = await ctx.db.get(notification.mentionedAgentId);

    return { ...notification, task, agent };
  },
});

export const create = mutation({
  args: {
    mentionedAgentId: v.id("agents"),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      mentionedAgentId: args.mentionedAgentId,
      content: args.content,
      delivered: false,
      taskId: args.taskId,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

export const markDelivered = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");

    await ctx.db.patch(args.id, { delivered: true });
    return args.id;
  },
});

export const markAllDelivered = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const undelivered = await ctx.db
      .query("notifications")
      .withIndex("by_mentionedAgentId_delivered", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();

    await Promise.all(
      undelivered.map((notif) =>
        ctx.db.patch(notif._id, { delivered: true })
      )
    );

    return undelivered.length;
  },
});
