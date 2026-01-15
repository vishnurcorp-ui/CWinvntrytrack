import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Package, TrendingUp, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Inventory() {
  const viewer = useQuery(api.users.currentUser);
  const inventory = useQuery(api.inventory.list);
  const lowStockItems = useQuery(api.inventory.getLowStock);
  const [adjustingItem, setAdjustingItem] = useState<any>(null);
  const removeInventory = useMutation(api.inventory.remove);

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this inventory record? This action cannot be undone.")) {
      try {
        await removeInventory({ id });
        toast("Inventory record deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete inventory record");
      }
    }
  };

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
          <div className="flex items-center justify-between h-14">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
            <div className="flex gap-2">
              <Link to="/corrections">
                <Button size="sm" variant="outline" className="gap-2 text-xs">
                  <Edit2 className="h-3.5 w-3.5" />
                  Corrections Log
                </Button>
              </Link>
              <Link to="/stock-movements">
                <Button size="sm" className="gap-2 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Stock Movements
                </Button>
              </Link>
            </div>
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
                    <TableHead className="text-xs">Reorder Threshold</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
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
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.product?.reorderLevel}
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
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAdjustingItem(item)}
                              className="h-7 px-2"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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

      <Dialog open={!!adjustingItem} onOpenChange={() => setAdjustingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
          </DialogHeader>
          {adjustingItem && (
            <AdjustInventoryForm
              item={adjustingItem}
              onSuccess={() => setAdjustingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdjustInventoryForm({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const adjustQuantity = useMutation(api.inventory.adjustQuantity);
  const updateProduct = useMutation(api.products.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const adjustment = adjustmentType === "add" ? amount : -amount;
    const reason = formData.get("reason") as string;
    const newReorderLevel = Number(formData.get("reorderLevel"));

    try {
      // Update inventory quantity
      await adjustQuantity({
        productId: item.productId,
        locationId: item.locationId,
        adjustment,
        reason,
      });

      // Update reorder level if changed
      if (newReorderLevel !== item.product?.reorderLevel) {
        await updateProduct({
          id: item.productId,
          reorderLevel: newReorderLevel,
        });
      }

      toast("Inventory adjusted successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to adjust inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Product</p>
        <p className="text-sm font-medium">{item.product?.name} ({item.product?.sku})</p>
        <p className="text-xs text-muted-foreground">
          {item.location?.name} - Current: {item.quantity}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adjustment-type" className="text-xs">Adjustment Type *</Label>
        <Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as typeof adjustmentType)}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Add Stock</SelectItem>
            <SelectItem value="subtract">Subtract Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-xs">Quantity *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="Enter quantity"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="text-xs">Reason *</Label>
        <Input
          id="reason"
          name="reason"
          placeholder="e.g., Stock correction, damage, etc."
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reorderLevel" className="text-xs">Reorder Threshold *</Label>
        <Input
          id="reorderLevel"
          name="reorderLevel"
          type="number"
          min="0"
          step="1"
          defaultValue={item.product?.reorderLevel || 0}
          placeholder="Enter reorder threshold"
          required
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Set the threshold level for when to reorder this product
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSuccess}
          disabled={isSubmitting}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Adjusting..." : "Adjust Inventory"}
        </Button>
      </div>
    </form>
  );
}
