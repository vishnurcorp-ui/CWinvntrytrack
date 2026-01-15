import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Plus, Edit, Trash2 } from "lucide-react";
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

export default function Outlets({ embedded = false }: { embedded?: boolean }) {
  const viewer = useQuery(api.users.currentUser);
  const outlets = useQuery(api.outlets.list);
  const clients = useQuery(api.clients.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const removeOutlet = useMutation(api.outlets.remove);

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this outlet? This will mark it as inactive.")) {
      try {
        await removeOutlet({ id });
        toast("Outlet deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete outlet");
      }
    }
  };

  if (viewer === undefined || outlets === undefined || clients === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer === null) {
    return <Navigate to="/auth" />;
  }

  // Filter outlets by selected client
  const filteredOutlets = selectedClientId === "all"
    ? outlets
    : outlets.filter(outlet => outlet.client?._id === selectedClientId);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Outlets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage client outlet locations and branches
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add Outlet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Outlet</DialogTitle>
                </DialogHeader>
                <AddOutletForm
                  clients={clients}
                  onSuccess={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {outlets.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Label htmlFor="client-filter" className="text-xs mb-2 block">Filter by Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients ({outlets.length} outlets)</SelectItem>
                    {clients?.filter(c => c.isActive).map((client) => {
                      const clientOutletCount = outlets.filter(o => o.client?._id === client._id).length;
                      return (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name} ({clientOutletCount} {clientOutletCount === 1 ? 'outlet' : 'outlets'})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground pt-6">
                Showing {filteredOutlets.length} of {outlets.length} outlets
              </div>
            </div>
          )}

          {outlets.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No outlets yet</p>
              {clients.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">You need to add a client first</p>
                  <Link to="/clients">
                    <Button size="sm" className="gap-2 text-xs">
                      Go to Clients
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Add Your First Outlet
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Outlet Name</TableHead>
                    <TableHead className="text-xs">Code</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOutlets.map((outlet) => (
                    <TableRow key={outlet._id}>
                      <TableCell className="text-xs font-medium">
                        {outlet.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {outlet.code || <span className="text-muted-foreground">Auto</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {outlet.client?.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <div>{outlet.city}, {outlet.state}</div>
                          <div className="text-muted-foreground">{outlet.address}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {outlet.contactPerson && (
                          <div>
                            <div>{outlet.contactPerson}</div>
                            <div>{outlet.contactPhone}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 ${
                          outlet.isActive ? 'bg-secondary' : 'bg-muted'
                        }`}>
                          {outlet.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOutlet(outlet)}
                            className="h-7 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(outlet._id)}
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

          <Dialog open={!!editingOutlet} onOpenChange={() => setEditingOutlet(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Outlet</DialogTitle>
              </DialogHeader>
              {editingOutlet && (
                <EditOutletForm
                  outlet={editingOutlet}
                  onSuccess={() => setEditingOutlet(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
  );

  if (embedded) {
    return content;
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </main>
    </div>
  );
}

function EditOutletForm({ outlet, onSuccess }: { outlet: any; onSuccess: () => void }) {
  const updateOutlet = useMutation(api.outlets.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const data = {
      id: outlet._id,
      name: formData.get("name") as string,
      code: code || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      address: formData.get("address") as string,
      contactPerson: formData.get("contactPerson") as string,
      contactPhone: formData.get("contactPhone") as string,
    };

    try {
      await updateOutlet(data);
      toast("Outlet updated successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to update outlet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-xs">Outlet Name *</Label>
        <Input
          id="edit-name"
          name="name"
          defaultValue={outlet.name}
          placeholder="e.g., Downtown Branch"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-code" className="text-xs">Outlet Code</Label>
        <Input
          id="edit-code"
          name="code"
          defaultValue={outlet.code || ""}
          placeholder="e.g., MPC, KRA (2-4 letters)"
          maxLength={4}
          className="text-sm uppercase"
          style={{ textTransform: 'uppercase' }}
        />
        <p className="text-xs text-muted-foreground">
          Short code for order numbers. Leave empty to auto-generate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-city" className="text-xs">City *</Label>
          <Input
            id="edit-city"
            name="city"
            defaultValue={outlet.city}
            placeholder="e.g., Bangalore"
            required
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-state" className="text-xs">State *</Label>
          <Input
            id="edit-state"
            name="state"
            defaultValue={outlet.state}
            placeholder="e.g., Karnataka"
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-address" className="text-xs">Address *</Label>
        <Input
          id="edit-address"
          name="address"
          defaultValue={outlet.address}
          placeholder="Full address"
          required
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-contactPerson" className="text-xs">Contact Person</Label>
          <Input
            id="edit-contactPerson"
            name="contactPerson"
            defaultValue={outlet.contactPerson || ""}
            placeholder="Name"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-contactPhone" className="text-xs">Contact Phone</Label>
          <Input
            id="edit-contactPhone"
            name="contactPhone"
            defaultValue={outlet.contactPhone || ""}
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
          {isSubmitting ? "Updating..." : "Update Outlet"}
        </Button>
      </div>
    </form>
  );
}

function AddOutletForm({
  clients,
  onSuccess
}: {
  clients: any[];
  onSuccess: () => void
}) {
  const createOutlet = useMutation(api.outlets.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const data = {
      clientId: selectedClient as any,
      name: formData.get("name") as string,
      code: code || undefined,
      state: formData.get("state") as string,
      city: formData.get("city") as string,
      address: formData.get("address") as string,
      contactPerson: formData.get("contactPerson") as string,
      contactPhone: formData.get("contactPhone") as string,
    };

    try {
      await createOutlet(data);
      toast("Outlet created successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to create outlet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client" className="text-xs">Client *</Label>
        <Select value={selectedClient} onValueChange={setSelectedClient} required>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client._id} value={client._id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs">Outlet Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Downtown Branch"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="text-xs">Outlet Code</Label>
        <Input
          id="code"
          name="code"
          placeholder="e.g., MPC, KRA (2-4 letters)"
          maxLength={4}
          className="text-sm uppercase"
          style={{ textTransform: 'uppercase' }}
        />
        <p className="text-xs text-muted-foreground">
          Short code for order numbers. Leave empty to auto-generate.
        </p>
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
        <Label htmlFor="address" className="text-xs">Address *</Label>
        <Input
          id="address"
          name="address"
          placeholder="Full address"
          required
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
        <Button type="submit" size="sm" disabled={isSubmitting || !selectedClient} className="text-xs">
          {isSubmitting ? "Creating..." : "Create Outlet"}
        </Button>
      </div>
    </form>
  );
}
