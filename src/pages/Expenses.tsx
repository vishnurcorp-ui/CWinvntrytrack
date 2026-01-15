import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, DollarSign, Edit2, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export default function Expenses() {
  const viewer = useQuery(api.users.currentUser);
  const expenses = useQuery(api.expenses.list);
  const totals = useQuery(api.expenses.getTotalByCategory);
  const orders = useQuery(api.orders.list);
  const outlets = useQuery(api.outlets.list);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const removeExpense = useMutation(api.expenses.remove);

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      try {
        await removeExpense({ id });
        toast("Expense deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete expense");
      }
    }
  };

  if (viewer === undefined || expenses === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer === null) {
    return <Navigate to="/auth" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Expense
            </Button>
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
            <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track delivery and operational expenses
            </p>
          </div>

          {totals && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.total)}</p>
              </div>
              <div className="bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Delivery</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.delivery)}</p>
              </div>
              <div className="bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Operational</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.operational)}</p>
              </div>
              <div className="bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Other</p>
                <p className="text-xl font-semibold">{formatCurrency(totals.other)}</p>
              </div>
            </div>
          )}

          {expenses.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Vendor</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Client/Outlet</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Payment</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="text-xs">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        {expense.category}
                      </TableCell>
                      <TableCell className="text-xs">{expense.vendor}</TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <div>{expense.description}</div>
                          {expense.notes && (
                            <div className="text-muted-foreground text-xs">
                              {expense.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {expense.client && expense.outlet ? (
                          <div>
                            <div className="font-medium">{expense.client.name}</div>
                            <div className="text-muted-foreground">
                              {expense.outlet.name}
                            </div>
                          </div>
                        ) : expense.order ? (
                          <div className="text-muted-foreground">
                            Order #{expense.order.orderNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {expense.paymentMode}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingExpense(expense)}
                            className="h-7 px-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense._id)}
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            orders={orders || []}
            outlets={outlets || []}
            onSuccess={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              orders={orders || []}
              outlets={outlets || []}
              onSuccess={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExpenseForm({
  expense,
  orders,
  outlets,
  onSuccess,
}: {
  expense?: any;
  orders: any[];
  outlets: any[];
  onSuccess: () => void;
}) {
  const createExpense = useMutation(api.expenses.create);
  const updateExpense = useMutation(api.expenses.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const date = new Date(formData.get("date") as string).getTime();
    const category = formData.get("category") as "delivery" | "operational" | "other";
    const vendor = formData.get("vendor") as string;
    const description = formData.get("description") as string;
    const amount = Number(formData.get("amount"));
    const paymentMode = formData.get("paymentMode") as string;
    const notes = formData.get("notes") as string;

    const orderIdValue = formData.get("orderId") as string;
    const outletIdValue = formData.get("outletId") as string;

    try {
      if (expense) {
        await updateExpense({
          id: expense._id,
          date,
          category,
          vendor,
          description,
          amount,
          paymentMode,
          orderId: orderIdValue && orderIdValue !== "none" ? orderIdValue as any : undefined,
          outletId: outletIdValue && outletIdValue !== "none" ? outletIdValue as any : undefined,
          notes: notes || undefined,
        });
        toast("Expense updated successfully");
      } else {
        await createExpense({
          date,
          category,
          vendor,
          description,
          amount,
          paymentMode,
          orderId: orderIdValue && orderIdValue !== "none" ? orderIdValue as any : undefined,
          outletId: outletIdValue && outletIdValue !== "none" ? outletIdValue as any : undefined,
          notes: notes || undefined,
        });
        toast("Expense added successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultDate = expense
    ? new Date(expense.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date" className="text-xs">Date *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultDate}
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-xs">Category *</Label>
        <Select name="category" defaultValue={expense?.category || "delivery"} required>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor" className="text-xs">Vendor/Platform *</Label>
        <Input
          id="vendor"
          name="vendor"
          placeholder="e.g., Uber, Porter, etc."
          defaultValue={expense?.vendor}
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs">Description *</Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g., Local delivery, Intercity consignment"
          defaultValue={expense?.description}
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-xs">Amount (₹) *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="1"
          placeholder="Enter amount"
          defaultValue={expense?.amount}
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMode" className="text-xs">Payment Mode *</Label>
        <Input
          id="paymentMode"
          name="paymentMode"
          placeholder="e.g., Cash, UPI, Card"
          defaultValue={expense?.paymentMode}
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderId" className="text-xs">Link to Order (Optional)</Label>
        <Select name="orderId" defaultValue={expense?.orderId || "none"}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {orders.map((order) => (
              <SelectItem key={order._id} value={order._id}>
                #{order.orderNumber} - {order.outlet?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outletId" className="text-xs">Link to Outlet (Optional)</Label>
        <Select name="outletId" defaultValue={expense?.outletId || "none"}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select outlet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {outlets.map((outlet) => (
              <SelectItem key={outlet._id} value={outlet._id}>
                {outlet.name} - {outlet.client?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Additional details..."
          defaultValue={expense?.notes}
          className="text-sm resize-none"
          rows={2}
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
        <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
