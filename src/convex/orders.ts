import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const outlet = await ctx.db.get(order.outletId);
        const client = await ctx.db.get(order.clientId);
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return { ...item, product };
          })
        );

        return {
          ...order,
          outlet,
          client,
          items: enrichedItems,
        };
      })
    );

    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    const outlet = await ctx.db.get(order.outletId);
    const client = await ctx.db.get(order.clientId);
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      })
    );

    return {
      ...order,
      outlet,
      client,
      items: enrichedItems,
    };
  },
});

export const listByOutlet = query({
  args: { outletId: v.id("outlets") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_outlet", (q) => q.eq("outletId", args.outletId))
      .collect();

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return { ...item, product };
          })
        );

        return { ...order, items: enrichedItems };
      })
    );

    return enriched;
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const outlet = await ctx.db.get(order.outletId);
        const client = await ctx.db.get(order.clientId);
        return { ...order, outlet, client };
      })
    );

    return enriched;
  },
});

export const create = mutation({
  args: {
    outletId: v.id("outlets"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        unitType: v.optional(v.string()),
        unitPrice: v.optional(v.number()),
      })
    ),
    expectedDeliveryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const outlet = await ctx.db.get(args.outletId);
    if (!outlet) throw new Error("Outlet not found");

    const orderNumber = `ORD-${Date.now()}`;

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      outletId: args.outletId,
      clientId: outlet.clientId,
      status: "pending" as const,
      orderDate: Date.now(),
      expectedDeliveryDate: args.expectedDeliveryDate,
      notes: args.notes,
      createdBy: userId,
    });

    let totalAmount = 0;
    for (const item of args.items) {
      const totalPrice = item.unitPrice
        ? item.unitPrice * item.quantity
        : undefined;
      if (totalPrice) totalAmount += totalPrice;

      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        totalPrice,
      });
    }

    if (totalAmount > 0) {
      await ctx.db.patch(orderId, { totalAmount });
    }

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: any = { status: args.status };

    if (args.status === "delivered") {
      updates.actualDeliveryDate = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});
