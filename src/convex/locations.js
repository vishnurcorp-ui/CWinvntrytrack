import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("locations").take(100);
    },
});
export const getById = query({
    args: { id: v.id("locations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const listByType = query({
    args: { type: v.union(v.literal("hq"), v.literal("warehouse")) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("locations")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .take(100);
    },
});
export const listByState = query({
    args: { state: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("locations")
            .withIndex("by_state", (q) => q.eq("state", args.state))
            .take(100);
    },
});
export const create = mutation({
    args: {
        name: v.string(),
        type: v.union(v.literal("hq"), v.literal("warehouse")),
        state: v.string(),
        city: v.string(),
        address: v.optional(v.string()),
        contactPerson: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        return await ctx.db.insert("locations", {
            name: args.name,
            type: args.type,
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
        id: v.id("locations"),
        name: v.optional(v.string()),
        state: v.optional(v.string()),
        city: v.optional(v.string()),
        address: v.optional(v.string()),
        contactPerson: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        const { id, ...updates } = args;
        const updateData = {};
        if (updates.name !== undefined)
            updateData.name = updates.name;
        if (updates.state !== undefined)
            updateData.state = updates.state;
        if (updates.city !== undefined)
            updateData.city = updates.city;
        if (updates.address !== undefined)
            updateData.address = updates.address;
        if (updates.contactPerson !== undefined)
            updateData.contactPerson = updates.contactPerson;
        if (updates.contactPhone !== undefined)
            updateData.contactPhone = updates.contactPhone;
        if (updates.isActive !== undefined)
            updateData.isActive = updates.isActive;
        await ctx.db.patch(id, updateData);
        return id;
    },
});
export const remove = mutation({
    args: { id: v.id("locations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        await ctx.db.patch(args.id, { isActive: false });
        return args.id;
    },
});
