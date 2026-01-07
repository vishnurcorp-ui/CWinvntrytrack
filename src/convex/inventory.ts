import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const inventory = await ctx.db.query("inventory").collect();

    const enriched = await Promise.all(
      inventory.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        const location = await ctx.db.get(item.locationId);
        return {
          ...item,
          product,
          location,
        };
      })
    );

    return enriched;
  },
});

export const getByLocation = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .collect();

    const enriched = await Promise.all(
      inventory.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product,
        };
      })
    );

    return enriched;
  },
});

export const getByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const enriched = await Promise.all(
      inventory.map(async (item) => {
        const location = await ctx.db.get(item.locationId);
        return {
          ...item,
          location,
        };
      })
    );

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
      .withIndex("by_product_and_location", (q) =>
        q.eq("productId", args.productId).eq("locationId", args.locationId)
      )
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
      if (product && item.quantity <= product.reorderLevel) {
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
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_product_and_location", (q) =>
        q.eq("productId", args.productId).eq("locationId", args.locationId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: args.quantity,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_product_and_location", (q) =>
        q.eq("productId", args.productId).eq("locationId", args.locationId)
      )
      .unique();

    if (existing) {
      const newQuantity = existing.quantity + args.adjustment;
      await ctx.db.patch(existing._id, {
        quantity: Math.max(0, newQuantity),
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      if (args.adjustment > 0) {
        return await ctx.db.insert("inventory", {
          productId: args.productId,
          locationId: args.locationId,
          quantity: args.adjustment,
          lastUpdated: Date.now(),
        });
      }
      throw new Error("Cannot adjust non-existent inventory");
    }
  },
});
