import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
export const list = query({
    args: {},
    handler: async (ctx) => {
        const inventory = await ctx.db.query("inventory").take(100);
        const enriched = await Promise.all(inventory.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            const location = await ctx.db.get(item.locationId);
            return {
                ...item,
                product,
                location,
            };
        }));
        return enriched;
    },
});
export const getByLocation = query({
    args: { locationId: v.id("locations") },
    handler: async (ctx, args) => {
        const inventory = await ctx.db
            .query("inventory")
            .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
            .take(200);
        const enriched = await Promise.all(inventory.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return {
                ...item,
                product,
            };
        }));
        return enriched;
    },
});
export const getByProduct = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const inventory = await ctx.db
            .query("inventory")
            .withIndex("by_product", (q) => q.eq("productId", args.productId))
            .take(100);
        const enriched = await Promise.all(inventory.map(async (item) => {
            const location = await ctx.db.get(item.locationId);
            return {
                ...item,
                location,
            };
        }));
        return enriched;
    },
});
export const getByProductAndLocation = query({
    args: {
        productId: v.id("products"),
        locationId: v.id("locations"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("inventory")
            .withIndex("by_product_and_location", (q) => q.eq("productId", args.productId).eq("locationId", args.locationId))
            .unique();
    },
});
export const getLowStock = query({
    args: {},
    handler: async (ctx) => {
        const allInventory = await ctx.db.query("inventory").collect();
        const lowStockItems = [];
        for (const item of allInventory) {
            const product = await ctx.db.get(item.productId);
            if (product && item.quantity <= 10) {
                const location = await ctx.db.get(item.locationId);
                lowStockItems.push({
                    ...item,
                    product,
                    location,
                });
            }
        }
        return lowStockItems;
    },
});
export const updateQuantity = mutation({
    args: {
        productId: v.id("products"),
        locationId: v.id("locations"),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        const existing = await ctx.db
            .query("inventory")
            .withIndex("by_product_and_location", (q) => q.eq("productId", args.productId).eq("locationId", args.locationId))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, {
                quantity: args.quantity,
                lastUpdated: Date.now(),
            });
            return existing._id;
        }
        else {
            return await ctx.db.insert("inventory", {
                productId: args.productId,
                locationId: args.locationId,
                quantity: args.quantity,
                lastUpdated: Date.now(),
            });
        }
    },
});
export const adjustQuantity = mutation({
    args: {
        productId: v.id("products"),
        locationId: v.id("locations"),
        adjustment: v.number(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        const existing = await ctx.db
            .query("inventory")
            .withIndex("by_product_and_location", (q) => q.eq("productId", args.productId).eq("locationId", args.locationId))
            .unique();
        if (existing) {
            const oldQuantity = existing.quantity;
            const newQuantity = Math.max(0, existing.quantity + args.adjustment);
            await ctx.db.patch(existing._id, {
                quantity: newQuantity,
                lastUpdated: Date.now(),
            });
            // Log the correction
            if (args.reason) {
                await ctx.db.insert("inventoryCorrections", {
                    productId: args.productId,
                    locationId: args.locationId,
                    oldQuantity,
                    newQuantity,
                    adjustment: args.adjustment,
                    adjustmentType: args.adjustment > 0 ? "add" : "subtract",
                    reason: args.reason,
                    performedBy: userId,
                    correctionDate: Date.now(),
                });
            }
            return existing._id;
        }
        else {
            if (args.adjustment > 0) {
                const inventoryId = await ctx.db.insert("inventory", {
                    productId: args.productId,
                    locationId: args.locationId,
                    quantity: args.adjustment,
                    lastUpdated: Date.now(),
                });
                // Log the correction for new inventory
                if (args.reason) {
                    await ctx.db.insert("inventoryCorrections", {
                        productId: args.productId,
                        locationId: args.locationId,
                        oldQuantity: 0,
                        newQuantity: args.adjustment,
                        adjustment: args.adjustment,
                        adjustmentType: "add",
                        reason: args.reason,
                        performedBy: userId,
                        correctionDate: Date.now(),
                    });
                }
                return inventoryId;
            }
            throw new Error("Cannot adjust non-existent inventory");
        }
    },
});
export const remove = mutation({
    args: { id: v.id("inventory") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        await ctx.db.delete(args.id);
        return args.id;
    },
});
