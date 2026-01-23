import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
export const list = query({
    args: {},
    handler: async (ctx) => {
        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_date")
            .order("desc")
            .take(100);
        const enriched = await Promise.all(expenses.map(async (expense) => {
            const order = expense.orderId ? await ctx.db.get(expense.orderId) : null;
            const outlet = expense.outletId ? await ctx.db.get(expense.outletId) : null;
            const user = await ctx.db.get(expense.createdBy);
            let client = null;
            if (outlet?.clientId) {
                client = await ctx.db.get(outlet.clientId);
            }
            return {
                ...expense,
                order,
                outlet,
                client,
                createdByUser: user,
            };
        }));
        return enriched;
    },
});
export const listByDateRange = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        const allExpenses = await ctx.db
            .query("expenses")
            .withIndex("by_date")
            .order("desc")
            .take(500);
        const filtered = allExpenses.filter((expense) => expense.date >= args.startDate && expense.date <= args.endDate);
        const enriched = await Promise.all(filtered.map(async (expense) => {
            const order = expense.orderId ? await ctx.db.get(expense.orderId) : null;
            const outlet = expense.outletId ? await ctx.db.get(expense.outletId) : null;
            let client = null;
            if (outlet?.clientId) {
                client = await ctx.db.get(outlet.clientId);
            }
            return {
                ...expense,
                order,
                outlet,
                client,
            };
        }));
        return enriched;
    },
});
export const getTotalByCategory = query({
    args: {},
    handler: async (ctx) => {
        const expenses = await ctx.db.query("expenses").take(1000);
        const totals = {
            delivery: 0,
            operational: 0,
            other: 0,
            total: 0,
        };
        for (const expense of expenses) {
            totals[expense.category] += expense.amount;
            totals.total += expense.amount;
        }
        return totals;
    },
});
export const create = mutation({
    args: {
        date: v.number(),
        category: v.union(v.literal("delivery"), v.literal("operational"), v.literal("other")),
        vendor: v.string(),
        description: v.string(),
        amount: v.number(),
        paymentMode: v.string(),
        orderId: v.optional(v.id("orders")),
        outletId: v.optional(v.id("outlets")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        return await ctx.db.insert("expenses", {
            date: args.date,
            category: args.category,
            vendor: args.vendor,
            description: args.description,
            amount: args.amount,
            paymentMode: args.paymentMode,
            orderId: args.orderId,
            outletId: args.outletId,
            notes: args.notes,
            createdBy: userId,
        });
    },
});
export const update = mutation({
    args: {
        id: v.id("expenses"),
        date: v.optional(v.number()),
        category: v.optional(v.union(v.literal("delivery"), v.literal("operational"), v.literal("other"))),
        vendor: v.optional(v.string()),
        description: v.optional(v.string()),
        amount: v.optional(v.number()),
        paymentMode: v.optional(v.string()),
        orderId: v.optional(v.id("orders")),
        outletId: v.optional(v.id("outlets")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        const { id, ...updates } = args;
        const updateData = {};
        if (updates.date !== undefined)
            updateData.date = updates.date;
        if (updates.category !== undefined)
            updateData.category = updates.category;
        if (updates.vendor !== undefined)
            updateData.vendor = updates.vendor;
        if (updates.description !== undefined)
            updateData.description = updates.description;
        if (updates.amount !== undefined)
            updateData.amount = updates.amount;
        if (updates.paymentMode !== undefined)
            updateData.paymentMode = updates.paymentMode;
        if (updates.orderId !== undefined)
            updateData.orderId = updates.orderId;
        if (updates.outletId !== undefined)
            updateData.outletId = updates.outletId;
        if (updates.notes !== undefined)
            updateData.notes = updates.notes;
        await ctx.db.patch(id, updateData);
        return id;
    },
});
export const remove = mutation({
    args: { id: v.id("expenses") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId)
            throw new Error("Not authenticated");
        await ctx.db.delete(args.id);
        return args.id;
    },
});
