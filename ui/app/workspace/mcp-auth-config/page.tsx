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
import { ShieldUser } from "lucide-react";
import MCPAuthConfigView from "@enterprise/components/mcp-auth-config/mcpAuthConfigView";

// export default function MCPAuthConfigPage() {
// 	return (
// 		<div className="mx-auto flex w-full max-w-7xl">
// 			<MCPAuthConfigView />
// 		</div>
// 	);
// }

export default function MCPAuthConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MCP Auth Configuration</h1>
        <p className="text-muted-foreground">
          Configure authentication for MCP servers
        </p>
      </div>

      <Alert>
        <ShieldUser className="h-4 w-4" />
        <AlertDescription>
          MCP Authentication allows you to secure connections to MCP servers
          using OAuth 2.0 and other authentication methods.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Configurations</CardTitle>
          <CardDescription>
            Manage your MCP server authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldUser className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              No Auth Configurations Yet
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first authentication configuration to secure MCP
              server connections
            </p>
            <Button>Create Auth Configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
