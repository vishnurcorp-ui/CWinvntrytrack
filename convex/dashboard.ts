import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Limit products query for faster stats
    const products = await ctx.db.query("products").take(200);
    const inventory = await ctx.db.query("inventory").take(100);
    // Get recent orders in descending order to include the latest ones
    const orders = await ctx.db.query("orders").order("desc").take(100);

    const activeProducts = products.filter((p) => p.isActive).length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

    // Simplified low stock count without additional queries
    const lowStockCount = inventory.filter((item) => item.quantity <= 10).length;

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const partiallyDeliveredOrders = orders.filter((o) => o.status === "partially_delivered").length;

    return {
      activeProducts,
      totalStock,
      lowStockCount,
      pendingOrders,
      partiallyDeliveredOrders,
    };
  },
});

export const getRecentOrders = query({
  args: {},
  handler: async (ctx) => {
    // Get most recent orders first (descending by creation time)
    const orders = await ctx.db.query("orders").order("desc").take(5);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const outlet = await ctx.db.get(order.outletId);
        const client = await ctx.db.get(order.clientId);
        return {
          ...order,
          outlet,
          client,
        };
      })
    );

    return enriched;
  },
});

export const getLowStockSummary = query({
  args: {},
  handler: async (ctx) => {
    const inventory = await ctx.db.query("inventory").take(100);

    const lowStockItems = [];
    for (const item of inventory) {
      const product = await ctx.db.get(item.productId);
      if (product && item.quantity <= 10) {
        const location = await ctx.db.get(item.locationId);
        lowStockItems.push({
          ...item,
          product,
          location,
        });
        if (lowStockItems.length >= 5) break;
      }
    }

    return lowStockItems;
  },
});

export const getPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    // Get all pending orders (limited to 50 most recent)
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const outlet = await ctx.db.get(order.outletId);
        const client = await ctx.db.get(order.clientId);
        return {
          ...order,
          outlet,
          client,
        };
      })
    );

    return enriched;
  },
});

export const getPartiallyDeliveredOrders = query({
  args: {},
  handler: async (ctx) => {
    // Get all partially delivered orders (limited to 50 most recent)
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "partially_delivered"))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const outlet = await ctx.db.get(order.outletId);
        const client = await ctx.db.get(order.clientId);

        // Get items to calculate remaining quantities
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .take(100);

        let totalRemaining = 0;
        for (const item of items) {
          const delivered = item.deliveredQuantity || 0;
          const remaining = item.quantity - delivered;
          totalRemaining += remaining;
        }

        return {
          ...order,
          outlet,
          client,
          totalRemainingItems: totalRemaining,
        };
      })
    );

    return enriched;
  },
});
