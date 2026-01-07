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
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";

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
    { name: "Locations", path: "/locations", icon: Warehouse },
    { name: "Clients", path: "/clients", icon: Users },
    { name: "Outlets", path: "/outlets", icon: MapPin },
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

  if (stats === undefined || recentOrders === undefined || lowStockItems === undefined) {
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
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
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
    </div>
  );
}
