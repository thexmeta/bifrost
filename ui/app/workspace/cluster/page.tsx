"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Network } from "lucide-react";

export default function ClusterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cluster Configuration</h1>
        <p className="text-muted-foreground">
          Manage Bifrost cluster for high availability
        </p>
      </div>

      <Alert>
        <Network className="h-4 w-4" />
        <AlertDescription>
          Clustering enables high-availability deployments with automatic
          service discovery, gossip-based synchronization, and zero-downtime
          deployments.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Nodes</CardTitle>
          <CardDescription>
            Manage cluster nodes and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Cluster Not Configured</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Configure clustering to enable high-availability across multiple
              nodes
            </p>
            <Button>Configure Cluster</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
