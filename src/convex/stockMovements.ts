import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const movements = await ctx.db.query("stockMovements").take(100);

    const enriched = await Promise.all(
      movements.map(async (movement) => {
        const product = await ctx.db.get(movement.productId);
        const location = await ctx.db.get(movement.locationId);
        const fromLocation = movement.fromLocationId
          ? await ctx.db.get(movement.fromLocationId)
          : null;
        const toLocation = movement.toLocationId
          ? await ctx.db.get(movement.toLocationId)
          : null;

        return {
          ...movement,
          product,
          location,
          fromLocation,
          toLocation,
        };
      })
    );

    return enriched;
  },
});

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const movements = await ctx.db
      .query("stockMovements")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(50);

    const enriched = await Promise.all(
      movements.map(async (movement) => {
        const location = await ctx.db.get(movement.locationId);
        return { ...movement, location };
      })
    );

    return enriched;
  },
});

export const listByLocation = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    const movements = await ctx.db
      .query("stockMovements")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .take(50);

    const enriched = await Promise.all(
      movements.map(async (movement) => {
        const product = await ctx.db.get(movement.productId);
        return { ...movement, product };
      })
    );

    return enriched;
  },
});

export const recordInbound = mutation({
  args: {
    productId: v.id("products"),
    locationId: v.id("locations"),
    quantity: v.number(),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const movementId = await ctx.db.insert("stockMovements", {
      productId: args.productId,
      locationId: args.locationId,
      movementType: "inbound" as const,
      quantity: args.quantity,
      referenceNumber: args.referenceNumber,
      notes: args.notes,
      performedBy: userId,
      movementDate: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.stockMovements.updateInventory, {
      productId: args.productId,
      locationId: args.locationId,
      adjustment: args.quantity,
    });

    return movementId;
  },
});

export const recordOutbound = mutation({
  args: {
    productId: v.id("products"),
    locationId: v.id("locations"),
    quantity: v.number(),
    orderId: v.optional(v.id("orders")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const movementId = await ctx.db.insert("stockMovements", {
      productId: args.productId,
      locationId: args.locationId,
      movementType: "outbound" as const,
      quantity: args.quantity,
      orderId: args.orderId,
      notes: args.notes,
      performedBy: userId,
      movementDate: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.stockMovements.updateInventory, {
      productId: args.productId,
      locationId: args.locationId,
      adjustment: -args.quantity,
    });

    return movementId;
  },
});

export const recordTransfer = mutation({
  args: {
    productId: v.id("products"),
    fromLocationId: v.id("locations"),
    toLocationId: v.id("locations"),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const movementId = await ctx.db.insert("stockMovements", {
      productId: args.productId,
      locationId: args.fromLocationId,
      movementType: "transfer" as const,
      quantity: args.quantity,
      fromLocationId: args.fromLocationId,
      toLocationId: args.toLocationId,
      notes: args.notes,
      performedBy: userId,
      movementDate: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.stockMovements.updateInventory, {
      productId: args.productId,
      locationId: args.fromLocationId,
      adjustment: -args.quantity,
    });

    await ctx.scheduler.runAfter(0, internal.stockMovements.updateInventory, {
      productId: args.productId,
      locationId: args.toLocationId,
      adjustment: args.quantity,
    });

    return movementId;
  },
});

export const updateInventory = internalMutation({
  args: {
    productId: v.id("products"),
    locationId: v.id("locations"),
    adjustment: v.number(),
  },
  handler: async (ctx, args) => {
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
    } else {
      if (args.adjustment > 0) {
        await ctx.db.insert("inventory", {
          productId: args.productId,
          locationId: args.locationId,
          quantity: args.adjustment,
          lastUpdated: Date.now(),
        });
      }
    }
  },
});
