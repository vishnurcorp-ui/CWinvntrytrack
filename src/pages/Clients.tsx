import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Plus, Edit, Trash2 } from "lucide-react";
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

export default function Clients() {
  const viewer = useQuery(api.users.currentUser);
  const clients = useQuery(api.clients.list);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const removeClient = useMutation(api.clients.remove);

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this client? This will mark it as inactive.")) {
      try {
        await removeClient({ id });
        toast("Client deleted successfully");
      } catch (error: any) {
        toast(error.message || "Failed to delete client");
      }
    }
  };

  if (viewer === undefined || clients === undefined) {
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
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                <AddClientForm onSuccess={() => setIsDialogOpen(false)} />
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
            <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your customer base and their outlets
            </p>
          </div>

          {clients.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No clients yet</p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Client Name</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Contact Person</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell className="text-xs font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 bg-secondary capitalize">
                          {client.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {client.contactPerson}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {client.contactPhone}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {client.contactEmail || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 ${
                          client.isActive ? 'bg-secondary' : 'bg-muted'
                        }`}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingClient(client)}
                            className="h-7 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client._id)}
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

      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <EditClientForm
              client={editingClient}
              onSuccess={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditClientForm({ client, onSuccess }: { client: any; onSuccess: () => void }) {
  const updateClient = useMutation(api.clients.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: client._id,
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactEmail: formData.get("contactEmail") as string,
    };

    try {
      await updateClient(data);
      toast("Client updated successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to update client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-xs">Client Name *</Label>
        <Input
          id="edit-name"
          name="name"
          defaultValue={client.name}
          placeholder="e.g., Grand Plaza Hotel"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-contactPerson" className="text-xs">Contact Person *</Label>
        <Input
          id="edit-contactPerson"
          name="contactPerson"
          defaultValue={client.contactPerson}
          placeholder="Name"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-contactPhone" className="text-xs">Contact Phone *</Label>
        <Input
          id="edit-contactPhone"
          name="contactPhone"
          defaultValue={client.contactPhone}
          placeholder="+91-XXXXXXXXXX"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-contactEmail" className="text-xs">Contact Email</Label>
        <Input
          id="edit-contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={client.contactEmail || ""}
          placeholder="email@example.com"
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
        <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Updating..." : "Update Client"}
        </Button>
      </div>
    </form>
  );
}

function AddClientForm({ onSuccess }: { onSuccess: () => void }) {
  const createClient = useMutation(api.clients.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"hotel" | "restaurant" | "cafe" | "office" | "other">("hotel");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type,
      contactPerson: formData.get("contactPerson") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactEmail: formData.get("contactEmail") as string,
    };

    try {
      await createClient(data);
      toast("Client created successfully");
      onSuccess();
    } catch (error: any) {
      toast(error.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs">Client Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Grand Plaza Hotel"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-xs">Business Type *</Label>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="cafe">Cafe</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPerson" className="text-xs">Contact Person *</Label>
        <Input
          id="contactPerson"
          name="contactPerson"
          placeholder="Name"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone" className="text-xs">Contact Phone *</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          placeholder="+91-XXXXXXXXXX"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail" className="text-xs">Contact Email</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="email@example.com"
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
        <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Creating..." : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
