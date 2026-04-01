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
import { ScrollText } from "lucide-react";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          View audit trail and compliance logs
        </p>
      </div>

      <Alert>
        <ScrollText className="h-4 w-4" />
        <AlertDescription>
          Audit logs provide an immutable record of all administrative actions
          for compliance with SOC 2, GDPR, HIPAA, and ISO 27001 requirements.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>View and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ScrollText className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Audit Logs Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Audit logs will appear here once administrative actions are
              performed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
