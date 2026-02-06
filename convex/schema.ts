import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),
    avatar: v.optional(v.string()), // URL path like "/avatars/agent-name.png"
  })
    .index("by_status", ["status"])
    .index("by_sessionKey", ["sessionKey"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    assigneeIds: v.array(v.id("agents")),
    createdByAgentId: v.optional(v.id("agents")),
    createdAt: v.number(),
    updatedAt: v.number(),
    scheduledAt: v.optional(v.number()), // When task is scheduled to become available
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_scheduledAt", ["scheduledAt"]),

  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.array(v.id("documents")),
    createdAt: v.number(),
  }).index("by_taskId", ["taskId"]),

  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_status_changed"),
      v.literal("task_assigned"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_status_changed")
    ),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    documentId: v.optional(v.id("documents")),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  documents: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_taskId", ["taskId"]),

  notifications: defineTable({
    mentionedAgentId: v.id("agents"),
    content: v.string(),
    delivered: v.boolean(),
    taskId: v.optional(v.id("tasks")),
    createdAt: v.number(),
  }).index("by_mentionedAgentId_delivered", ["mentionedAgentId", "delivered"]),
});
