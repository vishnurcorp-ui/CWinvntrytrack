import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const inventory = await ctx.db.query("inventory").take(100);
    const orders = await ctx.db.query("orders").take(50);

    const activeProducts = products.filter((p) => p.isActive).length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

    let lowStockCount = 0;
    for (const item of inventory) {
      const product = await ctx.db.get(item.productId);
      if (product && item.quantity <= 10) {
        lowStockCount++;
      }
    }

    const pendingOrders = orders.filter((o) => o.status === "pending").length;

    return {
      activeProducts,
      totalStock,
      lowStockCount,
      pendingOrders,
    };
  },
});

export const getRecentOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").take(5);

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
