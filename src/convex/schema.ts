import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  WAREHOUSE_STAFF: "warehouse_staff",
  SALES: "sales",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.MANAGER),
  v.literal(ROLES.WAREHOUSE_STAFF),
  v.literal(ROLES.SALES),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // Locations (warehouses, HQ)
    locations: defineTable({
      name: v.string(),
      type: v.union(v.literal("hq"), v.literal("warehouse")),
      state: v.string(),
      city: v.string(),
      address: v.optional(v.string()),
      contactPerson: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      isActive: v.boolean(),
    }).index("by_type", ["type"])
      .index("by_state", ["state"]),

    // Products/SKUs
    products: defineTable({
      sku: v.string(),
      name: v.string(),
      category: v.string(),
      description: v.optional(v.string()),
      unit: v.string(),
      reorderLevel: v.number(),
      isActive: v.boolean(),
    }).index("by_sku", ["sku"])
      .index("by_category", ["category"]),

    // Inventory (stock levels at each location)
    inventory: defineTable({
      productId: v.id("products"),
      locationId: v.id("locations"),
      quantity: v.number(),
      lastUpdated: v.number(),
    }).index("by_product", ["productId"])
      .index("by_location", ["locationId"])
      .index("by_product_and_location", ["productId", "locationId"]),

    // Clients
    clients: defineTable({
      name: v.string(),
      type: v.union(
        v.literal("hotel"),
        v.literal("restaurant"),
        v.literal("cafe"),
        v.literal("office"),
        v.literal("other")
      ),
      contactPerson: v.string(),
      contactPhone: v.string(),
      contactEmail: v.optional(v.string()),
      isActive: v.boolean(),
    }).index("by_type", ["type"]),

    // Client Outlets
    outlets: defineTable({
      clientId: v.id("clients"),
      name: v.string(),
      state: v.string(),
      city: v.string(),
      address: v.string(),
      contactPerson: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      isActive: v.boolean(),
    }).index("by_client", ["clientId"])
      .index("by_state", ["state"]),

    // Orders
    orders: defineTable({
      orderNumber: v.string(),
      outletId: v.id("outlets"),
      clientId: v.id("clients"),
      status: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("packed"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled")
      ),
      orderDate: v.number(),
      expectedDeliveryDate: v.optional(v.number()),
      actualDeliveryDate: v.optional(v.number()),
      totalAmount: v.optional(v.number()),
      notes: v.optional(v.string()),
      createdBy: v.id("users"),
    }).index("by_outlet", ["outletId"])
      .index("by_client", ["clientId"])
      .index("by_status", ["status"])
      .index("by_order_number", ["orderNumber"]),

    // Order Items
    orderItems: defineTable({
      orderId: v.id("orders"),
      productId: v.id("products"),
      quantity: v.number(),
      unitType: v.optional(v.string()), // e.g., "Sample 250ml", "1L Bottle", "5L Can"
      unitPrice: v.optional(v.number()),
      totalPrice: v.optional(v.number()),
    }).index("by_order", ["orderId"])
      .index("by_product", ["productId"]),

    // Stock Movements (in/out tracking)
    stockMovements: defineTable({
      productId: v.id("products"),
      locationId: v.id("locations"),
      movementType: v.union(
        v.literal("inbound"),
        v.literal("outbound"),
        v.literal("adjustment"),
        v.literal("transfer")
      ),
      quantity: v.number(),
      unitType: v.optional(v.string()), // e.g., "Sample 250ml", "1L Bottle", "5L Can"
      fromLocationId: v.optional(v.id("locations")),
      toLocationId: v.optional(v.id("locations")),
      orderId: v.optional(v.id("orders")),
      referenceNumber: v.optional(v.string()),
      notes: v.optional(v.string()),
      performedBy: v.id("users"),
      movementDate: v.number(),
    }).index("by_product", ["productId"])
      .index("by_location", ["locationId"])
      .index("by_type", ["movementType"])
      .index("by_order", ["orderId"]),

    // Inventory Corrections Log
    inventoryCorrections: defineTable({
      productId: v.id("products"),
      locationId: v.id("locations"),
      oldQuantity: v.number(),
      newQuantity: v.number(),
      adjustment: v.number(),
      adjustmentType: v.union(v.literal("add"), v.literal("subtract")),
      reason: v.string(),
      performedBy: v.id("users"),
      correctionDate: v.number(),
    }).index("by_product", ["productId"])
      .index("by_location", ["locationId"])
      .index("by_date", ["correctionDate"]),

    // Alerts
    alerts: defineTable({
      type: v.union(
        v.literal("low_stock"),
        v.literal("out_of_stock"),
        v.literal("overstock")
      ),
      productId: v.id("products"),
      locationId: v.id("locations"),
      currentQuantity: v.number(),
      threshold: v.number(),
      isResolved: v.boolean(),
      resolvedAt: v.optional(v.number()),
    }).index("by_type", ["type"])
      .index("by_product", ["productId"])
      .index("by_location", ["locationId"])
      .index("by_resolved", ["isResolved"]),

    // Expenses
    expenses: defineTable({
      date: v.number(),
      category: v.union(
        v.literal("delivery"),
        v.literal("operational"),
        v.literal("other")
      ),
      vendor: v.string(),
      description: v.string(),
      amount: v.number(),
      paymentMode: v.string(),
      orderId: v.optional(v.id("orders")),
      outletId: v.optional(v.id("outlets")),
      notes: v.optional(v.string()),
      createdBy: v.id("users"),
    }).index("by_category", ["category"])
      .index("by_order", ["orderId"])
      .index("by_outlet", ["outletId"])
      .index("by_date", ["date"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
