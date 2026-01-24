import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const outlets = await ctx.db.query("outlets").take(200);

    const enriched = await Promise.all(
      outlets.map(async (outlet) => {
        const client = await ctx.db.get(outlet.clientId);
        return {
          ...outlet,
          client,
        };
      })
    );

    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("outlets") },
  handler: async (ctx, args) => {
    const outlet = await ctx.db.get(args.id);
    if (!outlet) return null;

    const client = await ctx.db.get(outlet.clientId);
    return {
      ...outlet,
      client,
    };
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outlets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .take(200);
  },
});

export const listByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const outlets = await ctx.db
      .query("outlets")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .take(200);

    const enriched = await Promise.all(
      outlets.map(async (outlet) => {
        const client = await ctx.db.get(outlet.clientId);
        return {
          ...outlet,
          client,
        };
      })
    );

    return enriched;
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    code: v.optional(v.string()),
    state: v.string(),
    city: v.string(),
    address: v.string(),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("outlets", {
      clientId: args.clientId,
      name: args.name,
      code: args.code,
      state: args.state,
      city: args.city,
      address: args.address,
      contactPerson: args.contactPerson,
      contactPhone: args.contactPhone,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("outlets"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.contactPerson !== undefined) updateData.contactPerson = updates.contactPerson;
    if (updates.contactPhone !== undefined) updateData.contactPhone = updates.contactPhone;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("outlets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});
