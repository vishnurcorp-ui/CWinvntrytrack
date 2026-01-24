import { internalMutation } from "./_generated/server";

export const addSampleExpenses = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get first user for testing
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("No users found. Please create a user first.");
    const userId = user._id;

    // Get some orders and outlets for linking
    const orders = await ctx.db.query("orders").take(2);
    const outlets = await ctx.db.query("outlets").take(2);

    const sampleExpenses = [
      {
        date: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        category: "delivery" as const,
        vendor: "Uber",
        description: "Local delivery - South Delhi",
        amount: 250,
        paymentMode: "UPI",
        orderId: orders[0]?._id,
        outletId: outlets[0]?._id,
        notes: "Express delivery",
        createdBy: userId,
      },
      {
        date: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        category: "delivery" as const,
        vendor: "Porter",
        description: "Intercity bulk consignment - Gurgaon to Noida",
        amount: 1800,
        paymentMode: "Cash",
        orderId: orders[1]?._id,
        notes: "Heavy load, 3 hour trip",
        createdBy: userId,
      },
      {
        date: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        category: "operational" as const,
        vendor: "PrintHub",
        description: "Label printing - 500 sheets",
        amount: 450,
        paymentMode: "Card",
        notes: "Thermal labels for products",
        createdBy: userId,
      },
      {
        date: Date.now(),
        category: "delivery" as const,
        vendor: "Dunzo",
        description: "Express local delivery",
        amount: 180,
        paymentMode: "UPI",
        outletId: outlets[1]?._id,
        createdBy: userId,
      },
      {
        date: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        category: "other" as const,
        vendor: "Office Supplies Co",
        description: "Packing materials and tape",
        amount: 650,
        paymentMode: "Card",
        notes: "Monthly stock",
        createdBy: userId,
      },
    ];

    const ids = [];
    for (const expense of sampleExpenses) {
      const id = await ctx.db.insert("expenses", expense);
      ids.push(id);
    }

    return { count: ids.length, ids };
  },
});
