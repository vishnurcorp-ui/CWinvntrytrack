import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Warehouse } from "lucide-react";
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

export default function Locations() {
  const viewer = useQuery(api.users.currentUser);
  const locations = useQuery(api.locations.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (viewer === undefined || locations === undefined) {
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
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                </DialogHeader>
                <AddLocationForm onSuccess={() => setIsDialogOpen(false)} />
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
            <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage warehouses and HQ locations
            </p>
          </div>

          {locations.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No locations yet</p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Your First Location
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location._id}>
                      <TableCell className="text-xs font-medium">
                        {location.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 bg-secondary">
                          {location.type === 'hq' ? 'HQ' : 'Warehouse'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <div>{location.city}</div>
                          <div className="text-muted-foreground">{location.state}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {location.contactPerson && (
                          <div>
                            <div>{location.contactPerson}</div>
                            <div>{location.contactPhone}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 ${
                          location.isActive ? 'bg-secondary' : 'bg-muted'
                        }`}>
                          {location.isActive ? 'Active' : 'Inactive'}
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

function AddLocationForm({ onSuccess }: { onSuccess: () => void }) {
  const createLocation = useMutation(api.locations.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"hq" | "warehouse">("warehouse");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type,
      state: formData.get("state") as string,
      city: formData.get("city") as string,
      address: formData.get("address") as string,
      contactPerson: formData.get("contactPerson") as string,
      contactPhone: formData.get("contactPhone") as string,
    };

    try {
      await createLocation(data);
      toast("Location created successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to create location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs">Location Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Bangalore Warehouse"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-xs">Type *</Label>
        <Select value={type} onValueChange={(value) => setType(value as "hq" | "warehouse")}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hq">HQ</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-xs">City *</Label>
          <Input
            id="city"
            name="city"
            placeholder="e.g., Bangalore"
            required
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state" className="text-xs">State *</Label>
          <Input
            id="state"
            name="state"
            placeholder="e.g., Karnataka"
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-xs">Address</Label>
        <Input
          id="address"
          name="address"
          placeholder="Full address"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson" className="text-xs">Contact Person</Label>
          <Input
            id="contactPerson"
            name="contactPerson"
            placeholder="Name"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="text-xs">Contact Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            placeholder="Phone number"
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
          {isSubmitting ? "Creating..." : "Create Location"}
        </Button>
      </div>
    </form>
  );
}
