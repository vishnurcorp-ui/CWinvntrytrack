import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Navigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Corrections() {
  const viewer = useQuery(api.users.currentUser);
  const corrections = useQuery(api.inventoryCorrections.list);

  if (viewer === undefined || corrections === undefined) {
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
            <Link to="/inventory">
              <Button variant="ghost" size="sm" className="gap-2 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Inventory
              </Button>
            </Link>
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
            <h1 className="text-2xl font-semibold tracking-tight">Inventory Corrections Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete history of all inventory adjustments and corrections
            </p>
          </div>

          {corrections.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No corrections recorded yet</p>
            </div>
          ) : (
            <div className="bg-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date & Time</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Old Qty</TableHead>
                    <TableHead className="text-xs">Adjustment</TableHead>
                    <TableHead className="text-xs">New Qty</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                    <TableHead className="text-xs">Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corrections.map((correction) => (
                    <TableRow key={correction._id}>
                      <TableCell className="text-xs">
                        {new Date(correction.correctionDate).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{correction.product?.name}</div>
                        <div className="text-muted-foreground">{correction.product?.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{correction.location?.name}</div>
                        <div className="text-muted-foreground">
                          {correction.location?.city}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {correction.adjustmentType === "add" ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            Add
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-3 w-3" />
                            Subtract
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {correction.oldQuantity}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <span className={correction.adjustmentType === "add" ? "text-green-600" : "text-red-600"}>
                          {correction.adjustmentType === "add" ? "+" : ""}{correction.adjustment}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {correction.newQuantity}
                      </TableCell>
                      <TableCell className="text-xs">
                        {correction.reason}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {correction.user?.name || correction.user?.email}
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
