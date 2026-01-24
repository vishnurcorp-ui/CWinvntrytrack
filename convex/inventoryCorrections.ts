import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const corrections = await ctx.db
      .query("inventoryCorrections")
      .order("desc")
      .take(100);

    const enriched = await Promise.all(
      corrections.map(async (correction) => {
        const product = await ctx.db.get(correction.productId);
        const location = await ctx.db.get(correction.locationId);
        const user = await ctx.db.get(correction.performedBy);

        return {
          ...correction,
          product,
          location,
          user,
        };
      })
    );

    return enriched;
  },
});

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const corrections = await ctx.db
      .query("inventoryCorrections")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      corrections.map(async (correction) => {
        const location = await ctx.db.get(correction.locationId);
        const user = await ctx.db.get(correction.performedBy);

        return {
          ...correction,
          location,
          user,
        };
      })
    );

    return enriched;
  },
});

export const listByLocation = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    const corrections = await ctx.db
      .query("inventoryCorrections")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      corrections.map(async (correction) => {
        const product = await ctx.db.get(correction.productId);
        const user = await ctx.db.get(correction.performedBy);

        return {
          ...correction,
          product,
          user,
        };
      })
    );

    return enriched;
  },
});
