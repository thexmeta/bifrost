"use client";
import MCPToolGroups from "@enterprise/components/mcp-tool-groups/mcpToolGroups";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToolCase } from "lucide-react";

export default function MCPToolGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MCP Tool Groups</h1>
        <p className="text-muted-foreground">
          Organize and govern MCP tools across your organization
        </p>
      </div>

      <Alert>
        <ToolCase className="h-4 w-4" />
        <AlertDescription>
          MCP Tool Groups allow you to organize tools from different MCP servers
          into logical groups and apply governance policies across your
          organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Tool Groups</CardTitle>
          <CardDescription>Manage your MCP tool groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ToolCase className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Tool Groups Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first tool group to organize MCP tools from different
              servers
            </p>
            <Button>Create Tool Group</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    // <div className="mx-auto w-full max-w-7xl">
    // 	<MCPToolGroups />
    // </div>
  );
}
