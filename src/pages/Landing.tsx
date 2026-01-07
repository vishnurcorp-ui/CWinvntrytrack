import { motion } from "framer-motion";
import { Package, TrendingUp, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";

export default function Landing() {
  const viewer = useQuery(api.users.currentUser);

  if (viewer === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (viewer !== null) {
    return <Navigate to="/dashboard" />;
  }

  const features = [
    {
      icon: Package,
      title: "Product Management",
      description: "Track 30+ SKUs across multiple locations in real-time",
    },
    {
      icon: TrendingUp,
      title: "Stock Movements",
      description: "Monitor inbound and outbound stock with complete traceability",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Get instant insights into inventory levels and order status",
    },
    {
      icon: Shield,
      title: "Multi-location Support",
      description: "Manage inventory across Tamil Nadu and Karnataka seamlessly",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-5xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-6 mb-16"
        >
          <div className="flex justify-center mb-6">
            <Package className="h-16 w-16" />
          </div>
          <h1 className="text-5xl font-semibold tracking-tight">
            Inventory Tracking System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time inventory management for cleaning chemical supplies across multiple locations
          </p>
          <div className="flex justify-center gap-4 pt-8">
            <Link to="/auth">
              <Button size="lg" className="text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-card border border-border p-8"
              >
                <Icon className="h-10 w-10 mb-4" />
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
