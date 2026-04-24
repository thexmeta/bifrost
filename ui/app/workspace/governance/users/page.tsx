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
import { Users } from "lucide-react";

// import UsersView from "@enterprise/components/user-groups/usersView";

// export default function GovernanceUsersPage() {
// 	return (
// 		<div className="mx-auto w-full max-w-7xl">
// 			<UsersView />
// 		</div>
// 	);
// }

export default function GovernanceUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage users</p>
      </div>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          Manage users in your organization, assign roles, and configure access
          permissions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Users Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Add your first user to start managing access to your organization
            </p>
            <Button>Add User</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
