import { internalMutation } from "./_generated/server";
export const seed = internalMutation({
    args: {},
    handler: async (ctx) => {
        const userId = (await ctx.db.query("users").first())?._id;
        if (!userId) {
            throw new Error("No user found. Please sign up first.");
        }
        const existingProducts = await ctx.db.query("products").first();
        if (existingProducts) {
            return "Data already seeded";
        }
        const hqId = await ctx.db.insert("locations", {
            name: "Coimbatore HQ",
            type: "hq",
            state: "Tamil Nadu",
            city: "Coimbatore",
            address: "123 Industrial Area, Coimbatore",
            contactPerson: "Rajesh Kumar",
            contactPhone: "+91-9876543210",
            isActive: true,
        });
        const bangaloreWarehouseId = await ctx.db.insert("locations", {
            name: "Bangalore Main Warehouse",
            type: "warehouse",
            state: "Karnataka",
            city: "Bangalore",
            address: "45 Warehouse Complex, Electronic City",
            contactPerson: "Priya Sharma",
            contactPhone: "+91-9876543211",
            isActive: true,
        });
        const products = [
            { sku: "CLN-001", name: "Floor Cleaner Concentrate", category: "Floor Cleaning", unit: "Liters", reorderLevel: 50 },
            { sku: "CLN-002", name: "Glass Cleaner Spray", category: "Glass Cleaning", unit: "Liters", reorderLevel: 30 },
            { sku: "CLN-003", name: "Toilet Bowl Cleaner", category: "Bathroom Cleaning", unit: "Liters", reorderLevel: 40 },
            { sku: "CLN-004", name: "Kitchen Degreaser", category: "Kitchen Cleaning", unit: "Liters", reorderLevel: 35 },
            { sku: "CLN-005", name: "All-Purpose Cleaner", category: "General Cleaning", unit: "Liters", reorderLevel: 60 },
            { sku: "CLN-006", name: "Disinfectant Spray", category: "Sanitization", unit: "Liters", reorderLevel: 45 },
            { sku: "CLN-007", name: "Carpet Shampoo", category: "Carpet Cleaning", unit: "Liters", reorderLevel: 25 },
            { sku: "CLN-008", name: "Stainless Steel Polish", category: "Surface Care", unit: "Liters", reorderLevel: 20 },
            { sku: "CLN-009", name: "Wood Floor Cleaner", category: "Floor Cleaning", unit: "Liters", reorderLevel: 30 },
            { sku: "CLN-010", name: "Tile & Grout Cleaner", category: "Floor Cleaning", unit: "Liters", reorderLevel: 35 },
        ];
        const productIds = [];
        for (const product of products) {
            const id = await ctx.db.insert("products", {
                ...product,
                description: `Professional grade ${product.name.toLowerCase()} for commercial use`,
                isActive: true,
            });
            productIds.push({ id, ...product });
        }
        for (const product of productIds) {
            const baseQuantity = Math.floor(Math.random() * 100) + 50;
            await ctx.db.insert("inventory", {
                productId: product.id,
                locationId: hqId,
                quantity: baseQuantity,
                lastUpdated: Date.now(),
            });
            const warehouseQuantity = Math.floor(Math.random() * 80) + 20;
            await ctx.db.insert("inventory", {
                productId: product.id,
                locationId: bangaloreWarehouseId,
                quantity: warehouseQuantity,
                lastUpdated: Date.now(),
            });
        }
        const client1 = await ctx.db.insert("clients", {
            name: "Grand Plaza Hotel",
            type: "hotel",
            contactPerson: "Amit Patel",
            contactPhone: "+91-9876543220",
            contactEmail: "amit@grandplaza.com",
            isActive: true,
        });
        const client2 = await ctx.db.insert("clients", {
            name: "Spice Garden Restaurant",
            type: "restaurant",
            contactPerson: "Meena Iyer",
            contactPhone: "+91-9876543221",
            contactEmail: "meena@spicegarden.com",
            isActive: true,
        });
        const client3 = await ctx.db.insert("clients", {
            name: "Tech Corp Offices",
            type: "office",
            contactPerson: "Suresh Reddy",
            contactPhone: "+91-9876543222",
            contactEmail: "facilities@techcorp.com",
            isActive: true,
        });
        const outlet1 = await ctx.db.insert("outlets", {
            clientId: client1,
            name: "Grand Plaza - Bangalore Branch",
            state: "Karnataka",
            city: "Bangalore",
            address: "MG Road, Bangalore",
            contactPerson: "Ravi Kumar",
            contactPhone: "+91-9876543230",
            isActive: true,
        });
        const outlet2 = await ctx.db.insert("outlets", {
            clientId: client2,
            name: "Spice Garden - Indiranagar",
            state: "Karnataka",
            city: "Bangalore",
            address: "Indiranagar, Bangalore",
            contactPerson: "Lakshmi Menon",
            contactPhone: "+91-9876543231",
            isActive: true,
        });
        const outlet3 = await ctx.db.insert("outlets", {
            clientId: client3,
            name: "Tech Corp - Electronic City Campus",
            state: "Karnataka",
            city: "Bangalore",
            address: "Electronic City Phase 1",
            contactPerson: "Karthik Varma",
            contactPhone: "+91-9876543232",
            isActive: true,
        });
        const order1 = await ctx.db.insert("orders", {
            orderNumber: `ORD-${Date.now()}-1`,
            outletId: outlet1,
            clientId: client1,
            status: "delivered",
            orderDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
            actualDeliveryDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
            createdBy: userId,
        });
        await ctx.db.insert("orderItems", {
            orderId: order1,
            productId: productIds[0].id,
            quantity: 10,
            unitPrice: 250,
            totalPrice: 2500,
        });
        await ctx.db.insert("orderItems", {
            orderId: order1,
            productId: productIds[5].id,
            quantity: 5,
            unitPrice: 300,
            totalPrice: 1500,
        });
        const order2 = await ctx.db.insert("orders", {
            orderNumber: `ORD-${Date.now()}-2`,
            outletId: outlet2,
            clientId: client2,
            status: "pending",
            orderDate: Date.now(),
            expectedDeliveryDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
            createdBy: userId,
        });
        await ctx.db.insert("orderItems", {
            orderId: order2,
            productId: productIds[3].id,
            quantity: 8,
            unitPrice: 280,
            totalPrice: 2240,
        });
        return "Test data seeded successfully!";
    },
});
