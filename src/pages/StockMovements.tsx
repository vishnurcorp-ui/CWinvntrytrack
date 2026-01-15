import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft, Plus, X, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StockMovements() {
  const viewer = useQuery(api.users.currentUser);
  const movements = useQuery(api.stockMovements.list);
  const [isInboundOpen, setIsInboundOpen] = useState(false);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any>(null);
  const removeMovement = useMutation(api.stockMovements.remove);

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this stock movement? This will reverse the inventory changes and cannot be undone.")) {
      try {
        await removeMovement({ id });
        toast("Stock movement deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete stock movement");
      }
    }
  };

  if (viewer === undefined || movements === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer === null) {
    return <Navigate to="/auth" />;
  }

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
              <Dialog open={isInboundOpen} onOpenChange={setIsInboundOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Stock In
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Stock In (Inbound)</DialogTitle>
                  </DialogHeader>
                  <StockInForm onSuccess={() => setIsInboundOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={isOutboundOpen} onOpenChange={setIsOutboundOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="gap-2 text-xs">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Stock Out
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Stock Out (Outbound)</DialogTitle>
                  </DialogHeader>
                  <StockOutForm onSuccess={() => setIsOutboundOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2 text-xs">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Stock Between Locations</DialogTitle>
                  </DialogHeader>
                  <TransferForm onSuccess={() => setIsTransferOpen(false)} />
                </DialogContent>
              </Dialog>
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
            <h1 className="text-2xl font-semibold tracking-tight">Stock Movements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all stock in, stock out, and transfers
            </p>
          </div>

          {movements.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No stock movements yet</p>
              <Button onClick={() => setIsInboundOpen(true)} size="sm" className="gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Record Your First Movement
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Quantity</TableHead>
                    <TableHead className="text-xs">Unit Type</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {movement.movementType === 'inbound' && (
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          )}
                          {movement.movementType === 'outbound' && (
                            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                          )}
                          {movement.movementType === 'transfer' && (
                            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                          )}
                          <span className="text-xs capitalize">{movement.movementType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{movement.product?.name}</div>
                        <div className="text-muted-foreground">{movement.product?.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {movement.movementType === 'outbound' ? '-' : '+'}{movement.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {movement.unitType || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {movement.movementType === 'transfer' ? (
                          <div>
                            <div>{movement.fromLocation?.name} →</div>
                            <div>{movement.toLocation?.name}</div>
                          </div>
                        ) : (
                          movement.location?.name
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(movement.movementDate).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {movement.referenceNumber || movement.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMovement(movement)}
                            className="h-7 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(movement._id)}
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </main>

      <Dialog open={!!editingMovement} onOpenChange={() => setEditingMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock Movement</DialogTitle>
          </DialogHeader>
          {editingMovement && (
            <EditMovementForm
              movement={editingMovement}
              onSuccess={() => setEditingMovement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditMovementForm({ movement, onSuccess }: { movement: any; onSuccess: () => void }) {
  const updateMovement = useMutation(api.stockMovements.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for datetime-local input
  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const dateString = formData.get("movementDate") as string;
    const movementDate = dateString ? new Date(dateString).getTime() : movement.movementDate;

    const data = {
      id: movement._id,
      quantity: Number(formData.get("quantity")),
      notes: formData.get("notes") as string,
      movementDate,
    };

    try {
      await updateMovement(data);
      toast("Stock movement updated successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to update stock movement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Movement Details</p>
        <p className="text-sm font-medium">
          {movement.product?.name} ({movement.product?.sku})
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {movement.movementType} - {movement.location?.name}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-movementDate" className="text-xs">Movement Date & Time *</Label>
        <Input
          id="edit-movementDate"
          name="movementDate"
          type="datetime-local"
          defaultValue={formatDateForInput(movement.movementDate)}
          required
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Original date: {new Date(movement.movementDate).toLocaleString()}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-quantity" className="text-xs">Quantity *</Label>
        <Input
          id="edit-quantity"
          name="quantity"
          type="number"
          min="1"
          step="1"
          defaultValue={movement.quantity}
          placeholder="Enter quantity"
          required
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Original quantity: {movement.quantity}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-notes" className="text-xs">Notes</Label>
        <Input
          id="edit-notes"
          name="notes"
          defaultValue={movement.notes || ""}
          placeholder="Update notes or reason for change"
          className="text-sm"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3">
        <p className="text-xs text-yellow-800">
          <strong>Warning:</strong> Editing the quantity will automatically adjust the inventory levels.
          The difference between the old and new quantity will be applied to the stock. You can also update the movement date to correct historical records.
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
          {isSubmitting ? "Updating..." : "Update Movement"}
        </Button>
      </div>
    </form>
  );
}

function StockInForm({ onSuccess }: { onSuccess: () => void }) {
  const recordInbound = useMutation(api.stockMovements.recordInbound);
  const products = useQuery(api.products.list);
  const locations = useQuery(api.locations.list);
  const inventory = useQuery(api.inventory.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [stockItems, setStockItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitType?: string;
  }>>([{ productId: "", quantity: 1 }]);

  const getCurrentQuantity = (productId: string, locationId: string) => {
    if (!inventory || !productId || !locationId) return 0;
    const item = inventory.find(
      (inv) => inv.productId === productId && inv.locationId === locationId
    );
    return item?.quantity || 0;
  };

  const addItem = () => {
    setStockItems([...stockItems, { productId: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setStockItems(stockItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...stockItems];
    updated[index] = { ...updated[index], [field]: value };
    setStockItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validItems = stockItems.filter(item => item.productId && item.quantity > 0);

    if (validItems.length === 0) {
      toast("Please add at least one product");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const referenceNumber = formData.get("referenceNumber") as string;
    const notes = formData.get("notes") as string;

    try {
      // Record each product separately
      for (const item of validItems) {
        await recordInbound({
          productId: item.productId as any,
          locationId: selectedLocation as any,
          quantity: item.quantity,
          unitType: item.unitType,
          referenceNumber,
          notes,
        });
      }
      toast(`Stock in recorded successfully for ${validItems.length} product(s)`);
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to record stock in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location" className="text-xs">Receiving Location *</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation} required>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations?.filter(l => l.isActive).map((location) => (
              <SelectItem key={location._id} value={location._id}>
                {location.name} - {location.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Products *</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Product
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto border border-border p-2">
          {stockItems.map((item, index) => {
            const currentQty = getCurrentQuantity(item.productId, selectedLocation);
            const newQty = currentQty + item.quantity;

            return (
              <div key={index} className="space-y-1">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`product-${index}`} className="text-xs">Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => updateItem(index, "productId", val)}
                      required
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.filter(p => p.isActive).map((product) => (
                          <SelectItem key={product._id} value={product._id} className="text-xs">
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label htmlFor={`unitType-${index}`} className="text-xs">Unit Type</Label>
                    <Select
                      value={item.unitType || ""}
                      onValueChange={(val) => updateItem(index, "unitType", val)}
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sample 250ml" className="text-xs">Sample 250ml</SelectItem>
                        <SelectItem value="1L Bottle" className="text-xs">1L Bottle</SelectItem>
                        <SelectItem value="5L Can" className="text-xs">5L Can</SelectItem>
                        <SelectItem value="20L Drum" className="text-xs">20L Drum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {stockItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {item.productId && selectedLocation && (
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Current: <span className="font-medium">{currentQty}</span> + <span className="text-green-600 font-medium">{item.quantity}</span> = <span className="font-semibold">{newQty}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceNumber" className="text-xs">Reference Number</Label>
        <Input
          id="referenceNumber"
          name="referenceNumber"
          placeholder="e.g., PO-12345"
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs">Notes</Label>
        <Input
          id="notes"
          name="notes"
          placeholder="Additional information"
          className="text-sm"
        />
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
        <Button type="submit" size="sm" disabled={isSubmitting || !selectedLocation} className="text-xs">
          {isSubmitting ? "Recording..." : "Record Stock In"}
        </Button>
      </div>
    </form>
  );
}

function StockOutForm({ onSuccess }: { onSuccess: () => void }) {
  const recordOutbound = useMutation(api.stockMovements.recordOutbound);
  const products = useQuery(api.products.list);
  const locations = useQuery(api.locations.list);
  const inventory = useQuery(api.inventory.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [stockItems, setStockItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitType?: string;
  }>>([{ productId: "", quantity: 1 }]);

  const getCurrentQuantity = (productId: string, locationId: string) => {
    if (!inventory || !productId || !locationId) return 0;
    const item = inventory.find(
      (inv) => inv.productId === productId && inv.locationId === locationId
    );
    return item?.quantity || 0;
  };

  const addItem = () => {
    setStockItems([...stockItems, { productId: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setStockItems(stockItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...stockItems];
    updated[index] = { ...updated[index], [field]: value };
    setStockItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validItems = stockItems.filter(item => item.productId && item.quantity > 0);

    if (validItems.length === 0) {
      toast("Please add at least one product");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const notes = formData.get("notes") as string;

    try {
      // Record each product separately
      for (const item of validItems) {
        await recordOutbound({
          productId: item.productId as any,
          locationId: selectedLocation as any,
          quantity: item.quantity,
          unitType: item.unitType,
          notes,
        });
      }
      toast(`Stock out recorded successfully for ${validItems.length} product(s)`);
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to record stock out");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location-out" className="text-xs">From Location *</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation} required>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations?.filter(l => l.isActive).map((location) => (
              <SelectItem key={location._id} value={location._id}>
                {location.name} - {location.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Products *</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Product
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto border border-border p-2">
          {stockItems.map((item, index) => {
            const currentQty = getCurrentQuantity(item.productId, selectedLocation);
            const newQty = currentQty - item.quantity;

            return (
              <div key={index} className="space-y-1">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`product-out-${index}`} className="text-xs">Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => updateItem(index, "productId", val)}
                      required
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.filter(p => p.isActive).map((product) => (
                          <SelectItem key={product._id} value={product._id} className="text-xs">
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label htmlFor={`quantity-out-${index}`} className="text-xs">Quantity</Label>
                    <Input
                      id={`quantity-out-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label htmlFor={`unitType-out-${index}`} className="text-xs">Unit Type</Label>
                    <Select
                      value={item.unitType || ""}
                      onValueChange={(val) => updateItem(index, "unitType", val)}
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sample 250ml" className="text-xs">Sample 250ml</SelectItem>
                        <SelectItem value="1L Bottle" className="text-xs">1L Bottle</SelectItem>
                        <SelectItem value="5L Can" className="text-xs">5L Can</SelectItem>
                        <SelectItem value="20L Drum" className="text-xs">20L Drum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {stockItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {item.productId && selectedLocation && (
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Current: <span className="font-medium">{currentQty}</span> - <span className="text-red-600 font-medium">{item.quantity}</span> = <span className={`font-semibold ${newQty < 0 ? 'text-red-600' : ''}`}>{newQty}</span>
                    {newQty < 0 && <span className="text-red-600 ml-1">(Insufficient stock!)</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes-out" className="text-xs">Notes</Label>
        <Input
          id="notes-out"
          name="notes"
          placeholder="e.g., Delivered to client outlet"
          className="text-sm"
        />
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
        <Button type="submit" size="sm" disabled={isSubmitting || !selectedLocation} className="text-xs">
          {isSubmitting ? "Recording..." : "Record Stock Out"}
        </Button>
      </div>
    </form>
  );
}

function TransferForm({ onSuccess }: { onSuccess: () => void }) {
  const recordTransfer = useMutation(api.stockMovements.recordTransfer);
  const products = useQuery(api.products.list);
  const locations = useQuery(api.locations.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      productId: selectedProduct as any,
      fromLocationId: fromLocation as any,
      toLocationId: toLocation as any,
      quantity: Number(formData.get("quantity")),
      unitType: formData.get("unitType") as string,
      notes: formData.get("notes") as string,
    };

    try {
      await recordTransfer(data);
      toast("Transfer recorded successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to record transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-transfer" className="text-xs">Product *</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products?.filter(p => p.isActive).map((product) => (
              <SelectItem key={product._id} value={product._id}>
                {product.name} ({product.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from-location" className="text-xs">From Location *</Label>
          <Select value={fromLocation} onValueChange={setFromLocation} required>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.filter(l => l.isActive && l._id !== toLocation).map((location) => (
                <SelectItem key={location._id} value={location._id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to-location" className="text-xs">To Location *</Label>
          <Select value={toLocation} onValueChange={setToLocation} required>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.filter(l => l.isActive && l._id !== fromLocation).map((location) => (
                <SelectItem key={location._id} value={location._id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity-transfer" className="text-xs">Quantity *</Label>
          <Input
            id="quantity-transfer"
            name="quantity"
            type="number"
            min="1"
            step="1"
            placeholder="e.g., 25"
            required
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitType-transfer" className="text-xs">Unit Type</Label>
          <Select name="unitType">
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sample 250ml">Sample 250ml</SelectItem>
              <SelectItem value="1L Bottle">1L Bottle</SelectItem>
              <SelectItem value="5L Can">5L Can</SelectItem>
              <SelectItem value="20L Drum">20L Drum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes-transfer" className="text-xs">Notes</Label>
        <Input
          id="notes-transfer"
          name="notes"
          placeholder="Transfer reason or details"
          className="text-sm"
        />
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
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !selectedProduct || !fromLocation || !toLocation}
          className="text-xs"
        >
          {isSubmitting ? "Recording..." : "Record Transfer"}
        </Button>
      </div>
    </form>
  );
}
