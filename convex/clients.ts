import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clients").take(200);
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByType = query({
  args: {
    type: v.union(
      v.literal("hotel"),
      v.literal("restaurant"),
      v.literal("cafe"),
      v.literal("office"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .take(200);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("hotel"),
      v.literal("restaurant"),
      v.literal("cafe"),
      v.literal("office"),
      v.literal("other")
    ),
    contactPerson: v.string(),
    contactPhone: v.string(),
    contactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("clients", {
      name: args.name,
      type: args.type,
      contactPerson: args.contactPerson,
      contactPhone: args.contactPhone,
      contactEmail: args.contactEmail,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("hotel"),
        v.literal("restaurant"),
        v.literal("cafe"),
        v.literal("office"),
        v.literal("other")
      )
    ),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.contactPerson !== undefined) updateData.contactPerson = updates.contactPerson;
    if (updates.contactPhone !== undefined) updateData.contactPhone = updates.contactPhone;
    if (updates.contactEmail !== undefined) updateData.contactEmail = updates.contactEmail;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});
