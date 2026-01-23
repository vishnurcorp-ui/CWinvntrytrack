import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
export const list = query({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db
            .query("products")
            .withIndex("by_category")
            .take(200);
        return products;
    },
});
export const getById = query({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const getBySku = query({
    args: { sku: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("products")
            .withIndex("by_sku", (q) => q.eq("sku", args.sku))
            .unique();
    },
});
export const listByCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("products")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .take(200);
    },
});
export const create = mutation({
    args: {
        sku: v.string(),
        name: v.string(),
        category: v.string(),
        description: v.optional(v.string()),
        unit: v.string(),
        reorderLevel: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        const existing = await ctx.db
            .query("products")
            .withIndex("by_sku", (q) => q.eq("sku", args.sku))
            .unique();
        if (existing) {
            throw new Error("Product with this SKU already exists");
        }
        return await ctx.db.insert("products", {
            sku: args.sku,
            name: args.name,
            category: args.category,
            description: args.description,
            unit: args.unit,
            reorderLevel: args.reorderLevel,
            isActive: true,
        });
    },
});
export const update = mutation({
    args: {
        id: v.id("products"),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        description: v.optional(v.string()),
        unit: v.optional(v.string()),
        reorderLevel: v.optional(v.number()),
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
        if (updates.category !== undefined)
            updateData.category = updates.category;
        if (updates.description !== undefined)
            updateData.description = updates.description;
        if (updates.unit !== undefined)
            updateData.unit = updates.unit;
        if (updates.reorderLevel !== undefined)
            updateData.reorderLevel = updates.reorderLevel;
        if (updates.isActive !== undefined)
            updateData.isActive = updates.isActive;
        await ctx.db.patch(id, updateData);
        return id;
    },
});
export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        await ctx.db.patch(args.id, { isActive: false });
        return args.id;
    },
});
