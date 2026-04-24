("use client");

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetCoreConfigQuery,
  useUpdateCoreConfigMutation,
} from "@/lib/store";
import {
  UserRoundCheck,
  Shield,
  Users,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// import RBACView from "@enterprise/components/rbac/rbacView";

// export default function GovernanceRbacPage() {
//   return (
//     <div className="mx-auto w-full max-w-7xl">
//       <RBACView />
//     </div>
//   );
// }

const defaultRoles = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to all resources",
    users: 1,
    color: "destructive" as const,
  },
  {
    id: "editor",
    name: "Editor",
    description: "Can create and modify resources",
    users: 0,
    color: "default" as const,
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to resources",
    users: 0,
    color: "secondary" as const,
  },
];

export default function RBACPage() {
  const { data: config, isLoading: configLoading } = useGetCoreConfigQuery({
    fromDB: true,
  });
  const [updateConfig, { isLoading: updating }] = useUpdateCoreConfigMutation();

  const rbacConfig = config?.enterprise?.rbac;
  const isRbacEnabled = rbacConfig?.enabled ?? false;
  const defaultRole = rbacConfig?.default_role ?? "viewer";

  const [enabled, setEnabled] = useState(isRbacEnabled);
  const [role, setRole] = useState(defaultRole);

  const handleSave = async () => {
    try {
      await updateConfig({
        enterprise: {
          ...(config?.enterprise ?? {}),
          rbac: { enabled, default_role: role },
        },
      }).unwrap();
      toast.success("RBAC configuration saved");
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "data" in e
          ? String((e as Record<string, unknown>).data)
          : "Failed to save RBAC configuration";
      toast.error(message);
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">
          Loading RBAC settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="rbac-page">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions for fine-grained access control
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Role-Based Access Control (RBAC) allows you to define custom roles
          with specific permissions for fine-grained access management across
          your organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>RBAC Settings</CardTitle>
          <CardDescription>
            Enable and configure role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rbac-toggle">Enable RBAC</Label>
              <p className="text-muted-foreground text-sm">
                Restrict access to resources based on user roles
              </p>
            </div>
            <Switch
              id="rbac-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
              data-testid="rbac-toggle"
            />
          </div>

          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="default-role">Default Role</Label>
              <Input
                id="default-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="viewer"
                data-testid="default-role-input"
              />
              <p className="text-muted-foreground text-sm">
                The default role assigned to new users
              </p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={updating}
            data-testid="save-rbac"
          >
            {updating ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Roles</CardTitle>
          <CardDescription>
            Built-in roles available when RBAC is enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {defaultRoles.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border p-4"
                data-testid={`role-${r.id}`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="text-muted-foreground h-5 w-5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant={r.color}>{r.id}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {r.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    <Users className="mr-1 inline h-3 w-3" />
                    {r.users} user{r.users !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
