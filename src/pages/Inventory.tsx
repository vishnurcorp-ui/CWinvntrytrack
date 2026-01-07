import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Package } from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Inventory() {
  const viewer = useQuery(api.users.currentUser);
  const inventory = useQuery(api.inventory.list);
  const lowStockItems = useQuery(api.inventory.getLowStock);

  if (viewer === undefined || inventory === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer === null) {
    return <Navigate to="/auth" />;
  }

  const lowStockIds = new Set(lowStockItems?.map(item => item._id) || []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Current stock levels across all locations
            </p>
          </div>

          {inventory.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No inventory items yet</p>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Quantity</TableHead>
                    <TableHead className="text-xs">Reorder Level</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const isLowStock = lowStockIds.has(item._id);
                    const isOutOfStock = item.quantity === 0;

                    return (
                      <TableRow key={item._id}>
                        <TableCell className="text-xs font-mono">
                          {item.product?.sku}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-muted-foreground">
                              {item.product?.category}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <div className="font-medium">{item.location?.name}</div>
                            <div className="text-muted-foreground">
                              {item.location?.city}, {item.location?.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {item.quantity} {item.product?.unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.product?.reorderLevel} {item.product?.unit}
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Healthy
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
