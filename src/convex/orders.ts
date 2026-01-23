import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Limit to 100 most recent orders
    const orders = await ctx.db.query("orders").order("desc").take(100);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const outlet = await ctx.db.get(order.outletId);
        const client = await ctx.db.get(order.clientId);

        // Don't load items in list view - only load when viewing individual order
        // This reduces N+1 queries significantly
        const itemCount = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect()
          .then(items => items.length);

        return {
          ...order,
          outlet,
          client,
          itemCount,
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
      .take(100);

    // Don't load items in list queries
    return orders;
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
      .take(100);

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

    // Generate order number: OUTLETNAME-DDMMYY-XX
    // Example: MPC-150126-84 (MPC outlet, 15th Jan 2026, 84th order globally)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`; // DDMMYY

    // Get outlet code or generate from name
    const outletCode = outlet.code || outlet.name.substring(0, 3).toUpperCase();

    // Get or initialize global order counter
    const counterName = "globalOrderCounter";
    const existingCounter = await ctx.db
      .query("orderCounter")
      .withIndex("by_name", (q) => q.eq("counterName", counterName))
      .first();

    let currentOrderNumber: number;
    if (!existingCounter) {
      // Initialize counter at 84 for first order
      const counterId = await ctx.db.insert("orderCounter", {
        counterName,
        currentValue: 84,
      });
      currentOrderNumber = 84;
    } else {
      // Increment the counter for next order
      currentOrderNumber = existingCounter.currentValue + 1;
      await ctx.db.patch(existingCounter._id, {
        currentValue: currentOrderNumber,
      });
    }

    const orderNumber = `${outletCode}-${dateStr}-${currentOrderNumber}`;

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

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    // Don't allow deleting delivered orders
    if (order.status === "delivered" || order.status === "partially_delivered") {
      throw new Error("Cannot delete orders that have been delivered. Cancel them instead.");
    }

    // Delete all order items
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .take(100);

    for (const item of orderItems) {
      await ctx.db.delete(item._id);
    }

    // Delete any deliveries (shouldn't be any if not delivered, but cleanup)
    const deliveries = await ctx.db
      .query("deliveries")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .take(50);

    for (const delivery of deliveries) {
      await ctx.db.delete(delivery._id);
    }

    // Delete the order
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Initialize or update the global order counter
export const initializeOrderCounter = mutation({
  args: {
    startValue: v.number() // e.g., 83 to start next order at 84
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const counterName = "globalOrderCounter";
    const existingCounter = await ctx.db
      .query("orderCounter")
      .withIndex("by_name", (q) => q.eq("counterName", counterName))
      .first();

    if (existingCounter) {
      await ctx.db.patch(existingCounter._id, {
        currentValue: args.startValue,
      });
      return { message: `Counter updated to ${args.startValue}`, currentValue: args.startValue };
    } else {
      await ctx.db.insert("orderCounter", {
        counterName,
        currentValue: args.startValue,
      });
      return { message: `Counter initialized at ${args.startValue}`, currentValue: args.startValue };
    }
  },
});
