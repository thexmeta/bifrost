import RBACView from "@enterprise/components/rbac/rbacView";

export default function GovernanceRbacPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <RBACView />
    </div>
  );
}
("use client");

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRoundCheck } from "lucide-react";

export default function RBACPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <Alert>
        <UserRoundCheck className="h-4 w-4" />
        <AlertDescription>
          Role-Based Access Control (RBAC) allows you to define custom roles
          with specific permissions for fine-grained access management across
          your organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserRoundCheck className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Custom Roles Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first custom role to define specific permissions for
              your users
            </p>
            <Button>Create Role</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
