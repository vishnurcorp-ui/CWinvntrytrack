import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Navigate, Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  LogOut,
  BarChart3,
  MapPin,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.currentUser);
  const location = useLocation();

  if (viewer === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer === null) {
    return <Navigate to="/auth" />;
  }

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: BarChart3 },
    { name: "Inventory", path: "/inventory", icon: Package },
    { name: "Products", path: "/products", icon: Package },
    { name: "Stock", path: "/stock-movements", icon: TrendingUp },
    { name: "Orders", path: "/orders", icon: ShoppingCart },
    { name: "Expenses", path: "/expenses", icon: DollarSign },
    { name: "Locations", path: "/locations", icon: Warehouse },
    { name: "Clients & Outlets", path: "/clients-outlets", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-medium text-sm">Inventory System</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-2 text-xs"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                {viewer.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="gap-2 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardContent />
        </motion.div>
      </main>
    </div>
  );
}

function DashboardContent() {
  const stats = useQuery(api.dashboard.getStats);
  const recentOrders = useQuery(api.dashboard.getRecentOrders);
  const lowStockItems = useQuery(api.dashboard.getLowStockSummary);
  const pendingOrdersList = useQuery(api.dashboard.getPendingOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showAllPending, setShowAllPending] = useState(false);
  const selectedOrder = useQuery(
    api.orders.getById,
    selectedOrderId ? { id: selectedOrderId as any } : "skip"
  );

  if (stats === undefined || recentOrders === undefined || lowStockItems === undefined || pendingOrdersList === undefined) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const { activeProducts, totalStock, lowStockCount, pendingOrders } = stats;

  const statsDisplay = [
    { label: "Active Products", value: activeProducts, icon: Package },
    { label: "Total Stock Items", value: totalStock, icon: Warehouse },
    { label: "Low Stock Alerts", value: lowStockCount, icon: AlertTriangle, alert: lowStockCount > 0 },
    { label: "Pending Orders", value: pendingOrders, icon: ShoppingCart },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time inventory tracking and management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`bg-card border border-border p-4 ${stat.alert ? 'border-destructive' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.alert ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-destructive/10 border border-destructive/20 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Low Stock Alert</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} running low on stock.
                <Link to="/inventory" className="underline ml-1">View details</Link>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {pendingOrders > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border"
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setShowAllPending(!showAllPending)}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Pending Orders</h3>
                <p className="text-xs text-muted-foreground">
                  {pendingOrders} order{pendingOrders > 1 ? 's' : ''} awaiting processing
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              {showAllPending ? 'Hide' : 'View All'}
            </Button>
          </div>

          {showAllPending && (
            <div className="border-t border-border p-4 space-y-1 max-h-96 overflow-y-auto">
              {pendingOrdersList.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer rounded"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.client?.name} - {order.outlet?.name}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <h2 className="text-base font-medium mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors px-2 -mx-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.client?.name} - {order.outlet?.name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 ${
                    order.status === 'delivered' ? 'bg-secondary' :
                    order.status === 'pending' ? 'bg-muted' :
                    'bg-accent'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="text-base font-medium mb-4">Low Stock Items</h2>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">All stock levels are healthy</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.location?.name}
                    </p>
                  </div>
                  <span className="text-xs text-destructive font-medium">
                    {item.quantity} {item.product?.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderDetailsView order={selectedOrder} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetailsView({ order }: { order: any }) {
  const totalAmount = order.items?.reduce(
    (sum: number, item: any) => sum + (item.totalPrice || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Order Header Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Order Number</p>
            <p className="text-sm font-medium font-mono">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-medium">{order.client?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outlet</p>
            <p className="text-sm font-medium">{order.outlet?.name}</p>
            <p className="text-xs text-muted-foreground">
              {order.outlet?.address}, {order.outlet?.city}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <span className={`text-xs px-2 py-1 inline-block mt-1 capitalize ${
              order.status === 'delivered' ? 'bg-secondary' :
              order.status === 'pending' ? 'bg-muted' :
              order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
              'bg-accent'
            }`}>
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Order Date</p>
            <p className="text-sm">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
          {order.expectedDeliveryDate && (
            <div>
              <p className="text-xs text-muted-foreground">Expected Delivery</p>
              <p className="text-sm">{new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
            </div>
          )}
          {order.actualDeliveryDate && (
            <div>
              <p className="text-xs text-muted-foreground">Actual Delivery</p>
              <p className="text-sm">{new Date(order.actualDeliveryDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      <div>
        <h3 className="text-sm font-medium mb-3">Order Items</h3>
        <div className="border border-border rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs">SKU</TableHead>
                <TableHead className="text-xs text-right">Ordered</TableHead>
                {(order.status === 'partially_delivered' || order.status === 'delivered') && (
                  <>
                    <TableHead className="text-xs text-right">Delivered</TableHead>
                    <TableHead className="text-xs text-right">Remaining</TableHead>
                  </>
                )}
                <TableHead className="text-xs">Unit Type</TableHead>
                <TableHead className="text-xs text-right">Unit Price</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item: any) => {
                const delivered = item.deliveredQuantity || 0;
                const remaining = item.quantity - delivered;
                return (
                  <TableRow key={item._id}>
                    <TableCell className="text-xs font-medium">
                      {item.product?.name}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {item.product?.sku}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {item.quantity}
                    </TableCell>
                    {(order.status === 'partially_delivered' || order.status === 'delivered') && (
                      <>
                        <TableCell className="text-xs text-right text-green-600 font-medium">
                          {delivered}
                        </TableCell>
                        <TableCell className={`text-xs text-right font-medium ${remaining > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {remaining}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-xs text-muted-foreground">
                      {item.unitType || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      {item.totalPrice ? `$${item.totalPrice.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delivery History */}
      {order.deliveries && order.deliveries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Delivery History</h3>
          <div className="space-y-3">
            {order.deliveries.map((delivery: any) => (
              <div key={delivery._id} className="border border-border rounded p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Delivery #{delivery.deliveryNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(delivery.deliveryDate).toLocaleDateString()} at {new Date(delivery.deliveryDate).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Location: {delivery.location?.name}
                    </p>
                    {delivery.deliveredByUser && (
                      <p className="text-xs text-muted-foreground">
                        By: {delivery.deliveredByUser.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Items Delivered:</p>
                  {delivery.items.map((deliveryItem: any) => {
                    const orderItem = order.items?.find((oi: any) => oi._id === deliveryItem.orderItemId);
                    return (
                      <div key={deliveryItem.orderItemId} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                        <span>{orderItem?.product?.name}</span>
                        <span className="font-medium text-green-600">
                          {deliveryItem.quantityDelivered} {orderItem?.product?.unit || orderItem?.unitType}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {delivery.notes && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Notes: {delivery.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Total */}
      {totalAmount > 0 && (
        <div className="flex justify-end">
          <div className="bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm bg-muted p-3 rounded">{order.notes}</p>
        </div>
      )}

      {/* Contact Information */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-3">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Client Contact</p>
            <p className="font-medium">{order.client?.contactPerson}</p>
            <p className="text-muted-foreground">{order.client?.contactPhone}</p>
            {order.client?.contactEmail && (
              <p className="text-muted-foreground">{order.client?.contactEmail}</p>
            )}
          </div>
          {order.outlet?.contactPerson && (
            <div>
              <p className="text-muted-foreground">Outlet Contact</p>
              <p className="font-medium">{order.outlet?.contactPerson}</p>
              {order.outlet?.contactPhone && (
                <p className="text-muted-foreground">{order.outlet?.contactPhone}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
