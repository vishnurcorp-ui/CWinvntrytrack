import { useState } from "react";
import { Navigate, Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Clients from "./Clients";
import Outlets from "./Outlets";

export default function ClientsOutlets() {
  const viewer = useQuery(api.users.currentUser);
  const [activeTab, setActiveTab] = useState("clients");

  if (viewer === undefined) {
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
            <h1 className="text-sm font-medium">Clients & Outlets</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Clients & Outlets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your customers and their outlet locations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="clients" className="text-xs">
              Clients
            </TabsTrigger>
            <TabsTrigger value="outlets" className="text-xs">
              Outlets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-0">
            <ClientsContent />
          </TabsContent>

          <TabsContent value="outlets" className="mt-0">
            <OutletsContent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Wrapper component for Clients page content without navigation
function ClientsContent() {
  return <Clients embedded />;
}

// Wrapper component for Outlets page content without navigation
function OutletsContent() {
  return <Outlets embedded />;
}
