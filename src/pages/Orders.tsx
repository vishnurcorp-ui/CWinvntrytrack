import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Plus, X, Edit, Settings, Trash2, Search } from "lucide-react";
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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderDetails, setEditingOrderDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const removeOrder = useMutation(api.orders.remove);

  // Fetch full order details when updating status
  const editingOrder = useQuery(
    api.orders.getById,
    editingOrderId ? { id: editingOrderId as any } : "skip"
  );

  // Filter orders based on search and status
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.outlet?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const handleDelete = async (order: any) => {
    if (order.status === "delivered" || order.status === "partially_delivered") {
      toast("Cannot delete orders that have been delivered. Cancel them instead.");
      return;
    }

    if (confirm(`Are you sure you want to delete order ${order.orderNumber}? This action cannot be undone.`)) {
      try {
        await removeOrder({ id: order._id });
        toast("Order deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete order");
      }
    }
  };

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

          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, client, or outlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        No orders found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
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
                        {order.itemCount || 0} item(s)
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
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOrderDetails(order)}
                            className="h-7 px-2"
                            title="Edit Order Details"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOrderId(order._id)}
                            className="h-7 px-2"
                            title="Update Status"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order)}
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            title="Delete Order"
                            disabled={order.status === "delivered" || order.status === "partially_delivered"}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </main>

      <Dialog open={!!editingOrderDetails} onOpenChange={() => setEditingOrderDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order Details</DialogTitle>
          </DialogHeader>
          {editingOrderDetails && (
            <EditOrderForm
              order={editingOrderDetails}
              onSuccess={() => setEditingOrderDetails(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingOrderId} onOpenChange={() => setEditingOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <UpdateOrderStatusForm
              order={editingOrder}
              onSuccess={() => setEditingOrderId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
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
    unitType?: string;
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
        unitType: item.unitType,
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
        <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-md p-3">
          {orderItems.map((item, index) => (
            <div key={index} className="bg-muted/50 p-2 rounded-md">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`product-${index}`} className="text-xs">Product *</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(val) => updateItem(index, "productId", val)}
                    required
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.filter(p => p.isActive).map((product) => (
                        <SelectItem key={product._id} value={product._id} className="text-xs">
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-1.5">
                  <Label htmlFor={`quantity-${index}`} className="text-xs">Qty *</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label htmlFor={`unitType-${index}`} className="text-xs">Size</Label>
                  <Select
                    value={item.unitType || ""}
                    onValueChange={(val) => updateItem(index, "unitType", val)}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250ml" className="text-xs">250ml</SelectItem>
                      <SelectItem value="1L" className="text-xs">1L</SelectItem>
                      <SelectItem value="5L" className="text-xs">5L</SelectItem>
                      <SelectItem value="20L" className="text-xs">20L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {orderItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-9 w-9 p-0 mt-6"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expectedDeliveryDate" className="text-xs">Expected Delivery (Optional)</Label>
          <Input
            id="expectedDeliveryDate"
            name="expectedDeliveryDate"
            type="date"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
          <Input
            id="notes"
            name="notes"
            placeholder="Add notes..."
            className="text-sm"
          />
        </div>
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

function UpdateOrderStatusForm({ order, onSuccess }: { order: any; onSuccess: () => void }) {
  const updateStatus = useMutation(api.orders.updateStatus);
  const markDelivered = useMutation(api.orders.markDelivered);
  const locations = useQuery(api.locations.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});

  // Initialize delivered quantities with remaining (not delivered) quantities
  useState(() => {
    if (order.items) {
      const initial: Record<string, number> = {};
      for (const item of order.items) {
        const previouslyDelivered = item.deliveredQuantity || 0;
        const remaining = item.quantity - previouslyDelivered;
        initial[item._id] = remaining; // Default to delivering all remaining
      }
      setDeliveredQuantities(initial);
    }
  });

  const statusOptions = [
    { value: "pending", label: "Pending", description: "Order has been placed but not yet processed" },
    { value: "processing", label: "Processing", description: "Order is being prepared" },
    { value: "packed", label: "Packed", description: "Order has been packed and ready for shipment" },
    { value: "shipped", label: "Shipped", description: "Order has been dispatched" },
    { value: "delivered", label: "Delivered", description: "Order has been fully delivered to customer" },
    { value: "cancelled", label: "Cancelled", description: "Order has been cancelled" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If marking as delivered OR order is already partially delivered, show delivery form
    if (selectedStatus === "delivered" && !showDeliveryForm) {
      setShowDeliveryForm(true);
      return;
    }

    // Also show delivery form if order is partially delivered and user wants to continue
    if (order.status === "partially_delivered" && selectedStatus === "delivered" && !showDeliveryForm) {
      setShowDeliveryForm(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateStatus({
        id: order._id,
        status: selectedStatus as any,
        locationId: selectedLocation ? selectedLocation as any : undefined,
      });
      toast("Order status updated successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to update order status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliverySubmit = async () => {
    if (!selectedLocation) {
      toast("Please select a warehouse location");
      return;
    }

    setIsSubmitting(true);

    try {
      const deliveredItems = Object.entries(deliveredQuantities).map(([itemId, quantity]) => ({
        itemId: itemId as any,
        deliveredQuantity: quantity,
      }));

      await markDelivered({
        id: order._id,
        locationId: selectedLocation as any,
        deliveredItems,
      });

      toast("Order marked as delivered successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to mark order as delivered");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showDeliveryForm) {
    return (
      <div className="space-y-4">
        <div className="bg-muted p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Marking order as delivered</p>
          <p className="text-sm font-medium">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {order.client?.name} - {order.outlet?.name}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-xs">Warehouse Location *</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation} required>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select warehouse to deduct inventory from" />
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
          <Label className="text-xs">
            {order.deliveries?.length > 0 ? `Delivery #${order.deliveries.length + 1}` : "Delivered Quantities"}
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            {order.deliveries?.length > 0
              ? "Enter quantities for this delivery (remaining items only)"
              : "Enter the actual quantity delivered for each item"}
          </p>
          <div className="border border-border rounded-md overflow-hidden">
            {order.items?.map((item: any) => {
              const previouslyDelivered = item.deliveredQuantity || 0;
              const remaining = item.quantity - previouslyDelivered;
              const maxDeliverable = remaining;

              return (
                <div key={item._id} className="p-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product?.name}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Ordered: {item.quantity} {item.product?.unit} {item.unitType && `(${item.unitType})`}</p>
                        {previouslyDelivered > 0 && (
                          <>
                            <p className="text-green-600">
                              ✓ Previously delivered: {previouslyDelivered} {item.product?.unit}
                            </p>
                            <p className="font-medium text-amber-600">
                              Remaining: {remaining} {item.product?.unit}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {remaining > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${item._id}`} className="text-xs whitespace-nowrap">
                          Deliver now:
                        </Label>
                        <Select
                          value={String(deliveredQuantities[item._id] || 0)}
                          onValueChange={(value) => {
                            setDeliveredQuantities(prev => ({
                              ...prev,
                              [item._id]: parseInt(value)
                            }));
                          }}
                        >
                          <SelectTrigger className="text-sm w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: maxDeliverable + 1 }, (_, i) => i).map((qty) => (
                              <SelectItem key={qty} value={String(qty)}>
                                {qty} {item.product?.unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {deliveredQuantities[item._id] < remaining && deliveredQuantities[item._id] !== undefined && (
                        <p className="text-xs text-blue-600 mt-1">
                          ℹ Will remain pending: {remaining - (deliveredQuantities[item._id] || 0)} {item.product?.unit}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Fully delivered
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Marking as delivered will:
          </p>
          <ul className="text-xs text-amber-800 list-disc list-inside mt-1">
            <li>Record the delivery date and time</li>
            <li>Deduct the <strong>delivered quantities</strong> from inventory</li>
            <li>Create stock movement records</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeliveryForm(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDeliverySubmit}
            disabled={isSubmitting || !selectedLocation}
            className="text-xs"
          >
            {isSubmitting ? "Processing..." : "Confirm Delivery"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Order Details</p>
        <p className="text-sm font-medium">{order.orderNumber}</p>
        <p className="text-xs text-muted-foreground">
          {order.client?.name} - {order.outlet?.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {order.items?.length || 0} item(s)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-xs">Order Status *</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus} required>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex flex-col">
                  <span className="font-medium capitalize">{status.label}</span>
                  <span className="text-xs text-muted-foreground">{status.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Current status: <span className="capitalize font-medium">{order.status.replace('_', ' ')}</span>
        </p>
        {order.status === "partially_delivered" && (
          <p className="text-xs text-amber-600 mt-1">
            Note: This order is partially delivered. Continue making deliveries to complete it.
          </p>
        )}
      </div>

      {selectedStatus === "delivered" && (
        <div className="bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-800">
            <strong>Partial Delivery Support:</strong> You'll be able to specify the exact quantity delivered for each item in the next step.
          </p>
        </div>
      )}

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
          {isSubmitting ? "Updating..." : (selectedStatus === "delivered" ? "Continue to Delivery" : "Update Status")}
        </Button>
      </div>
    </form>
  );
}

function EditOrderForm({ order, onSuccess }: { order: any; onSuccess: () => void }) {
  const updateOrder = useMutation(api.orders.update);
  const products = useQuery(api.products.list);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitType?: string;
    unitPrice?: number;
  }>>(
    order.items?.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitType: item.unitType,
      unitPrice: item.unitPrice,
    })) || [{ productId: "", quantity: 1 }]
  );

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
      id: order._id,
      items: validItems.map(item => ({
        productId: item.productId as any,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
      })),
      expectedDeliveryDate: formData.get("expectedDeliveryDate")
        ? new Date(formData.get("expectedDeliveryDate") as string).getTime()
        : undefined,
      notes: formData.get("notes") as string,
    };

    try {
      await updateOrder(data);
      toast("Order updated successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Order Information</p>
        <p className="text-sm font-medium">{order.orderNumber}</p>
        <p className="text-xs text-muted-foreground">
          {order.client?.name} - {order.outlet?.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Current Status: <span className="capitalize font-medium">{order.status}</span>
        </p>
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
                <Label htmlFor={`edit-product-${index}`} className="text-xs">Product</Label>
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
                <Label htmlFor={`edit-quantity-${index}`} className="text-xs">Quantity</Label>
                <Input
                  id={`edit-quantity-${index}`}
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
                <Label htmlFor={`edit-unitType-${index}`} className="text-xs">Unit Type</Label>
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
              <div className="w-24 space-y-1">
                <Label htmlFor={`edit-unitPrice-${index}`} className="text-xs">Unit Price</Label>
                <Input
                  id={`edit-unitPrice-${index}`}
                  type="number"
                  min="0"
                  step="1"
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
        <Label htmlFor="edit-expectedDeliveryDate" className="text-xs">Expected Delivery Date</Label>
        <Input
          id="edit-expectedDeliveryDate"
          name="expectedDeliveryDate"
          type="date"
          defaultValue={
            order.expectedDeliveryDate
              ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
              : ""
          }
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-notes" className="text-xs">Notes</Label>
        <Input
          id="edit-notes"
          name="notes"
          defaultValue={order.notes || ""}
          placeholder="Additional information"
          className="text-sm"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> This will update the order items, quantities, unit types, and prices. The order status will remain unchanged.
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
          {isSubmitting ? "Updating..." : "Update Order"}
        </Button>
      </div>
    </form>
  );
}
