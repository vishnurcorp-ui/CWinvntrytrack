import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Plus, X } from "lucide-react";
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

export default function Orders() {
  const viewer = useQuery(api.users.currentUser);
  const orders = useQuery(api.orders.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (viewer === undefined || orders === undefined) {
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <CreateOrderForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
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
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage customer orders
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No orders yet</p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Create Your First Order
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Order #</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Outlet</TableHead>
                    <TableHead className="text-xs">Items</TableHead>
                    <TableHead className="text-xs">Order Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="text-xs font-mono">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        {order.client?.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <div className="font-medium">{order.outlet?.name}</div>
                          <div className="text-muted-foreground">
                            {order.outlet?.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {order.items?.length || 0} item(s)
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 ${
                          order.status === 'delivered' ? 'bg-secondary' :
                          order.status === 'pending' ? 'bg-muted' :
                          order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                          'bg-accent'
                        }`}>
                          {order.status}
                        </span>
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

function CreateOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const createOrder = useMutation(api.orders.create);
  const clients = useQuery(api.clients.list);
  const outlets = useQuery(api.outlets.list);
  const products = useQuery(api.products.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>>([{ productId: "", quantity: 1 }]);

  const availableOutlets = outlets?.filter(o => o.clientId === selectedClient) || [];

  const addItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validItems = orderItems.filter(item => item.productId && item.quantity > 0);

    if (validItems.length === 0) {
      toast("Please add at least one product");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      outletId: selectedOutlet as any,
      items: validItems.map(item => ({
        productId: item.productId as any,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      expectedDeliveryDate: formData.get("expectedDeliveryDate")
        ? new Date(formData.get("expectedDeliveryDate") as string).getTime()
        : undefined,
      notes: formData.get("notes") as string,
    };

    try {
      await createOrder(data);
      toast("Order created successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client" className="text-xs">Client *</Label>
        <Select value={selectedClient} onValueChange={(val) => {
          setSelectedClient(val);
          setSelectedOutlet("");
        }} required>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients?.filter(c => c.isActive).map((client) => (
              <SelectItem key={client._id} value={client._id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outlet" className="text-xs">Outlet *</Label>
        <Select value={selectedOutlet} onValueChange={setSelectedOutlet} required disabled={!selectedClient}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select outlet" />
          </SelectTrigger>
          <SelectContent>
            {availableOutlets.map((outlet) => (
              <SelectItem key={outlet._id} value={outlet._id}>
                {outlet.name} - {outlet.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Order Items *</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Product
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto border border-border p-2">
          {orderItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-end">
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
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                  className="text-xs h-8"
                  required
                />
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor={`unitPrice-${index}`} className="text-xs">Unit Price</Label>
                <Input
                  id={`unitPrice-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice || ""}
                  onChange={(e) => updateItem(index, "unitPrice", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional"
                  className="text-xs h-8"
                />
              </div>
              {orderItems.length > 1 && (
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
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedDeliveryDate" className="text-xs">Expected Delivery Date</Label>
        <Input
          id="expectedDeliveryDate"
          name="expectedDeliveryDate"
          type="date"
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
        <Button type="submit" size="sm" disabled={isSubmitting || !selectedOutlet} className="text-xs">
          {isSubmitting ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
