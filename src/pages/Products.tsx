import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Package, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
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
  const inventory = useQuery(api.inventory.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const removeProduct = useMutation(api.products.remove);

  if (viewer === undefined || products === undefined || inventory === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer === null) {
    return <Navigate to="/auth" />;
  }

  const getProductStock = (productId: Id<"products">) => {
    const productInventory = inventory.filter(inv => inv.productId === productId);
    return productInventory.reduce((sum, inv) => sum + inv.quantity, 0);
  };

  const handleDelete = async (id: Id<"products">) => {
    if (confirm("Are you sure you want to delete this product? This will mark it as inactive.")) {
      try {
        await removeProduct({ id });
        toast("Product deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete product");
      }
    }
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
                    <TableHead className="text-xs">Available Stock</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const totalStock = getProductStock(product._id);
                    return (
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
                      <TableCell className="text-xs font-medium">
                        {totalStock} {product.unit}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 ${
                          product.isActive ? 'bg-secondary' : 'bg-muted'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            className="h-7 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product._id)}
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

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <EditProductForm
              product={editingProduct}
              onSuccess={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
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


function EditProductForm({ product, onSuccess }: { product: any; onSuccess: () => void }) {
  const updateProduct = useMutation(api.products.update);
  const inventory = useQuery(api.inventory.list);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableStock = inventory
    ? inventory.filter(inv => inv.productId === product._id).reduce((sum, inv) => sum + inv.quantity, 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: product._id,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      unit: formData.get("unit") as string,
      reorderLevel: product.reorderLevel, // Keep existing reorder level
    };

    try {
      await updateProduct(data);
      toast("Product updated successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-xs">Product Name *</Label>
        <Input
          id="edit-name"
          name="name"
          defaultValue={product.name}
          placeholder="e.g., Floor Cleaner"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-category" className="text-xs">Category *</Label>
        <Input
          id="edit-category"
          name="category"
          defaultValue={product.category}
          placeholder="e.g., Floor Cleaning"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description" className="text-xs">Description</Label>
        <Input
          id="edit-description"
          name="description"
          defaultValue={product.description || ""}
          placeholder="Product description"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-unit" className="text-xs">Unit *</Label>
          <Input
            id="edit-unit"
            name="unit"
            defaultValue={product.unit}
            placeholder="e.g., Liters"
            required
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-availableStock" className="text-xs">Available Stock</Label>
          <Input
            id="edit-availableStock"
            type="text"
            value={`${availableStock} ${product.unit}`}
            disabled
            className="text-sm bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Stock is managed through Inventory page
          </p>
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
          {isSubmitting ? "Updating..." : "Update Product"}
        </Button>
      </div>
    </form>
  );
}
