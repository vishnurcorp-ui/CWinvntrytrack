import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft, Plus } from "lucide-react";
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
                <DialogContent>
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
                <DialogContent>
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
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
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
                        {movement.movementType === 'outbound' ? '-' : '+'}{movement.quantity} {movement.product?.unit}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function StockInForm({ onSuccess }: { onSuccess: () => void }) {
  const recordInbound = useMutation(api.stockMovements.recordInbound);
  const products = useQuery(api.products.list);
  const locations = useQuery(api.locations.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      productId: selectedProduct as any,
      locationId: selectedLocation as any,
      quantity: Number(formData.get("quantity")),
      referenceNumber: formData.get("referenceNumber") as string,
      notes: formData.get("notes") as string,
    };

    try {
      await recordInbound(data);
      toast("Stock in recorded successfully");
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
        <Label htmlFor="product" className="text-xs">Product *</Label>
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
        <Label htmlFor="quantity" className="text-xs">Quantity *</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g., 100"
          required
          className="text-sm"
        />
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
        <Button type="submit" size="sm" disabled={isSubmitting || !selectedProduct || !selectedLocation} className="text-xs">
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      productId: selectedProduct as any,
      locationId: selectedLocation as any,
      quantity: Number(formData.get("quantity")),
      notes: formData.get("notes") as string,
    };

    try {
      await recordOutbound(data);
      toast("Stock out recorded successfully");
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
        <Label htmlFor="product-out" className="text-xs">Product *</Label>
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
        <Label htmlFor="quantity-out" className="text-xs">Quantity *</Label>
        <Input
          id="quantity-out"
          name="quantity"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g., 50"
          required
          className="text-sm"
        />
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
        <Button type="submit" size="sm" disabled={isSubmitting || !selectedProduct || !selectedLocation} className="text-xs">
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

      <div className="space-y-2">
        <Label htmlFor="quantity-transfer" className="text-xs">Quantity *</Label>
        <Input
          id="quantity-transfer"
          name="quantity"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g., 25"
          required
          className="text-sm"
        />
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
