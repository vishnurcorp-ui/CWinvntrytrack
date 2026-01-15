import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

    // Get delivery history
    const deliveries = await ctx.db
      .query("deliveries")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    const enrichedDeliveries = await Promise.all(
      deliveries.map(async (delivery) => {
        const location = await ctx.db.get(delivery.locationId);
        const user = await ctx.db.get(delivery.deliveredBy);
        return {
          ...delivery,
          location,
          deliveredByUser: user,
        };
      })
    );

    return {
      ...order,
      outlet,
      client,
      items: enrichedItems,
      deliveries: enrichedDeliveries,
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

    // Generate order number: OUTLETCODE-DDMMYY-XX
    // Example: MPC-150126-01 (MPC Kora, 15th Jan 2026, 1st order)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`; // DDMMYY

    // Get outlet code or generate from name
    const outletCode = outlet.code || outlet.name.substring(0, 3).toUpperCase();

    // Get today's start and end timestamps
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    // Count orders for this outlet today
    const todayOrders = await ctx.db
      .query("orders")
      .withIndex("by_outlet", (q) => q.eq("outletId", args.outletId))
      .collect();

    const todayOrdersForOutlet = todayOrders.filter(
      (order) => order.orderDate >= todayStart && order.orderDate < todayEnd
    );

    const sequenceNumber = String(todayOrdersForOutlet.length + 1).padStart(2, '0');
    const orderNumber = `${outletCode}-${dateStr}-${sequenceNumber}`;

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

export const update = mutation({
  args: {
    id: v.id("orders"),
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

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    // Delete existing order items
    const existingItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .collect();

    for (const item of existingItems) {
      await ctx.db.delete(item._id);
    }

    // Insert new order items
    let totalAmount = 0;
    for (const item of args.items) {
      const totalPrice = item.unitPrice
        ? item.unitPrice * item.quantity
        : undefined;
      if (totalPrice) totalAmount += totalPrice;

      await ctx.db.insert("orderItems", {
        orderId: args.id,
        productId: item.productId,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        totalPrice,
      });
    }

    // Update order
    await ctx.db.patch(args.id, {
      expectedDeliveryDate: args.expectedDeliveryDate,
      notes: args.notes,
      totalAmount: totalAmount > 0 ? totalAmount : undefined,
    });

    return args.id;
  },
});

export const markDelivered = mutation({
  args: {
    id: v.id("orders"),
    locationId: v.id("locations"),
    deliveredItems: v.array(
      v.object({
        itemId: v.id("orderItems"),
        deliveredQuantity: v.number(),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    if (order.status === "delivered") {
      throw new Error("Order is already fully delivered");
    }

    // Get all order items
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .collect();

    // Get existing deliveries to calculate delivery number
    const existingDeliveries = await ctx.db
      .query("deliveries")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .collect();

    const deliveryNumber = existingDeliveries.length + 1;

    // Prepare delivery record items
    const deliveryRecordItems: Array<{
      orderItemId: any;
      productId: any;
      quantityDelivered: number;
    }> = [];

    let allItemsFullyDelivered = true;

    // Update delivered quantities for each item and create stock movements
    for (const deliveredItem of args.deliveredItems) {
      const orderItem = orderItems.find((item) => item._id === deliveredItem.itemId);
      if (!orderItem) continue;

      const previouslyDelivered = orderItem.deliveredQuantity || 0;
      const newTotalDelivered = previouslyDelivered + deliveredItem.deliveredQuantity;
      const remainingQuantity = orderItem.quantity - previouslyDelivered;

      // Validate: can't deliver more than remaining
      if (deliveredItem.deliveredQuantity > remainingQuantity) {
        throw new Error(
          `Cannot deliver ${deliveredItem.deliveredQuantity} units. Only ${remainingQuantity} units remaining for this item.`
        );
      }

      // Update the order item with cumulative delivered quantity
      await ctx.db.patch(deliveredItem.itemId, {
        deliveredQuantity: newTotalDelivered,
      });

      // Check if this item still has pending quantity
      if (newTotalDelivered < orderItem.quantity) {
        allItemsFullyDelivered = false;
      }

      // Only create stock movement and deduct inventory if quantity > 0
      if (deliveredItem.deliveredQuantity > 0) {
        // Add to delivery record
        deliveryRecordItems.push({
          orderItemId: deliveredItem.itemId,
          productId: orderItem.productId,
          quantityDelivered: deliveredItem.deliveredQuantity,
        });

        // Insert stock movement record
        await ctx.db.insert("stockMovements", {
          productId: orderItem.productId,
          locationId: args.locationId,
          movementType: "outbound" as const,
          quantity: deliveredItem.deliveredQuantity,
          unitType: orderItem.unitType,
          orderId: args.id,
          notes: `Order ${order.orderNumber} - Delivery #${deliveryNumber} (${deliveredItem.deliveredQuantity} of ${orderItem.quantity} ordered, ${newTotalDelivered} total delivered)`,
          performedBy: userId,
          movementDate: Date.now(),
        });

        // Update inventory (deduct delivered quantity)
        await ctx.scheduler.runAfter(0, internal.stockMovements.updateInventory, {
          productId: orderItem.productId,
          locationId: args.locationId,
          adjustment: -deliveredItem.deliveredQuantity,
        });
      }
    }

    // Create delivery record
    await ctx.db.insert("deliveries", {
      orderId: args.id,
      deliveryNumber,
      deliveryDate: Date.now(),
      locationId: args.locationId,
      items: deliveryRecordItems,
      notes: args.notes,
      deliveredBy: userId,
    });

    // Update order status
    const newStatus = allItemsFullyDelivered ? ("delivered" as const) : ("partially_delivered" as const);
    const updates: any = { status: newStatus };

    // Only set final delivery date if all items are delivered
    if (allItemsFullyDelivered) {
      updates.actualDeliveryDate = Date.now();
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
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
    locationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    const updates: any = { status: args.status };

    // When marking as delivered, deduct inventory and create stock movements
    if (args.status === "delivered" && order.status !== "delivered") {
      updates.actualDeliveryDate = Date.now();

      // Get location ID (either from args or throw error)
      if (!args.locationId) {
        throw new Error("Location is required when marking order as delivered");
      }

      // Get all order items
      const orderItems = await ctx.db
        .query("orderItems")
        .withIndex("by_order", (q) => q.eq("orderId", args.id))
        .collect();

      // Create outbound stock movements and deduct inventory for each item
      for (const item of orderItems) {
        // Insert stock movement record
        await ctx.db.insert("stockMovements", {
          productId: item.productId,
          locationId: args.locationId,
          movementType: "outbound" as const,
          quantity: item.quantity,
          unitType: item.unitType,
          orderId: args.id,
          notes: `Order ${order.orderNumber} delivered`,
          performedBy: userId,
          movementDate: Date.now(),
        });

        // Update inventory (deduct quantity)
        await ctx.scheduler.runAfter(0, internal.stockMovements.updateInventory, {
          productId: item.productId,
          locationId: args.locationId,
          adjustment: -item.quantity,
        });
      }
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});
