import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Package } from "lucide-react";
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

export default function Products() {
  const viewer = useQuery(api.users.currentUser);
  const products = useQuery(api.products.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (viewer === undefined || products === undefined) {
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
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <AddProductForm onSuccess={() => setIsDialogOpen(false)} />
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
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your product catalog and SKUs
            </p>
          </div>

          {products.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No products yet</p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Unit</TableHead>
                    <TableHead className="text-xs">Reorder Level</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="text-xs font-mono">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {product.category}
                      </TableCell>
                      <TableCell className="text-xs">
                        {product.unit}
                      </TableCell>
                      <TableCell className="text-xs">
                        {product.reorderLevel}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 ${
                          product.isActive ? 'bg-secondary' : 'bg-muted'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
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

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const createProduct = useMutation(api.products.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      sku: formData.get("sku") as string,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      unit: formData.get("unit") as string,
      reorderLevel: Number(formData.get("reorderLevel")),
    };

    try {
      await createProduct(data);
      toast("Product created successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sku" className="text-xs">SKU *</Label>
        <Input
          id="sku"
          name="sku"
          placeholder="e.g., CLN-001"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs">Product Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Floor Cleaner"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-xs">Category *</Label>
        <Input
          id="category"
          name="category"
          placeholder="e.g., Floor Cleaning"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Product description"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit" className="text-xs">Unit *</Label>
          <Input
            id="unit"
            name="unit"
            placeholder="e.g., Liters"
            required
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderLevel" className="text-xs">Reorder Level *</Label>
          <Input
            id="reorderLevel"
            name="reorderLevel"
            type="number"
            min="0"
            placeholder="e.g., 50"
            required
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
        <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
